"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/button/button";

export default function TaskPage() {
    const router = useRouter();

    // ---- STATES ----
    const [isLoading, setIsLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    const [AssignerID, setAssignerID] = useState(null);

    const [authorization, setAuthorization] = useState(null);
    const [authLoaded, setAuthLoaded] = useState(false); // ⭐ prevents flicker

    // ---- NAV COMPONENT ----
    const NavLink = ({ name, href }) => {
        const baseClasses =
            "text-sm font-medium px-3 py-1 rounded-md transition cursor-pointer";
        const isActive = router.pathname === href;
        return (
            <span
                onClick={() => router.push(href)}
                className={`${baseClasses} ${
                    isActive
                        ? "bg-white text-black shadow-md"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                }`}
            >
                {name}
            </span>
        );
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
            } catch {
                router.replace("/signin");
            }
        };

        checkAuth();
    }, []);

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
            setAuthLoaded(true); // ⭐ critical
        };

        loadAuth();
    }, [AssignerID]);

    // ---- REDIRECT PERSONNEL USERS ----
    useEffect(() => {
        if (!authLoaded) return;
        if (!authorization) return;

        if (authorization.ispersonnel == 1) {
            router.replace("/personal");
        }
    }, [authorization, authLoaded]);

    // ---- FETCH TASKS ----
    const fetchTasks = useCallback(async () => {
        setIsLoading(true);

        try {
            const response = await fetch("/db/dbroute", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    operation: "getAllTask",
                    params: {},
                }),
            });

            const data = await response.json();
            if (response.ok) {
                setTasks(data.data || []);
            } else {
                setTasks([]);
            }
        } catch (err) {
            console.error("Error fetching tasks:", err);
        }

        setIsLoading(false);
    }, []);

    // Load tasks ONLY when auth + authorization are ready
    useEffect(() => {
        if (!authLoaded || !authorization) return;
        fetchTasks();
    }, [authLoaded, authorization]);

    // ---- FILTERING ----
    const filteredTasks = useMemo(() => {
        if (!searchTerm.trim()) return tasks;

        const q = searchTerm.toLowerCase();
        return tasks.filter(
            (t) =>
                t.taskname.toLowerCase().includes(q) ||
                t.taskstatus.toLowerCase().includes(q) ||
                t.assignername?.toLowerCase().includes(q) ||
                t.personnelname?.toLowerCase().includes(q) ||
                t.projectname?.toLowerCase().includes(q)
        );
    }, [tasks, searchTerm]);

    const handleRowClick = (task) => {
        router.push(`/task/viewtask?id=${task.taskid}`);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        const [m, d, y] = date.toLocaleDateString("en-US").split("/");
        return `${m}-${d}-${y}`;
    };

    // ---- LOADING STATE (NO FLICKER) ----
    if (!authLoaded || isLoading) {
        return (
            <div className="p-4 text-lg font-semibold text-blue-600">
                Loading tasks...
            </div>
        );
    }

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

                <Button
                    text="Sign Out"
                    style="Filled"
                    className="text-white bg-transparent border border-white hover:bg-white hover:text-black p-1 px-3 text-sm"
                    onClick={async () => {
                        await fetch("/api/auth/signout", {
                            method: "POST",
                            credentials: "include",
                        });
                        router.replace("/signin");
                    }}
                />
            </header>

            {/* SEARCH */}
            <div className="flex flex-wrap justify-between items-center my-4 gap-2">
                <input
                    type="search"
                    placeholder="Search By Task Name, Personnel or Assigner..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-2xl p-2 px-4 border rounded-lg shadow-sm"
                />
            </div>

            {/* ACTION ROW */}
            <div className="flex justify-between items-center my-4">
                <h1 className="text-2xl font-bold">Task List 📋</h1>

                {authorization.workpermission == 1 && (
                    <Button
                        text="Add New Task"
                        style="Filled"
                        className="text-white bg-blue-600 hover:bg-blue-700 p-2 text-sm rounded-md shadow-md"
                        onClick={() => router.push("/task/addtask")}
                    />
                )}
            </div>

            {/* TABLE */}
            <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-100">
                        <tr>
                            {[
                                "Task ID",
                                "Task Name",
                                "Status",
                                "Project",
                                "Assigned To",
                                "Assigner",
                                "Creation Date",
                                "End Date",
                                "Description",
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
                        {filteredTasks.map((task) => (
                            <tr
                                key={task.taskid}
                                onClick={() => handleRowClick(task)}
                                className="cursor-pointer hover:bg-blue-50"
                            >
                                <td className="px-6 py-4">{task.taskid}</td>
                                <td className="px-6 py-4">{task.taskname}</td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                            task.taskstatus === "Completed"
                                                ? "bg-green-100 text-green-800"
                                                : task.taskstatus ===
                                                  "In Progress"
                                                ? "bg-yellow-100 text-yellow-800"
                                                : "bg-red-100 text-red-800"
                                        }`}
                                    >
                                        {task.taskstatus}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {task.projectname || "N/A"}
                                </td>
                                <td className="px-6 py-4">
                                    {task.personnelname || "Unassigned"}
                                </td>
                                <td className="px-6 py-4">
                                    {task.assignername || "System"}
                                </td>
                                <td className="px-6 py-4">
                                    {formatDate(task.creationdate)}
                                </td>
                                <td className="px-6 py-4">
                                    {formatDate(task.enddate)}
                                </td>
                                <td className="px-6 py-4 max-w-xs truncate">
                                    {task.description}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {filteredTasks.length === 0 && (
                <p className="text-center text-gray-500 mt-8">
                    No tasks found.
                </p>
            )}
        </div>
    );
}
