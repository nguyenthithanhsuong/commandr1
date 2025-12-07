"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/button/button";

const InfoItem = ({ label, value }) => (
    <div>
        <dt className="font-medium text-gray-500">{label}</dt>
        <dd className="mt-0.5 text-gray-900 font-semibold">{value ?? "N/A"}</dd>
    </div>
);

export default function PersonnelPage() {
    const router = useRouter();

    // ---- STATES ----
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [authorization, setAuthorization] = useState('');
    const [authLoaded, setAuthLoaded] = useState(false); // ⭐ prevents flicker

    const [AssignerID, setAssignerID] = useState('');
    const [personnel, setPersonnel] = useState('');
    const [showInactive, setShowInactive] = useState(false);

    const [attendance, setAttendance] = useState('');
    const [notification, setNotification] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);


    // ---- NAV COMPONENT ----
    const NavLink = ({ name, href }) => {
        const isActive = router.pathname === href;
        return (
            <span
                onClick={() => router.push(href)}
                className={`text-sm font-medium px-3 py-1 rounded-md transition cursor-pointer ${
                    isActive
                        ? "bg-white text-black shadow-md"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
            >
                {name}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        const options = { timeZone: "Asia/Bangkok" };
        const [m, d, y] = date.toLocaleDateString("en-US", options).split("/");
        return `${m}-${d}-${y}`;
    };
    //fetch Assigner:
    const fetchSelf = useCallback(async (userID) => {
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
                console.log("PERSONNEL SET TO:", data.data);
                if (response.ok) setPersonnel(data.data);
                else router.replace("/signin");
            } catch (error) {
                console.error(error);
            }
    
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
            } catch (error) {
                console.error(error);
            }
    
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
                if (!response.ok)
                router.replace("/signin");
            } catch (error) {
                console.error(error);
            }
        }, [router]);
    // ---- FETCH PERSONNEL ----
    const fetchPersonnel = useCallback(async (includeInactive) => {
        try {
            const response = await fetch("/db/dbroute", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    operation: "getAllPersonnel",
                    params: { includeInactive },
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setUsers(
                    data.data.map((u) => ({
                        ...u,
                        isactive: !!u.isactive,
                    }))
                );
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error("Error fetching personnel:", error);
            setUsers([]);
        }
    }, []);

    const handleCheckIn = async () => {
        if (!window.confirm("Check in?")) return;

        try {
            const response = await fetch("/db/dbroute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    operation: "checkIn",
                    params: { id: AssignerID, date: "CURDATE()" },
                }),
            });

            const data = await response.json();
            if (response.ok && data && data.success) {
                await fetchSelf(AssignerID);
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
                    params: { id: AssignerID, date: "CURDATE()" },
                }),
            });

            const data = await response.json();
            if (response.ok && data && data.success) {
                await fetchSelf(AssignerID);
            } else {
                alert("Failed to check out!");
            }
        } catch {}
    };

    // ---- AUTH CHECK ----
    useEffect(() => {

        const checkAuth = async () => {
            try {
                const res = await fetch("/api/auth/check", {
                    credentials: "include",
                });

                if (!res.ok) {
                    router.replace("/signin");
                    return;
                }

                const data = await res.json();
                setAssignerID(data.user);
            } catch (err) {
                router.replace("/signin");
            }
        };

        checkAuth();
        fetchPersonnel(showInactive);
    }, [router]);

    // ---- FETCH AUTHORIZATION ----
    useEffect(() => {
        
        if (!AssignerID) return;

        const loadAuth = async () => {
            const res = await fetch("/db/dbroute", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    operation: "authorization",
                    params: { id: AssignerID },
                }),
            });

            const result = await res.json();
            setAuthorization(result.data);
            setAuthLoaded(true); // ⭐ critical for removing flicker
        };

        loadAuth();
        
    }, [AssignerID]);

    // ---- REDIRECT PERSONNEL USERS ----
    useEffect(() => {
        if (!authLoaded) return;
        console.log(authLoaded);
        if (!authorization) return;
        console.log(authorization);
        if (!AssignerID) return;
        console.log(AssignerID);
        
        fetchSelf(AssignerID);
        
        setIsLoading(false);
        
    }, [authLoaded, authorization, AssignerID]);

    // ---- REFETCH WHEN SHOW INACTIVE TOGGLES ----
    useEffect(() => {
        fetchPersonnel(showInactive);
        setIsLoading(false);
    }, [showInactive, fetchPersonnel]);

    // ---- FILTERING ----
    const filteredUsers = useMemo(() => {
        let current = users;

        if (!showInactive) current = current.filter((u) => u.isactive);

        if (!searchTerm.trim()) return current;

        const q = searchTerm.toLowerCase();
        return current.filter(
            (u) =>
                u.name.toLowerCase().includes(q) ||
                u.position.toLowerCase().includes(q) ||
                u.department.toLowerCase().includes(q)
        );
    }, [users, searchTerm, showInactive]);

    const handleRowClick = (user) => {
        router.push(`/personnel/viewpersonnel?id=${user.userid}`);
    };

    // ---- LOADING STATE ----
    if (!authLoaded || isLoading) {
        return (
            <div className="p-4 text-lg font-semibold text-blue-600">
                Loading personnel...
            </div>
        );
    }

    const firstInitial = personnel?.name ? String(personnel.name)[0] : "?";

    const canCheckIn =
        attendance &&
        (attendance.CheckInStatus === 'Pending');

    const canCheckOut =
        attendance &&
        attendance.CheckInStatus === 'Checked In' &&
        attendance.CheckOutStatus === 'Pending' ;

    return (
        <div className="p-4">
            {/* HEADER */}
            <header className="w-full h-12 bg-black flex justify-between items-center px-4 shadow-md">
                <span className="text-white text-xl font-bold tracking-wider">
                    Commandr
                </span>

                <nav className="flex space-x-3">
                    <NavLink name="Personnel" href="/personnel" />
                    <NavLink name="Attendance" href="/attendance" />
                    <NavLink name="Request" href="/request" />
                    <NavLink name="Task" href="/task" />
                    <NavLink name="Project" href="/project" />
                    <NavLink name="Department" href="/department" />
                    <NavLink name="Report" href="/report" />
                </nav>
            
            <div className="flex items-center space-x-3">
                    {/* NEW NOTIFICATION BUTTON */}
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className="text-white border border-white px-3 py-1 rounded-md hover:bg-white hover:text-black"
                    >
                        Notifications
                    </button>

                    <Button
                        text="Sign Out"
                        style="Filled"
                        className="text-white bg-transparent border border-white hover:bg-white hover:text-black p-1 px-3 text-sm"
                        onClick={async () => {
                            await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
                            router.replace("/signin");
                        }}
                    />
                </div>
{showNotifications && (
                    <div className="absolute top-12 right-4 w-64 bg-white shadow-xl rounded-lg border p-4 z-50">
                        <h3 className="font-bold text-gray-700 mb-2">Notifications</h3>
                        <p className="text-sm text-gray-600">No new notifications.</p>
                    </div>
                )}
            </header>

            <h1 className="text-3xl font-extrabold text-gray-800 mt-6 mb-6 flex items-center">
                                <span className="bg-blue-600 text-white rounded-full h-10 w-10 flex items-center justify-center mr-3">
                                    {firstInitial}
                                </span>
                                {personnel.name? personnel.name : "Unnamed Personnel"}
                            </h1>
            
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-xl border border-gray-100">
                                    <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-4">
                                        User Details
                                    </h2>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                                        <InfoItem label="Name:" value={personnel.name} />
                                        <InfoItem label="email" value={personnel.email} />
                                        <InfoItem label="Position" value={personnel.position} />
                                        <InfoItem label="Department" value={personnel.department} />
                                    </div>
                                </div>
            
                                <div className="bg-white p-6 rounded-xl shadow-xl border border-gray-100">
                                    <h2 className="text-xl font-bold text-gray-700 border-b pb-2 mb-4">
                                        Utilities
                                    </h2>
                                    
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
                                </div>
                            </div>

            {/* SEARCH + TOGGLE */}
            <div className="flex flex-wrap justify-between items-center gap-4 mt-4">
                <input
                    type="search"
                    placeholder="Search name, position, department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow p-2 px-4 border rounded-lg shadow-sm"
                />

                <div className="flex items-center space-x-2 bg-gray-100 p-2 rounded-lg border shadow-sm">
                    <input
                        type="checkbox"
                        checked={showInactive}
                        onChange={(e) => setShowInactive(e.target.checked)}
                    />
                    <span className="text-sm">
                        Show Inactive ({users.filter((u) => !u.isactive).length})
                    </span>
                </div>
            </div>

            {/* ACTION BUTTON */}
            <div className="flex justify-between items-center my-4">
                <h1 className="text-2xl font-bold">
                    {showInactive ? "All Personnel" : "Active Personnel"}
                </h1>

                {authorization.personnelpermission == 1 && (
                    <Button
                        text="Add Personnel"
                        style="Filled"
                        className="text-white bg-blue-600 hover:bg-blue-700 p-2 text-sm rounded-md shadow-md"
                        onClick={() => router.push("/personnel/addpersonnel")}
                    />
                )}
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            {[
                                "UserID",
                                "Name",
                                "DateOfBirth",
                                "Gender",
                                "Phone",
                                "Position",
                                "Department",
                                "EmployDate",
                                "Manager",
                                "Status",
                            ].map((h) => (
                                <th
                                    key={h}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((u) => (
                            <tr
                                key={u.userid}
                                onClick={() => handleRowClick(u)}
                                className={`cursor-pointer ${
                                    u.isactive
                                        ? "hover:bg-blue-50"
                                        : "bg-red-50 hover:bg-red-100"
                                }`}
                            >
                                <td className="px-6 py-4">{u.userid}</td>
                                <td className="px-6 py-4">{u.name}</td>
                                <td className="px-6 py-4">
                                    {formatDate(u.dateofbirth)}
                                </td>
                                <td className="px-6 py-4">{u.gender}</td>
                                <td className="px-6 py-4">{u.phonenumber}</td>
                                <td className="px-6 py-4">{u.position}</td>
                                <td className="px-6 py-4">{u.department}</td>
                                <td className="px-6 py-4">
                                    {formatDate(u.employdate)}
                                </td>
                                <td className="px-6 py-4">{u.managername}</td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            u.isactive
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                        }`}
                                    >
                                        {u.isactive ? "Active" : "Inactive"}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredUsers.length === 0 && (
                <p className="text-center text-gray-500 mt-8">
                    No matching personnel found.
                </p>
            )}
        </div>
    );
}
