"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/button/button";

export default function RequestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [Requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isManageMode, setIsManageMode] = useState(false); // ✅ NEW STATE
  const [isDeleteMode, setisDeleteMode] = useState(false);
  const [AssignerID, setAssignerID] = useState([]);
    const NavLink = ({ name, href }) => {
        const isActive = router.pathname === href || (name === 'Personnel' && router.pathname === '/personnel');
        
        const baseClasses = "text-sm font-medium px-3 py-1 rounded-md transition duration-150 ease-in-out cursor-pointer";
        const activeClasses = "bg-white text-black shadow-md";
        const inactiveClasses = "text-gray-300 hover:bg-gray-800 hover:text-white";

        return (
            <span
                onClick={() => router.push(href)}
                className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
            >
                {name}
            </span>
        );
    };
    const fetchRequests = async () => {
      try {
        const response = await fetch("/db/dbroute", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operation: "getAllRequest", params: {} }),
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

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check", { credentials: "include" });
        if (!response.ok) {
          router.replace("/signin");
          return;
        }
        const data = await response.json();
                setAssignerID(data.user);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.replace("/signin");
      }
    };

    checkAuth();
    fetchRequests();
  }, [router]);

  const filteredRequests = useMemo(() => {
    if (!searchTerm) return Requests;
    const lower = searchTerm.toLowerCase();
    return Requests.filter(
      (r) =>
        r.requestername?.toLowerCase().includes(lower) ||
        r.requeststatus?.toLowerCase().includes(lower) ||
        r.approvername?.toLowerCase().includes(lower)
    );
  }, [Requests, searchTerm]);

  const handleRowClick = (Request) => {};

  const formatDate = (dateString) => (dateString ? dateString.substring(0, 10) : "N/A");

  // ✅ Approve / Decline handlers
  const handleAccept = async (req) => {
    const confirmed = window.confirm(`Approve request from ${req.requestername}?`);
  if (!confirmed) return;
    console.log("Accepted:", req.requestid);
    // Example: send to backend
    await fetch("/db/dbroute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "updateRequestStatus",
        params: { id: req.requestid, data: AssignerID, status: "Approved" },
      }),
    });
    await fetchRequests();
  };

  const handleDecline = async (req) => {
    const confirmed = window.confirm(`Decline request from ${req.requestername}?`);
  if (!confirmed) return;
    console.log("Declined:", req.requestid);
    await fetch("/db/dbroute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "updateRequestStatus",
        params: { id: req.requestid, data: AssignerID , status: "Rejected" },
      }),
    });
    await fetchRequests();
  };

const handleDelete = async (req) => {
    const confirmed = window.confirm(`Delete request from ${req.requestername}?`);
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
    await fetchRequests();
  };

  if (isLoading) return <div className="p-4">Loading Requests...</div>;

  return (
    <div className="p-4">
      {/* Black Header Bar (Navigation) */}
                  <header className="w-full h-12 bg-black flex justify-between items-center px-4 shadow-md">
                      <span className="text-white text-xl font-bold tracking-wider">Commandr</span>
                      {/* Navigation Buttons */}
                      <nav className="flex space-x-3 overflow-x-auto whitespace-nowrap scrollbar-hide">
                          <NavLink name="Personnel" href="/personnel" />
                          <NavLink name="Attendance" href="/attendance" />
                          <NavLink name="Request" href="/request" />
                          <NavLink name="Task" href="/task" />
                          <NavLink name="Project" href="/project" />
                          <NavLink name="Department" href="/department" />
                          <NavLink name="Report" href="/report" />
                      </nav>
                      <Button
                          text="Sign Out"
                          style="Filled" 
                          className="text-white bg-transparent border border-white hover:bg-white hover:text-black transition duration-200 ease-in-out p-1 px-3 text-sm font-medium" 
                          onClick={async () => {
                              await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
                              router.replace('/signin');
                          }}
                      />
                  </header>
                  
                  {/* Search Bar */}
                  <div className="flex justify-center mt-4 mb-4">
                      <input
                          type="search"
                          placeholder="Search by Requester, Approver, Or Status..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full max-w-2xl p-2 px-4 text-base text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      />
                  </div>
                
      {/* Action buttons */}
      <div className="flex justify-between items-center my-4">
        <h1 className="text-2xl font-bold">Request List 📁</h1>
        <div className="flex gap-2">
          <Button
            text={isManageMode ? "Exit Manage Mode" : "Manage Requests"}
            style="Filled"
            className="bg-gray-700 text-white px-4 py-2 rounded-md"
            onClick={() => {
                setIsManageMode(!isManageMode);
                setisDeleteMode(false);
            }}

          />
          <Button
            text={isDeleteMode ? "Exit Delete Mode" : "Delete Requests"}
            style="Filled"
            className="bg-gray-700 text-white px-4 py-2 rounded-md"
            onClick={() => {setisDeleteMode(!isDeleteMode);
            setIsManageMode(false);
            }}
          />
          <Button
            text="Add New Request"
            style="Filled"
            className="text-white bg-blue-600 border border-blue-600 hover:bg-blue-700 p-2 text-sm rounded-md shadow-md transition duration-150"
            onClick={() => router.push("/request/addrequest")}
          />
        </div>
      </div>

      {/* Table */}
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
              {isManageMode && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
              {isDeleteMode && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRequests.map((Request) => (
              <tr
                key={Request.requestid}
                onClick={() => !isManageMode && handleRowClick(Request)}
                className={`cursor-pointer hover:bg-blue-50 transition duration-150 ease-in-out ${
                  isManageMode ? "cursor-default" : ""
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

                {/* ✅ Action buttons when in manage mode */}
                {isManageMode && (
                  <td className="px-6 py-4 text-sm text-center space-x-2">
                    <button
                      onClick={() => handleAccept(Request)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs font-semibold"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDecline(Request)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs font-semibold"
                    >
                      Decline
                    </button>
                  </td>
                )}

                {isDeleteMode && (
                  <td className="px-6 py-4 text-sm text-center space-x-2">
                    <button
                      onClick={() => handleDelete(Request)}
                      className="bg-red-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs font-semibold"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRequests.length === 0 && !isLoading && (
        <p className="text-center text-gray-500 mt-8">
          {searchTerm
            ? `No Request found matching "${searchTerm}".`
            : "No Request records found."}
        </p>
      )}
    </div>
  );
    }

