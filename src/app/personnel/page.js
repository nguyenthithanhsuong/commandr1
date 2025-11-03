"use client"

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/button/button";

let AssignerID=0;

export default function PersonnelPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // State to control if inactive users (isactive = 0) are shown (Default is false)
    const [showInactive, setShowInactive] = useState(false); 

    // Helper component/function for rendering navigation links (omitted for brevity)
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

    // Centralized fetch function wrapped in useCallback
    const fetchPersonnel = useCallback(async (includeInactive) => {
        setIsLoading(true);
        try {
            const response = await fetch('/db/dbroute', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'getAllPersonnel',
                    // Parameter is sent, but we'll apply robust client-side filter too
                    params: { includeInactive: includeInactive } 
                }),
            });
            const data = await response.json();
            if (response.ok) {
                // Ensure isactive is treated as a boolean/number for filtering
                const processedUsers = data.data.map(user => ({
                    ...user,
                    isactive: !!user.isactive // Convert to boolean for consistency
                }));
                setUsers(processedUsers);
            } else {
                console.error('Failed to fetch personnel:', data.error);
                setUsers([]);
            }
        } catch (error) {
            console.error('Error fetching personnel:', error);
            setUsers([]);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/check', { credentials: 'include' });
                if (!response.ok) {
                    router.replace('/signin');
                    return;
                }
                const data = await response.json();
                AssignerID=data.user;
            } catch (error) {
                console.error('Auth check failed:', error);
                router.replace('/signin');
            }
        };
        checkAuth();
        // Initial fetch
        fetchPersonnel(showInactive); 
    }, [router]);
    
    // Re-fetch data whenever `showInactive` changes
    // NOTE: This assumes the backend *must* be called on toggle. If the backend
    // always returns ALL data, you could remove this useEffect and remove the 
    // `includeInactive` parameter from the fetch call, relying only on the useMemo filter.
    useEffect(() => {
        fetchPersonnel(showInactive);
    }, [showInactive, fetchPersonnel]); 


   const filteredUsers = useMemo(() => {
        let currentUsers = users;

        // 1. Filter by Active Status if showInactive is FALSE
        if (!showInactive) {
            currentUsers = currentUsers.filter(user => user.isactive);
        }

        // 2. Apply Search Term Filter
        if (!searchTerm) {
            return currentUsers;
        }

        const lowerCaseSearch = searchTerm.toLowerCase();

        return currentUsers.filter(user =>
            user.name.toLowerCase().includes(lowerCaseSearch) ||
            user.position.toLowerCase().includes(lowerCaseSearch) ||
            user.department.toLowerCase().includes(lowerCaseSearch)
        );
    }, [users, searchTerm, showInactive]); // DEPEND ON showInactive now

    // Handler function for row clicks (omitted for brevity)
    const handleRowClick = (user) => {
      router.push(`/personnel/viewpersonnel?id=${user.userid}`);
    };

    if (isLoading) {
        return <div className="p-4 text-lg font-semibold text-blue-600">Loading personnel data...</div>;
    }

    return (
        <div className="p-4">
            {/* Header Bar (omitted for brevity) */}
            <header className="w-full h-12 bg-black flex justify-between items-center px-4 shadow-md">
                <span className="text-white text-xl font-bold tracking-wider mr-6">Commandr</span>
                <nav className="flex space-x-3 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {/* NavLinks */}
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
                    className="ml-4 text-white bg-transparent border border-white hover:bg-white hover:text-black transition duration-200 ease-in-out p-1 px-3 text-sm font-medium flex-shrink-0" 
                    onClick={async () => {
                        await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
                        router.replace('/signin');
                    }}
                />
            </header>
            
            {/* Search Bar and Active/All Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-center mt-4 mb-4 gap-4">
                <input
                    type="search"
                    placeholder="Search by Name, Position, or Department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow w-full md:max-w-md p-2 px-4 text-base text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                
                {/* Checkbox to toggle inactive users */}
                <div className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg border border-gray-200 shadow-sm">
                    <input
                        id="showInactiveToggle"
                        type="checkbox"
                        checked={showInactive}
                        onChange={(e) => setShowInactive(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="showInactiveToggle" className="text-sm font-medium text-gray-700">
                        Show Inactive Personnel ({users.filter(u => !u.isactive).length})
                    </label>
                </div>
            </div>

            {/* Action buttons section (omitted for brevity) */}
            <div className="flex justify-between items-center my-4">
                <h1 className="text-2xl font-bold">
                    {showInactive ? "All Personnel List 📝" : "Active Personnel List ✅"}
                </h1>
                <Button
                    text="Add Personnel"
                    style="Filled" 
                    className="text-white bg-blue-600 border border-blue-600 hover:bg-blue-700 p-2 text-sm rounded-md shadow-md transition duration-150" 
                    onClick={() => {
                        router.push('/personnel/addpersonnel'); 
                    }}
                />
            </div>
            {/* --- */}

            {/* Table Container (omitted for brevity) */}
            <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                    <tr className="bg-gray-100">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UserID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DateOfBirth</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PhoneNumber</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EmployDate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th> 
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredUsers.map((user) => (
                            <tr 
                                key={user.userid} 
                                onClick={() => handleRowClick(user)}
                                className={`cursor-pointer transition duration-150 ease-in-out ${user.isactive ? 'hover:bg-blue-50' : 'bg-red-50 hover:bg-red-100'}`}> 
                                
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.userid}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.dateofbirth.substring(0, 10)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.gender}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phonenumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.position}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.employdate.substring(0, 10)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.managername}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isactive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {user.isactive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* Display message if no results found after filtering (omitted for brevity) */}
            {filteredUsers.length === 0 && !isLoading && (
                <p className="text-center text-gray-500 mt-8">
                    {searchTerm 
                        ? `No personnel found matching "${searchTerm}".` 
                        : "No personnel records found."}
                </p>
            )}
        </div>
    )
}