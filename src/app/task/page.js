"use client"

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/button/button"; // Adjust path as needed

export default function TaskPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    // Renamed state from 'users' to 'tasks' for clarity
    const [tasks, setTasks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

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

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/check', { credentials: 'include' });
                if (!response.ok) {
                    router.replace('/signin');
                    return;
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                router.replace('/signin');
            }
        };

        // Modified fetch function to call getAllTask
        const fetchTasks = async () => {
            try {
                const response = await fetch('/db/dbroute', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        // Operation changed to getAllTask
                        operation: 'getAllTask',
                        params: {}
                    }),
                });
                const data = await response.json();
                if (response.ok && data.data) {
                    // Set tasks data
                    setTasks(data.data);
                } else {
                    console.error('Failed to fetch tasks:', data.error);
                }
            } catch (error) {
                console.error('Error fetching tasks:', error);
            }
            setIsLoading(false);
        }

        checkAuth();
        fetchTasks();
    }, [router]);

    // Filter Tasks based on search term
    const filteredTasks = useMemo(() => {
        if (!searchTerm) {
            return tasks;
        }

        const lowerCaseSearch = searchTerm.toLowerCase();

        return tasks.filter(task =>
            task.taskname.toLowerCase().includes(lowerCaseSearch) ||
            task.taskstatus.toLowerCase().includes(lowerCaseSearch) ||
            task.assignername?.toLowerCase().includes(lowerCaseSearch) || // Use optional chaining for names
            task.personnelname?.toLowerCase().includes(lowerCaseSearch) ||
            task.projectname?.toLowerCase().includes(lowerCaseSearch)
        );
    }, [tasks, searchTerm]);

    // Handler function for row clicks (assuming a viewTask page exists)
    const handleRowClick = (task) => {
      // Assuming the view page URL structure is similar to personnel
      router.push(`/task/viewtask?id=${task.taskid}`);
    };
    
    // Helper function to format date strings
    const formatDate = (dateString) => {
        // Ensure only the date part is shown if it's a full timestamp
        return dateString ? dateString.substring(0, 10) : 'N/A';
    };


    if (isLoading) {
        return <div className="p-4">Loading tasks...</div>;
    }

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
                    placeholder="Search by Task Name, Status, Personnel, or Project..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full max-w-2xl p-2 px-4 text-base text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
            </div>

            {/* Action buttons section */}
            <div className="flex justify-between items-center my-4">
                <h1 className="text-2xl font-bold">Task List 📋</h1>
                <Button
                    text="Add New Task"
                    style="Filled" 
                    className="text-white bg-blue-600 border border-blue-600 hover:bg-blue-700 p-2 text-sm rounded-md shadow-md transition duration-150" 
                    onClick={() => {
                        router.push('/task/addtask'); 
                    }}
                />
            </div>

            ---

            {/* Table Container */}
            <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                    <tr className="bg-gray-100">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                        <th className-="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigner</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creation Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTasks.map((task) => (
                            <tr 
                                key={task.taskid} 
                                onClick={() => handleRowClick(task)}
                                className="cursor-pointer hover:bg-blue-50 transition duration-150 ease-in-out">
                                
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.taskid}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.taskname}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        task.taskstatus === 'Completed' ? 'bg-green-100 text-green-800' : 
                                        task.taskstatus === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-red-100 text-red-800' // Default/Pending
                                    }`}>
                                        {task.taskstatus}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.projectname || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.personnelname || 'Unassigned'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.assignername || 'System'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(task.creationdate)}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{task.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Display message if no results found after filtering */}
            {filteredTasks.length === 0 && !isLoading && (
                <p className="text-center text-gray-500 mt-8">
                    {searchTerm 
                        ? `No tasks found matching "${searchTerm}".` 
                        : "No task records found."}
                </p>
            )}
        </div>
    )
}