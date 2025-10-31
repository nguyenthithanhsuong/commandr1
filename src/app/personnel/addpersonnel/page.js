"use client"

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "../../components/button/button";

export default function AddPersonnelPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    // NOTE: This ID should typically come from a session/auth context 
    // for the user performing the add operation (the Manager/HR).
    // I'll use a placeholder '1' as a temporary ManagerID.
    const managerId = '1'; 

    const [isLoading, setIsLoading] = useState(false); // Changed default to false
    const [user, setUser] = useState(null); // Keep if needed for context, but not essential for this form

    const [formData, setFormData] = useState({
        name: '',
        dateofbirth: '',
        gender: 'Male', // Default value
        phonenumber: '',
        position: '',
        department: '',
        employdate: new Date().toISOString().substring(0, 10), // Default to today's date
        isactive: true, // Used in the backend logic
        // *** ADDED: Fields required for Account table insertion (in dbOperations) ***
        email: '',
        password: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    const fields = [
        { label: "Full Name", name: "name", type: "text", required: true },
        { label: "Date of Birth", name: "dateofbirth", type: "date", required: true },
        { label: "Gender", name: "gender", type: "select", options: ["Male", "Female", "Other"], required: true },
        { label: "Phone Number", name: "phonenumber", type: "tel", required: true },
        { label: "Position", name: "position", type: "text", required: true },
        { label: "Department", name: "department", type: "text", required: true },
        { label: "Employment Date", name: "employdate", type: "date", required: true },
        // *** ADDED: Email and Password for Account creation ***
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

        // Extended validation check
        const requiredFields = ['name', 'dateofbirth', 'phonenumber', 'position', 'department', 'email', 'password'];
        const isValid = requiredFields.every(field => formData[field]);

        if (!isValid) {
            setMessage("Please fill in all required fields.");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch('/api/db', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                // *** UPDATED: Match the db/route.js structure ***
                body: JSON.stringify({
                    operation: 'createPersonnel', // Use 'createPersonnel' as defined in db/route.js
                    params: {
                        id: managerId, // Pass the ManagerID as 'id'
                        data: formData, // Pass all personnel data as 'data'
                    },
                }),
            });
            
            const data = await response.json();

            if (response.ok && !data.error) {
                setMessage(`Success! New personnel '${formData.name}' added.`);
                
                // Redirect on success
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
                                    {field.type === 'select' ? (
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
                                        <input
                                            id={field.name}
                                            name={field.name}
                                            type={field.type}
                                            value={formData[field.name]}
                                            onChange={handleChange}
                                            required={field.required}
                                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                            // Handle date formats
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