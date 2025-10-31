"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/button/button";

import ViewPersonnelPage from "./viewpersonnel/page";

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

    // ✨ NEW: Handler function for row clicks
    const handleRowClick = (user) => {
      router.push(`/personnel/viewpersonnel?id=${user.userid}`);
    };

    if (isLoading) {
        return <div className="p-4">Loading...</div>;
    }

    return (
        <div className="p-4">
            <div aria-hidden="true" className="w-full h-10 bg-black -mx-4 md:-mx-0 flex justify-between items-center px-4">
                {/* Commandr text on the left */}
                <span className="text-white text-lg font-semibold">Commandr</span>
                
                {/* Sign Out Button on the right */}
                <Button
                    text="Sign Out"
                    style="Filled" // Assuming your Button component handles styling based on this prop
                    className="text-white bg-transparent border border-white hover:bg-white hover:text-black p-1 text-sm" // Add Tailwind classes for better visual integration with the black bar
                    onClick={async () => {
                        await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
                        router.replace('/signin');
                    }}
                />
            </div>
            <Button
                    text="Add Personnel"
                    style="Filled" //
                    className="text-white bg-transparent border border-white hover:bg-white hover:text-black p-1 text-sm" // Add Tailwind classes for better visual integration with the black bar
                    onClick={async () => {
                        await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
                        router.replace('/personnel/addpersonnel');
                    }}
                />
            {/* --- */}

            <h1 className="text-2xl font-bold my-4">Personnel Page</h1>

              <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                      <tr>
                          <th className="..." >UserID</th>
                          <th className="..." >Name</th>
                          <th className="..." >DateOfBirth</th>
                          <th className="..." >Gender</th>
                          <th className="..." >PhoneNumber</th>
                          <th className="..." >Position</th>
                          <th className="..." >Department</th>
                          <th className="..." >EmployDate</th>
                          <th className="..." >Manager</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr 
                                key={user.userid} 
                                onClick={() => handleRowClick(user)}
                                className="cursor-pointer hover:bg-gray-50 transition duration-150 ease-in-out">
                                <td className="...">{user.userid}</td>
                                <td className="...">{user.name}</td>
                                <td className="...">{user.dateofbirth.substring(0, 10)}</td>
                                <td className="...">{user.gender}</td>
                                <td className="...">{user.phonenumber}</td>
                                <td className="...">{user.position}</td>
                                <td className="...">{user.department}</td>
                                <td className="...">{user.employdate.substring(0, 10)}</td>
                                <td className="...">{user.managername}</td>
                            </tr>
                        ))}
                    </tbody>
                  </table>
              </div>
              
        </div>
    )
}