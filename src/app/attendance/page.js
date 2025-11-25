"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/button/button";

export default function AttendancePage() {
  const router = useRouter();

  const [attendanceList, setAttendanceList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [assignerID, setAssignerID] = useState(null);
  const [authorization, setAuthorization] = useState(null);
  const [showTodayOnly, setShowTodayOnly] = useState(true);

  // ⛔ Prevent flicker
  const [pageReady, setPageReady] = useState(false);

  // -------------------------------------------------------------
  // FORMATTERS
  // -------------------------------------------------------------
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const bangkok = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    const MM = String(bangkok.getMonth() + 1).padStart(2, "0");
    const DD = String(bangkok.getDate()).padStart(2, "0");
    const YYYY = bangkok.getFullYear();
    const HH = String(bangkok.getHours()).padStart(2, "0");
    const mm = String(bangkok.getMinutes()).padStart(2, "0");
    const ss = String(bangkok.getSeconds()).padStart(2, "0");
    return `${MM}-${DD}-${YYYY} ${HH}:${mm}:${ss}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { timeZone: "Asia/Bangkok" };
    const [m, d, y] = new Date(dateString).toLocaleDateString("en-US", options).split("/");
    return `${m}-${d}-${y}`;
  };

  // -------------------------------------------------------------
  // FETCH ATTENDANCE
  // -------------------------------------------------------------
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
      }
    } catch (e) {
      console.error("Attendance fetch error:", e);
    }
  };

  // -------------------------------------------------------------
  // UNIFIED INIT FLOW → No flicker
  // -------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      try {
        // 1️⃣ Check Auth
        const authRes = await fetch("/api/auth/check", { credentials: "include" });
        if (!authRes.ok) return router.replace("/signin");

        const authData = await authRes.json();
        setAssignerID(authData.user);

        // 2️⃣ Fetch authorization
        const authzRes = await fetch("/db/dbroute", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operation: "authorization", params: { id: authData.user } }),
        });

        const authzData = await authzRes.json();
        setAuthorization(authzData.data);

        // 3️⃣ Redirect personnel
        if (authzData.data.ispersonnel == 1) {
          router.replace("/personal");
          return;
        }

        // 4️⃣ Fetch Attendance
        await fetchAttendance();

        // 5️⃣ Now allow rendering
        setPageReady(true);
      } catch (err) {
        console.error("Init failed:", err);
        router.replace("/signin");
      }
    };

    init();
  }, [router]);

  // -------------------------------------------------------------
  // ACTIONS
  // -------------------------------------------------------------
  const generateAttendance = async () => {
    if (!window.confirm("Generate today's attendance for all personnel?")) return;

    const res = await fetch("/db/dbroute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "createAttendance", params: {} }),
    });
    const data = await res.json();

    if (data.success) {
      alert("Attendance generated!");
      fetchAttendance();
    } else alert("Failed to generate.");
  };

  const clearAttendance = async () => {
    if (!window.confirm("Clear ALL attendance records?")) return;

    const res = await fetch("/db/dbroute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ operation: "clearAttendance", params: {} }),
    });
    const data = await res.json();

    if (data.success) {
      alert("Attendance cleared!");
      fetchAttendance();
    } else alert("Failed to clear.");
  };

  const checkIn = async (record) => {
    if (!window.confirm(`Check in for ${record.Name}?`)) return;

    const res = await fetch("/db/dbroute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "checkIn",
        params: { id: record.UserID, date: record.AttendanceDate },
      }),
    });

    const data = await res.json();
    if (data.success) {
      alert("Checked in!");
      fetchAttendance();
    } else alert("Failed.");
  };

  const checkOut = async (record) => {
    if (!window.confirm(`Check out for ${record.Name}?`)) return;

    const res = await fetch("/db/dbroute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: "checkOut",
        params: { id: record.UserID, date: record.AttendanceDate },
      }),
    });

    const data = await res.json();
    if (data.success) {
      alert("Checked out!");
      fetchAttendance();
    } else alert("Failed.");
  };

  // -------------------------------------------------------------
  // FILTER LOGIC
  // -------------------------------------------------------------
  const filteredAttendance = useMemo(() => {
    let list = attendanceList;

    if (showTodayOnly) {
      const now = new Date();
      const today = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));

      const MM = String(today.getMonth() + 1).padStart(2, "0");
      const DD = String(today.getDate()).padStart(2, "0");
      const YYYY = today.getFullYear();
      const todayStr = `${MM}-${DD}-${YYYY}`;

      list = list.filter((a) => {
        const d = new Date(a.AttendanceDate);
        const bd = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
        const rMM = String(bd.getMonth() + 1).padStart(2, "0");
        const rDD = String(bd.getDate()).padStart(2, "0");
        const rYYYY = bd.getFullYear();
        return `${rMM}-${rDD}-${rYYYY}` === todayStr;
      });
    }

    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter((a) =>
        a.Name.toLowerCase().includes(s) ||
        a.CheckInStatus?.toLowerCase().includes(s) ||
        a.CheckOutStatus?.toLowerCase().includes(s)
      );
    }

    return list;
  }, [attendanceList, searchTerm, showTodayOnly]);

  // -------------------------------------------------------------
  // BLOCK RENDER UNTIL READY (NO FLICKER)
  // -------------------------------------------------------------
  if (!pageReady) {
    return <div className="p-4">Loading...</div>;
  }

  // -------------------------------------------------------------
  // MAIN RENDER
  // -------------------------------------------------------------
  const NavLink = ({ name, href }) => (
    <span
      onClick={() => router.push(href)}
      className="text-sm font-medium px-3 py-1 rounded-md cursor-pointer text-gray-300 hover:bg-gray-800 hover:text-white"
    >
      {name}
    </span>
  );

  return (
    <div className="p-4">
      {/* HEADER */}
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
          className="text-white bg-transparent border border-white hover:bg-white hover:text-black transition p-1 px-3 text-sm font-medium"
          onClick={async () => {
            await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
            router.replace("/signin");
          }}
        />
      </header>

      {/* SEARCH + FILTER */}
      <div className="flex flex-wrap justify-between items-center my-4 gap-2">
        <input
          type="search"
          placeholder="Search by Name or Status..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-lg p-2 px-4 border rounded-lg shadow-sm"
        />

        <div className="flex gap-2">
          <Button
            text={showTodayOnly ? "Show All" : "Show Today"}
            style="Filled"
            className={`${
              showTodayOnly ? "bg-blue-600" : "bg-gray-600"
            } text-white px-4 py-2 rounded-md`}
            onClick={() => setShowTodayOnly((prev) => !prev)}
          />

          {authorization.attendancepermission == 1 && (
            <>
              <Button
                text="Generate Attendance"
                style="Filled"
                className="bg-green-600 text-white px-4 py-2 rounded-md"
                onClick={generateAttendance}
              />

              <Button
                text="Clear Attendance"
                style="Filled"
                className="bg-red-600 text-white px-4 py-2 rounded-md"
                onClick={clearAttendance}
              />
            </>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto shadow-lg rounded-lg border">
        <table className="min-w-full divide-y divide-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-In Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-In Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-Out Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check-Out Time</th>
              {authorization.attendancepermission == 1 && (
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              )}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAttendance.map((record) => (
              <tr key={`${record.UserID}-${record.AttendanceDate}`} className="hover:bg-blue-50">
                <td className="px-6 py-4 text-sm text-gray-700">
                  {formatDate(record.AttendanceDate)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{record.Name}</td>
                <td className="px-6 py-4 text-sm text-gray-700">{record.CheckInStatus}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {formatDateTime(record.CheckInDateTime)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">{record.CheckOutStatus}</td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {formatDateTime(record.CheckOutDateTime)}
                </td>

                {authorization.attendancepermission == 1 && (
                  <td className="px-6 py-4 text-center text-sm">
                    {record.CheckInStatus !== "Checked In" ? (
                      <button
                        onClick={() => checkIn(record)}
                        className="bg-green-500 text-white px-3 py-1 rounded-md text-xs font-semibold"
                      >
                        Check In
                      </button>
                    ) : record.CheckOutStatus !== "Checked Out" ? (
                      <button
                        onClick={() => checkOut(record)}
                        className="bg-blue-500 text-white px-3 py-1 rounded-md text-xs font-semibold"
                      >
                        Check Out
                      </button>
                    ) : (
                      <span className="text-gray-500 text-xs font-semibold">Completed</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAttendance.length === 0 && (
        <p className="text-center text-gray-500 mt-8">
          {searchTerm
            ? `No attendance found for "${searchTerm}".`
            : "No attendance records available."}
        </p>
      )}
    </div>
  );
}
