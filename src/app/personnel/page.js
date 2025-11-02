"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/button/button";

// NOTE: ViewPersonnelPage import is unused in the component body
// import ViewPersonnelPage from "./viewpersonnel/page"; 

export default function PersonnelPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        // Check if user is authenticated
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/check', { credentials: 'include' });
                if (!response.ok) {
                    // If not authenticated, redirect to sign in
                    router.replace('/signin');
                    return;
                }
                setIsLoading(false);
            } catch (error) {
                console.error('Auth check failed:', error);
                router.replace('/signin');
            }
        };

        //Fetch all users
        const fetchPersonnel = async () => { 
            const response = await fetch('/api/db', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'getAllPersonnel',
                    params: {
                    }
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setUsers(data.data);
            } else {
                console.error('Failed to fetch personnel:', data.error);
            }
        }

        checkAuth();
        fetchPersonnel();
    }, [router]);

    // Handler function for row clicks
    const handleRowClick = (user) => {
      router.push(`/personnel/viewpersonnel?id=${user.userid}`);
    };

    if (isLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <header className="w-full h-12 bg-black flex justify-between items-center px-4 shadow-md">
                            <span className="text-white text-xl font-bold tracking-wider">Commandr</span>
            
                            <Button
                                text="Sign Out"
                    style="Filled" // Assuming your Button component handles styling based on this prop
                    className="text-white bg-transparent border border-white hover:bg-white hover:text-black transition duration-200 ease-in-out p-1 px-3 text-sm font-medium" // Add Tailwind classes for better visual integration with the black bar
                    onClick={async () => {
                        await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
                        router.replace('/signin');
                    }}
                            />
                        </header>
            
            {/* Action buttons section */}
            <div className="flex justify-between items-center my-4">
                <h1 className="text-2xl font-bold">Personnel List 👥</h1>
                <Button
                    text="Add Personnel"
                    style="Filled" 
                    // Adjusted Tailwind classes for better standalone look
                    className="text-white bg-blue-600 border border-blue-600 hover:bg-blue-700 p-2 text-sm rounded-md shadow-md transition duration-150" 
                    onClick={() => {
                        // Corrected: Use router.push for navigation to a new page
                        router.push('/personnel/addpersonnel'); 
                    }}
                />
            </div>
            {/* --- */}

            {/* Table Container */}
            <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                    <tr className="bg-gray-100">
                        {/* Improved Table Header Styling */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">UserID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DateOfBirth</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gender</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PhoneNumber</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">EmployDate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Manager</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr 
                                key={user.userid} 
                                onClick={() => handleRowClick(user)}
                                className="cursor-pointer hover:bg-blue-50 transition duration-150 ease-in-out">
                                {/* Improved Table Data Cell Styling */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.userid}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.dateofbirth.substring(0, 10)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.gender}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.phonenumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.position}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.department}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.employdate.substring(0, 10)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.managername}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {/* If no users are available, display a message */}
            {users.length === 0 && (
                <p className="text-center text-gray-500 mt-8">No personnel records found.</p>
            )}
        </div>
    )
}