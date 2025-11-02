"use client"

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "../../components/button/button"; // Assuming the Button component is correctly imported

export default function ViewPersonnelPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userid = searchParams.get('id');

    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (!userid) {
            console.error("No User ID provided in URL.");
            setIsLoading(false);
            return;
        }

        const fetchPersonnelById = async () => {
            try {
                const response = await fetch('/api/db', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        operation: 'getPersonnelById',
                        params: {
                            id: userid
                        }
                    }),
                });
                const data = await response.json();
                if (response.ok && data.data) {
                    setUser(data.data);
                } else {
                    console.error('Failed to fetch personnel by ID:', data.error || 'User not found.');
                    setUser(null);
                }
            } catch (error) {
                console.error('Error fetching personnel by ID:', error);
            }
            setIsLoading(false);
        };
        fetchPersonnelById();
    }, [userid, router]);

    // --- Action Handlers ---

    const handleUpdate = () => {
        // Navigate to the edit page, passing the user ID
        router.push(`/personnel/updatepersonnel?id=${userid}`);
    };

    const handleRetire = async () => {
        if (!window.confirm(`Are you sure you want to retire personnel: ${user.name}? This action cannot be undone.`)) {
            return;
        }

        try {
            // Replace with your actual retire API call logic
            console.log(`Attempting to retire user with ID: ${userid}`);

            // Example API call structure (you'll need to implement the API route)
            const response = await fetch('/api/db', { 
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'retirePersonnel',
                    params: { id: userid }
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('Personnel retired successfully!');
            } else {
                alert(`Failed to retire personnel: ${data.error || 'Unknown error'}`);
            }
            router.replace('/personnel'); // Redirect back to the list
        } catch (error) {
            console.error('Error deleting personnel:', error);
            alert('An error occurred while deleting personnel.');
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Are you sure you want to delete personnel: ${user.name}? This action cannot be undone.`)) {
            return;
        }

        try {
            // Replace with your actual delete API call logic
            console.log(`Attempting to delete user with ID: ${userid}`);
            
            // Example API call structure (you'll need to implement the API route)
            const response = await fetch('/api/db', { 
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'deletePersonnel',
                    params: { id: userid }
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('Personnel deleted successfully!');
            } else {
                alert(`Failed to delete personnel: ${data.error || 'Unknown error'}`);
            }
            router.replace('/personnel'); // Redirect back to the list
        } catch (error) {
            console.error('Error deleting personnel:', error);
            alert('An error occurred while deleting personnel.');
        }
    };

    // --- Loading and Error States ---

    if (isLoading) {
        return <div className="p-8 text-center text-lg text-gray-700">Loading user details...</div>;
    }

    if (!user) {
        return <div className="p-8 text-center text-xl font-semibold text-red-600">User details not found.</div>;
    }

    // --- Helper Functions and Components ---

    // Helper function to format date strings
    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'N/A';
    };

    // Helper component for a clean detail row
    const DetailRow = ({ label, value }) => (
        <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
            <strong className="text-gray-700 text-base">{label}:</strong>
            <span className="text-gray-900 text-base font-medium">{value}</span>
        </div>
    );

    // --- Rendered Component ---

    return(
        <div className="min-h-screen bg-gray-50">
            {/* Header/Navigation Bar (Black) */}
            <header className="w-full h-12 bg-black flex justify-between items-center px-4 shadow-md">
                <span className="text-white text-xl font-bold tracking-wider">Commandr</span>

                <Button
                    text="Return To Personnel List"
                    style="Filled"
                    className="text-white bg-transparent border border-white hover:bg-white hover:text-black transition duration-200 ease-in-out p-1 px-3 text-sm font-medium"
                    onClick={() => {
                        router.replace('/personnel');
                    }}
                />
            </header>
            
            <main className="p-4 md:p-8 max-w-4xl mx-auto">
                {/* Personnel Header and Action Buttons */}
                <div className="pb-6 border-b border-gray-300 mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">
                            Personnel Details
                        </h1>
                        <p className="text-xl text-gray-600 mt-1">Viewing: <span className="font-semibold">{user.name}</span></p>
                    </div>
                    
                    <div className="flex space-x-3">
                        {/* Update Button */}
                        <Button
                            text="Update Personnel"
                            style="Filled" 
                            className="bg-blue-600 text-white hover:bg-blue-700 transition duration-200 ease-in-out px-4 py-2 font-medium rounded-lg shadow-md"
                            onClick={handleUpdate}
                        />
                        {/* Retire Button */}
                        <Button
                            text="Retire Personnel"
                            style="Filled" 
                            className="bg-blue-600 text-white hover:bg-blue-700 transition duration-200 ease-in-out px-4 py-2 font-medium rounded-lg shadow-md"
                            onClick={handleRetire}
                        />
                        
                        {/* Delete Button */}
                        <Button
                            text="Delete Personnel"
                            style="Filled"
                            className="bg-red-600 text-white hover:bg-red-700 transition duration-200 ease-in-out px-4 py-2 font-medium rounded-lg shadow-md"
                            onClick={handleDelete}
                        />
                    </div>
                </div>

                {/* Details Card (White Background) */}
                <div className="bg-white p-6 md:p-10 shadow-xl rounded-lg border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">Basic Information</h2>
                    
                    <div className="space-y-0">
                        <DetailRow label="Name" value={user.name} />
                        <DetailRow label="Date of Birth" value={formatDate(user.dateofbirth)} />
                        <DetailRow label="Gender" value={user.gender} />
                        <DetailRow label="Phone Number" value={user.phonenumber} />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-6 border-b pb-3">Employment Details</h2>
                    
                    <div className="space-y-0">
                        <DetailRow label="Position" value={user.position} />
                        <DetailRow label="Department" value={user.department} />
                        <DetailRow label="Employment Date" value={formatDate(user.employdate)} />
                        <DetailRow label="Manager" value={user.managername} />
                        <DetailRow 
                            label="Is Currently Employee" 
                            value={user.isactive ? 'Yes' : 'No'}
                        />
                        {user.terminationdate && user.terminationdate !== 'N/A' && (
                            <DetailRow 
                                label="Termination Date" 
                                value={formatDate(user.terminationdate)} 
                            />
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}