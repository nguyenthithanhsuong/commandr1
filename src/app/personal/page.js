"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/button/button";

const InfoItem = ({ label, value }) => (
    <div>
        <dt className="font-medium text-gray-500">{label}</dt>
        <dd className="mt-0.5 text-gray-900 font-semibold">{value ?? "N/A"}</dd>
    </div>
);

export default function PersonalPage() {
    const router = useRouter();

  const [formData, setFormData] = useState({
    requesttype: "",
    description: "",
  });
    const [isLoading, setIsLoading] = useState(true);

    const [tasks, setTasks] = useState([]);
    const [userID, setUserID] = useState(null);
    const [personnel, setPersonnel] = useState(null);
    const [attendance, setAttendance] = useState(null);
    const [allattendance, setAllAttendance] = useState([]);
    const [requests, setRequests] = useState([]);


    const [searchTerm, setSearchTerm] = useState("");
    const [isRequesting, setIsRequesting] = useState(false);


    const [showTasks, setShowTasks] = useState(true);
    const [showAttendance, setShowAttendance] = useState(false);
    const [showRequest, setShowRequest] = useState(false);
    
      const [isSubmitting, setIsSubmitting] = useState(false);

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        const options = { timeZone: "Asia/Bangkok" };
        const parts = date.toLocaleDateString("en-US", options).split("/");
        const [month, day, year] = parts;
        return `${month}-${day}-${year}`;
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", { timeZone: "Asia/Bangkok" });
    };

    const fetchPersonnel = useCallback(async (userID) => {
        setIsLoading(true);

        try {
            const response = await fetch("/db/dbroute", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    operation: "getPersonnelById",
                    params: { id: userID },
                }),
            });

            const data = await response.json();
            if (response.ok) setPersonnel(data.data || null);
            else router.replace("/signin");
        } catch {}

        try {
            const response = await fetch("/db/dbroute", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    operation: "getAttendanceByID",
                    params: { id: userID, type: "Today" },
                }),
            });

            const data = await response.json();
            if (response.ok) setAttendance(data.data || null);
            else router.replace("/signin");
        } catch {}

        try {
            const response = await fetch("/db/dbroute", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    operation: "getAttendanceByID",
                    params: { id: userID, type: "All" },
                }),
            });

            const data = await response.json();
            if (response.ok) setAllAttendance(data.data || []);
            else router.replace("/signin");
        } catch {}

        setIsLoading(false);
    }, [router]);

    const fetchTasks = async (userID) => {
        try {
            const response = await fetch("/db/dbroute", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    operation: "getTaskByPersonnelId",
                    params: { id: userID },
                }),
            });

            const data = await response.json();
            if (response.ok && data && data.data) {
                setTasks(data.data);
            } else {
                setTasks([]);
            }
        } catch {}
    };

    const fetchRequests = async (userID) => {
      try {
        const response = await fetch("/db/dbroute", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operation: "getRequest", params: {id: userID} }),
        });
        const data = await response.json();
        if (response.ok && data.data) {
          setRequests(data.data);
        } else {
          console.error("Failed to fetch requests:", data.error);
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
      setIsLoading(false);
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        try {
            const response = await fetch("/db/dbroute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    operation: "updateTaskStatus",
                    params: {
                        id: taskId,
                        data: { taskstatus: newStatus },
                    },
                }),
            });

            const data = await response.json();
            if (response.ok && data.success) {
                fetchTasks(userID);
            } else {
                alert("Failed to update task status.");
            }
        } catch (err) {
            console.error(err);
            alert("Error updating task.");
        }
    };

    useEffect(() => {
        let isMounted = true;

        const checkAuth = async () => {
            try {
                const response = await fetch("/api/auth/check", { credentials: "include" });

                if (!response.ok) return;

                const data = await response.json();
                if (isMounted) setUserID(data.user);
            } catch {}
        };

        checkAuth();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        if (!userID) return;
        fetchPersonnel(userID);
        fetchTasks(userID);
        fetchRequests(userID);
    }, [userID, fetchPersonnel]);

    const filteredTasks = useMemo(() => {
        if (!searchTerm) return tasks;

        const lowerCaseSearch = searchTerm.toLowerCase();

        return tasks.filter(
            (task) =>
                task.taskname.toLowerCase().includes(lowerCaseSearch) ||
                task.taskstatus.toLowerCase().includes(lowerCaseSearch) ||
                task.assignername?.toLowerCase().includes(lowerCaseSearch) ||
                task.personnelname?.toLowerCase().includes(lowerCaseSearch) ||
                task.projectname?.toLowerCase().includes(lowerCaseSearch)
        );
    }, [tasks, searchTerm]);

    const handleCheckIn = async () => {
        if (!window.confirm("Check in?")) return;

        try {
            const response = await fetch("/db/dbroute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    operation: "checkIn",
                    params: { id: userID, date: "CURDATE()" },
                }),
            });

            const data = await response.json();
            if (response.ok && data && data.success) {
                await fetchPersonnel(userID);
            } else {
                alert("Failed to check in!");
            }
        } catch {}
    };

    const handleCheckOut = async () => {
        if (!window.confirm("Check out?")) return;

        try {
            const response = await fetch("/db/dbroute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    operation: "checkOut",
                    params: { id: userID, date: "CURDATE()" },
                }),
            });

            const data = await response.json();
            if (response.ok && data && data.success) {
                await fetchPersonnel(userID);
            } else {
                alert("Failed to check out!");
            }
        } catch {}
    };

    const fields = [
    {
  label: "Request Type",
  name: "requesttype",
  type: "select",
  options: [
    "Vacation Leave",
    "Sick Leave",
    "Personal Leave",
    "Work From Home Request",
    "Overtime Request",
    "Late Arrival Notice",
    "Early Check-Out Request",
    "Shift Change Request",
    "Equipment Request",
    "Expense Reimbursement",
    "Training Request",
    "Schedule Adjustment",
    "Project Support Request",
    "Day Off Request",
    "Other",
  ],
  required: true,
},
{ label: "Description", name: "description", type: "textarea", required: true },
  ];

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.toString(),
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!formData.requesttype || !formData.description) {
      alert("Please fill in all required fields and ensure you are logged in.");
      setIsSubmitting(false);
      return;
    }
    try {
      const response = await fetch("/db/dbroute", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "createRequest", // must match your backend
          params: {
            data: {
            requesterid: userID, 
            requesttype: formData.requesttype,
            description: formData.description,
            status: "Pending",
            creationdate: new Date().toISOString().slice(0, 10)
            }
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert(`✅ Success! New request '${formData.requesttype}' created.`);
        setIsRequesting(false);
         setFormData({ requesttype: "", description: "" });
         fetchRequests(userID);
      } else {
        alert(`❌ Error: Failed to add request. ${data.error || "Unknown error."}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("An unexpected error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (req) => {
    const confirmed = window.confirm(`Delete request from ${req.requestername}? with ${req.requestid}$`);
  if (!confirmed) return;
    console.log("Delete:", req.requestid);
    await fetch("/db/dbroute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "deleteRequest",
        params: { id: req.requestid},
      }),
    });
    await fetchRequests(userID);
  };

    if (isLoading || !personnel) {
        return (
            <div className="p-8 text-xl font-semibold text-blue-600 text-center">
                Loading personnel details...
            </div>
        );
    }

    const firstInitial = personnel?.name ? String(personnel.name)[0] : "?";

    const canCheckIn =
        attendance &&
        (attendance.CheckInStatus === 'pending');

    const canCheckOut =
        attendance &&
        attendance.CheckInStatus === 'checked_in' &&
        attendance.CheckOutStatus === 'not_checked_out' ;

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="w-full h-12 bg-black flex justify-between items-center px-4 shadow-md sticky top-0 z-10">
                <span className="text-white text-xl font-bold tracking-wider mr-6">
                    Commandr
                </span>
                <Button
                    text="Sign Out"
                    style="Filled"
                    className="ml-4 text-white bg-transparent border border-white hover:bg-white hover:text-black transition duration-200 ease-in-out p-1 px-3 text-sm font-medium flex-shrink-0"
                    onClick={async () => {
                        await fetch("/api/auth/signout", {
                            method: "POST",
                            credentials: "include",
                        });
                        router.replace("/signin");
                    }}
                />
            </header>

            <main className="p-4 md:p-8 max-w-7xl mx-auto">
                <h1 className="text-3xl font-extrabold text-gray-800 mb-6 flex items-center">
                    <span className="bg-blue-600 text-white rounded-full h-10 w-10 flex items-center justify-center mr-3">
                        {firstInitial}
                    </span>
                    {personnel.name || "Unnamed Personnel"}
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-xl border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-4">
                            User Details
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                            <InfoItem label="Name:" value={personnel.name} />
                            <InfoItem label="Email" value={personnel.email} />
                            <InfoItem label="Position" value={personnel.position} />
                            <InfoItem label="Department" value={personnel.department} />
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100">
                        <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-4">
                            Utilities
                        </h2>

                        {!isRequesting && (<Button
                                    text="Make A Request"
                                    style="Filled"
                                    onClick={() => setIsRequesting(true)}
                                    className="flex-1 py-3 bg-green-500 text-white hover:bg-green-600 shadow-md"
                                />
                        )}
                        {isRequesting && (<Button
                                    text="Cancel Request"
                                    style="Filled"
                                    onClick={() => setIsRequesting(false)}
                                    className="flex-1 py-3 bg-green-500 text-white hover:bg-green-600 shadow-md"
                                />
                        )}
                        <div className="flex space-x-3 mt-4">
                            {canCheckIn && (
                                <Button
                                    text="Check In"
                                    style="Filled"
                                    onClick={handleCheckIn}
                                    className="flex-1 py-3 bg-green-500 text-white hover:bg-green-600 shadow-md"
                                />
                            )}

                            {canCheckOut && (
                                <Button
                                    text="Check Out"
                                    style="Filled"
                                    onClick={handleCheckOut}
                                    className="flex-1 py-3 bg-red-500 text-white hover:bg-red-600 shadow-md"
                                />
                            )}
                        </div>
                        {isRequesting&&(<form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                          {fields.map((field) => (
                                            <div
  key={field.name}
 className={(field.type === "textarea" || field.type === "select") ? "md:col-span-2" : ""}
>

                                              <label
                                                htmlFor={field.name}
                                                className="block text-sm font-medium text-gray-700 mb-1"
                                              >
                                                {field.label}{" "}
                                                {field.required && <span className="text-red-500">*</span>}
                                              </label>
                            
                                              {field.type === "select" ? (
                              <select
                                id={field.name}
                                name={field.name}
                                value={formData[field.name]}
                                onChange={handleChange}
                                required={field.required}
                                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select a request type...</option>
                                {field.options.map((option) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            ) : field.type === "textarea" ? (
                                                <textarea
                                                  id={field.name}
                                                  name={field.name}
                                                  value={formData[field.name]}
                                                  onChange={handleChange}
                                                  required={field.required}
                                                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                />
                                              ) : (
                                                <input
                                                  id={field.name}
                                                  name={field.name}
                                                  type={field.type}
                                                  value={formData[field.name]}
                                                  onChange={handleChange}
                                                  required={field.required}
                                                  className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                                />
                                              )}
                                            </div>
                                          ))}
                                        </div>
                            
                                        {/* Submit Button */}
                                        <div className="pt-4">
                                          <Button
                                            type="submit"
                                            style="Filled"
                                            text={isSubmitting ? "Submitting Request..." : "Submit Request"}
                                            disabled={isSubmitting}
                                            className="w-full bg-blue-600 text-white hover:bg-blue-700"
                                          />
                                        </div>
                                      </form>)}
                    </div>
                </div>
                            
                <div className="flex justify-left mb-6 gap-4">
    <Button
        text={"Show Task"}
        style="Filled"
        className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700"
        onClick={() => {
            setShowTasks(true);
            setShowAttendance(false);
            setShowRequest(false);
        }}
    />

    <Button
        text={"Show Attendance"}
        style="Filled"
        className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700"
        onClick={() => {
            setShowTasks(false);
            setShowAttendance(true);
            setShowRequest(false);
        }}
    />

    <Button
        text={"Show Request"}
        style="Filled"
        className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700"
        onClick={() => {
            setShowTasks(false);
            setShowAttendance(false);
            setShowRequest(true);
        }}
    />
</div>


                {showTasks && (
                    <div className="flex justify-center mt-4 mb-4">
                        <input
                            type="search"
                            placeholder="Search by Task Name, Status, Assigner, or Project..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full max-w-2xl p-2 px-4 text-base text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        />
                    </div>
                )}

                {showTasks && (
                    <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Task ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Task Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Assigner
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Creation Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        End Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredTasks.map((task) => (
                                    <tr
                                        key={task.taskid}
                                        className="hover:bg-blue-50"
                                    >
                                        <td className="px-6 py-4 text-sm font-medium">
                                            {task.taskid}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {task.taskname}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span
                                                className={`px-2 inline-flex text-xs font-semibold rounded-full ${
                                                    task.taskstatus === "Completed"
                                                        ? "bg-green-100 text-green-800"
                                                        : task.taskstatus === "In Progress"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-red-100 text-red-800"
                                                }`}
                                            >
                                                {task.taskstatus}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4 text-sm">
                                            {task.assignername || "Unassigned"}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {formatDate(task.creationdate)}
                                        </td>
                                        <td className="px-6 py-4 text-sm">
                                            {formatDate(task.enddate)}
                                        </td>
                                        <td className="px-6 py-4 text-sm max-w-xs truncate">
                                            {task.description}
                                        </td>

                                        <td className="px-6 py-4 text-sm font-medium">
                                            {task.taskstatus === "To Do" && (
                                                <Button
                                                    text="In Progress"
                                                    style="Filled"
                                                    className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600"
                                                    onClick={() =>
                                                        updateTaskStatus(
                                                            task.taskid,
                                                            "In Progress"
                                                        )
                                                    }
                                                />
                                            )}

                                            {task.taskstatus === "In Progress" && (
                                                <Button
                                                    text="Completed"
                                                    style="Filled"
                                                    className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700"
                                                    onClick={() =>
                                                        updateTaskStatus(
                                                            task.taskid,
                                                            "Completed"
                                                        )
                                                    }
                                                />
                                            )}

                                            {task.taskstatus === "Completed" && (
                                                <Button
                                                    text="Revert Status"
                                                    style="Filled"
                                                    className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700"
                                                    onClick={() =>
                                                        updateTaskStatus(
                                                            task.taskid,
                                                            "To Do"
                                                        )
                                                    }
                                                />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {showAttendance && (
                    <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Check-In Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Check-In Time
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Check-Out Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Check-Out Time
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                                {allattendance.map((record) => (
                                    <tr
                                        key={`${record.UserID}-${record.AttendanceDate}`}
                                        className="hover:bg-blue-50"
                                    >
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {formatDate(
                                                record.AttendanceDate
                                            ).slice(0, 10)}
                                        </td>

                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {record.Name}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {record.CheckInStatus}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {formatDateTime(
                                                record.CheckInDateTime
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {record.CheckOutStatus}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {formatDateTime(
                                                record.CheckOutDateTime
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {showRequest && (
                    <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Approver</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creation Date</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requests.map((Request) => (
              <tr
                key={Request.requestid}
                className={`cursor-pointer hover:bg-blue-50 transition duration-150 ease-in-out ${
                  "cursor-default"
                }`}
              >
                <td className="px-6 py-4 text-sm text-gray-700">{Request.requestername}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{Request.approvername || "N/A"}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{Request.type}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      Request.requeststatus === "Approved"
                        ? "bg-green-100 text-green-800"
                        : Request.requeststatus === "Rejected"
                        ? "bg-red-100 text-red-800"
                        : Request.requeststatus === "Cancelled"
                        ? "bg-gray-100 text-gray-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {Request.requeststatus}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{Request.description || "N/A"}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{formatDate(Request.creationdate)}</td>
                  <td className="px-6 py-4 text-sm text-center space-x-2">
                    <Button
                                text={"Delete"}
                                style="Filled"
                                className="bg-gray-700 text-white px-4 py-2 rounded-md"
                                onClick={() => {handleDelete(Request)}}
                    
                              />
                  </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
                )}
            </main>
        </div>
    );
}
