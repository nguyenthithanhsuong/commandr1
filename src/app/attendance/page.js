"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/button/button";

export default function AttendancePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [attendanceList, setAttendanceList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [AssignerID, setAssignerID] = useState([]);
  const [showTodayOnly, setShowTodayOnly] = useState(false); // 👈 NEW

  const NavLink = ({ name, href }) => {
    const isActive = router.pathname === href;
    const baseClasses =
      "text-sm font-medium px-3 py-1 rounded-md transition duration-150 ease-in-out cursor-pointer";
    const activeClasses = "bg-white text-black shadow-md";
    const inactiveClasses =
      "text-gray-300 hover:bg-gray-800 hover:text-white";

    return (
      <span
        onClick={() => router.push(href)}
        className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      >
        {name}
      </span>
    );
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch("/db/dbroute", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "getAttendance", params: {} }),
      });
      const data = await response.json();
      if (response.ok && data.data) {
        setAttendanceList(data.data);
      } else {
        console.error("Failed to fetch attendance:", data.error);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
    }
    setIsLoading(false);
  };

  const generateAttendance = async () => {
    const confirmed = window.confirm("Generate today's attendance for all personnel?");
    if (!confirmed) return;

    try {
      const response = await fetch("/db/dbroute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "createAttendance", params: {} }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert("Attendance generated successfully!");
        fetchAttendance();
      } else {
        alert("Failed to generate attendance.");
      }
    } catch (error) {
      console.error("Error generating attendance:", error);
      alert("Error generating attendance.");
    }
  };

  const checkIn = async (record) => {
    const confirmed = window.confirm(`Check in for ${record.Name}?`);
    if (!confirmed) return;
    try {
      await fetch("/db/dbroute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "checkIn",
          params: { id: record.UserID, date: record.AttendanceDate },
        }),
      });
      fetchAttendance();
    } catch (error) {
      alert(error);
    }
  };

  const checkOut = async (record) => {
    try {
      const confirmed = window.confirm(`Check out for ${record.Name}?`);
      if (!confirmed) return;
      await fetch("/db/dbroute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "checkOut",
          params: { id: record.UserID, date: record.AttendanceDate },
        }),
      });
      fetchAttendance();
    } catch (error) {
      alert(error);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check", { credentials: "include" });
        if (!response.ok) {
          alert("boom");
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
    fetchAttendance();
  }, [router]);

  // 🧠 Filtering Logic
  const filteredAttendance = useMemo(() => {
  let list = attendanceList;

  if (showTodayOnly) {
    // Get current date in Asia/Bangkok time
    const now = new Date();
    const bangkokDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));

    // Format as MM-DD-YYYY
    const month = String(bangkokDate.getMonth() + 1).padStart(2, "0");
    const day = String(bangkokDate.getDate()).padStart(2, "0");
    const year = bangkokDate.getFullYear();
    const todayFormatted = `${month}-${day}-${year}`;

    // Filter by today's Bangkok date
    list = list.filter((a) => {
      const recordDate = new Date(a.AttendanceDate);
      const recordBangkokDate = new Date(recordDate.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
      const rMonth = String(recordBangkokDate.getMonth() + 1).padStart(2, "0");
      const rDay = String(recordBangkokDate.getDate()).padStart(2, "0");
      const rYear = recordBangkokDate.getFullYear();
      const recordFormatted = `${rMonth}-${rDay}-${rYear}`;
      return recordFormatted === todayFormatted;
    });
  }

  if (searchTerm) {
    const lower = searchTerm.toLowerCase();
    list = list.filter(
      (a) =>
        a.Name.toLowerCase().includes(lower) ||
        a.CheckInStatus?.toLowerCase().includes(lower) ||
        a.CheckOutStatus?.toLowerCase().includes(lower)
    );
  }

  return list;
}, [attendanceList, searchTerm, showTodayOnly]);

  // 🕓 Format Display
  const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const options = { timeZone: "Asia/Bangkok" };
  const parts = date.toLocaleDateString("en-US", options).split("/");
  const [month, day, year] = parts;
  return `${month}-${day}-${year}`;
};



  if (isLoading) return <div className="p-4">Loading Attendance...</div>;

  return (
    <div className="p-4">
      {/* Header Bar */}
      <header className="w-full h-12 bg-black flex justify-between items-center px-4 shadow-md">
        <span className="text-white text-xl font-bold tracking-wider">Commandr</span>
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
            await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
            router.replace("/signin");
          }}
        />
      </header>

      {/* Search + Filter + Generate Buttons */}
      <div className="flex flex-wrap justify-between items-center my-4 gap-2">
        <input
          type="search"
          placeholder="Search by Name or Status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-lg p-2 px-4 text-base text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
        />

        <div className="flex gap-2">
          <Button
            text={showTodayOnly ? "Show All" : "Show Today"} // 👈 NEW TOGGLE
            style="Filled"
            className={`${
              showTodayOnly
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-600 hover:bg-gray-700"
            } text-white px-4 py-2 rounded-md shadow-md`}
            onClick={() => setShowTodayOnly((prev) => !prev)}
          />

          <Button
            text="Generate Attendance"
            style="Filled"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md"
            onClick={generateAttendance}
          />
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-In Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-In Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-Out Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-Out Time</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAttendance.map((record) => (
              <tr
                key={`${record.UserID}-${record.AttendanceDate}`}
                className="hover:bg-blue-50"
              >
                <td className="px-6 py-4 text-sm text-gray-700">
                  {formatDate(record.AttendanceDate).slice(0, 10)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{record.Name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{record.CheckInStatus}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{formatDate(record.CheckInDateTime)}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{record.CheckOutStatus}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{formatDate(record.CheckOutDateTime)}</td>

                <td className="px-6 py-4 text-center text-sm">
                  {record.CheckInStatus !== "checked_in" ? (
                    <button
                      onClick={() => checkIn(record)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-xs font-semibold"
                    >
                      Check In
                    </button>
                  ) : record.CheckOutStatus !== "checked_out" ? (
                    <button
                      onClick={() => checkOut(record)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-semibold"
                    >
                      Check Out
                    </button>
                  ) : (
                    <span className="text-gray-500 text-xs font-semibold">✅ Completed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAttendance.length === 0 && !isLoading && (
        <p className="text-center text-gray-500 mt-8">
          {searchTerm
            ? `No attendance found matching "${searchTerm}".`
            : "No attendance records found."}
        </p>
      )}
    </div>
  );
}
