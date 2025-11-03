// addpersonnel:
"use client"

import React, { useState, useEffect } from "react"; // ⬅️ ADDED useEffect
import { useRouter, useSearchParams } from "next/navigation";
import Button from "../../components/button/button";


export default function AddPersonnelPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // 🆕 NEW STATE: To hold fetched positions and handle loading
    const [positions, setPositions] = useState([]);
    const [isLoading, setIsLoading] = useState(true); // ⬅️ Set default to true now
    
    const [user, setUser] = useState(null); 

    const [formData, setFormData] = useState({
        name: '',
        dateofbirth: '',
        gender: 'Male', 
        phonenumber: '',
        positionid: '', // ⬅️ CHANGED: use positionid (a number) instead of positionname (a string)
        employdate: new Date().toISOString().substring(0, 10), 
        isactive: true, 
        email: '',
        password: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    let AssignerID=0;
    useEffect(() => {
            const checkAuth = async () => {
                try {
                    const response = await fetch('../api/auth/check', { credentials: 'include' });
                    if (!response.ok) {
                        router.replace('/signin');
                        return;
                    }
                    const data = await response.json();
                    AssignerID=data.user;
                    console.error('hehe: ' + AssignerID);
                } catch (error) {
                    console.error('Auth check failed:', error);
                    router.replace('/signin');
                }
            };
            checkAuth();
        }, [router]);


    useEffect(() => {
        async function fetchPositions() {
            try {
                // Call the new API endpoint to get positions
                const response = await fetch('/db/dbroute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ operation: 'getPositions' }),
                });
                
                const data = await response.json();

                if (response.ok && data.success) {
                    setPositions(data.data);
                    // Set a default position if available
                    if (data.data.length > 0) {
                        setFormData(prev => ({
                            ...prev,
                            positionid: data.data[0].positionid.toString(), // ⬅️ Set default
                        }));
                    }
                } else {
                    setMessage(`Error fetching positions: ${data.error || 'Unknown error.'}`);
                }
            } catch (error) {
                console.error('Fetch positions error:', error);
                setMessage('An unexpected error occurred while fetching positions.');
            } finally {
                setIsLoading(false);
            }
        }
        fetchPositions();
    }, []); // Empty dependency array means it runs once on mount

    // ⬅️ UPDATED FIELD DEFINITIONS: Position and Department fields changed
    const fields = [
        { label: "Full Name", name: "name", type: "text", required: true },
        { label: "Date of Birth", name: "dateofbirth", type: "date", required: true },
        { label: "Gender", name: "gender", type: "select", options: ["Male", "Female", "Other"], required: true },
        { label: "Phone Number", name: "phonenumber", type: "tel", required: true },
        // ⬅️ UPDATED: This field will now be a dynamic select
        { label: "Position", name: "positionid", type: "select-dynamic", required: true },
        { label: "Employment Date", name: "employdate", type: "date", required: true },
        { label: "Email", name: "email", type: "email", required: true },
        { label: "Initial Password", name: "password", type: "password", required: true },
    ];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsSubmitting(true);

        // ⬅️ UPDATED VALIDATION CHECK: Check for 'positionid' instead of 'position' and 'department'
        const requiredFields = ['name', 'dateofbirth', 'phonenumber', 'positionid', 'email', 'password'];
        const isValid = requiredFields.every(field => formData[field]);

        if (!isValid) {
            setMessage("Please fill in all required fields.");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch('/db/dbroute', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'createPersonnel', 
                    params: {
                        id: AssignerID, 
                        data: formData, // Pass all personnel data as 'data'
                    },
                }),
            });
            
            const data = await response.json();

            if (response.ok && !data.error) {
                setMessage(`Success! New personnel '${formData.name}' added.`);
                
                setTimeout(() => {
                    router.replace('/personnel'); 
                }, 1500);

            } else {
                setMessage(`Error: Failed to add personnel. ${data.error || 'Unknown error.'}`);
            }

        } catch (error) {
            console.error('Submission error:', error);
            setMessage('An unexpected error occurred during submission.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) { // 🆕 NEW: Loading state while fetching positions
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-xl font-semibold text-gray-600">Loading positions...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header Bar */}
            <div className="w-full h-10 bg-black flex justify-between items-center px-4 shadow-md">
                <span className="text-white text-lg font-semibold">Commandr</span>
                <Button
                    text="Return To Personnels"
                    style="Filled"
                    className="text-white bg-transparent border border-white hover:bg-white hover:text-black p-1 text-sm"
                    onClick={async () => {
                        router.replace('/personnel');
                    }}
                />
            </div>
            
            {/* Main Content */}
            <div className="flex-grow p-4 md:p-8">
                <div className="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-xl shadow-2xl">
                    <h1 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-2">
                        Add New Personnel
                    </h1>
                    
                    {/* Status Message */}
                    {message && (
                        <div 
                            className={`p-4 mb-4 rounded-lg font-medium ${message.includes('Success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                            role="alert"
                        >
                            {message}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Dynamically render inputs */}
                            {fields.map(field => (
                                <div key={field.name}>
                                    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    
                                    {/* ⬅️ UPDATED: Handle dynamic select for positions */}
                                    {field.type === 'select-dynamic' ? (
                                        <select
                                            id={field.name}
                                            name={field.name}
                                            value={formData[field.name]}
                                            onChange={handleChange}
                                            required={field.required}
                                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="" disabled>Select a Position</option> 
                                            {positions.map(pos => (
                                                // The value should be the PositionID (the foreign key)
                                                <option key={pos.positionid} value={pos.positionid}>
                                                    {pos.positionname}
                                                </option>
                                            ))}
                                        </select>
                                    ) : field.type === 'select' ? (
                                        // Existing static select for Gender
                                        <select
                                            id={field.name}
                                            name={field.name}
                                            value={formData[field.name]}
                                            onChange={handleChange}
                                            required={field.required}
                                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            {field.options.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        // Standard text/date/tel/email input
                                        <input
                                            id={field.name}
                                            name={field.name}
                                            type={field.type}
                                            value={formData[field.name]}
                                            onChange={handleChange}
                                            required={field.required}
                                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            {...(field.type === 'date' && { max: new Date().toISOString().substring(0, 10) })}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <Button
                                type="submit"
                                style = "Filled"
                                text={isSubmitting ? "Adding Personnel..." : "Add Personnel"}
                                disabled={isSubmitting}
                                className="w-full bg-green-600 text-white hover:bg-green-700"
                            />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}