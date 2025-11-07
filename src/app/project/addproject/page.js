"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "../../components/button/button";

// The main component for adding a new project
export default function AddProjectPage() {
    const router = useRouter();

    // State for form data
    const [formData, setFormData] = useState({
        projectname: '',
        projectstatus: 'Planning', // Default status for a new project
        description: '',
        // AssignerID will be fetched and updated in the effect hook
    });
    
    // State to hold the AssignerID (logged-in user's ID)
    const [assignerId, setAssignerId] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Loading state for auth check/initial setup

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    // --- Authentication and Assigner ID Fetching ---
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('../api/auth/check', { credentials: 'include' });
                if (!response.ok) {
                    router.replace('/signin');
                    return;
                }
                const data = await response.json();
                
                // Set the fetched AssignerID (UserID of the logged-in user)
                setAssignerId(data.user); 
                setIsLoading(false); // Finished initial loading
            } catch (error) {
                console.error('Auth check failed:', error);
                router.replace('/signin');
            }
        };
        checkAuth();
    }, [router]);

    // --- Form Fields Definition ---
    const fields = [
        { label: "Project Name", name: "projectname", type: "text", required: true },
        { 
            label: "Project Status", 
            name: "projectstatus", 
            type: "select", 
            options: ["Planning", "In Progress", "On Hold", "Completed"], // Project statuses
            required: true 
        },
        { label: "Description", name: "description", type: "textarea", required: false },
    ];

    // --- Handlers ---

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value.toString(), 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsSubmitting(true);

        // Basic validation
        const requiredFields = ['projectname', 'projectstatus'];
        const isValid = requiredFields.every(field => formData[field]) && assignerId !== null;

        if (!isValid) {
            setMessage("Please fill in all required fields (Project Name and Status) and ensure you are logged in.");
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
                    operation: 'createProject', // **IMPORTANT: This must match your server action**
                    params: {
                        id: assignerId, // The logged-in user who is creating/assigning the project
                        data: formData, // Pass all project data
                    },
                }),
            });
            
            const data = await response.json();

            if (response.ok && data.success) {
                setMessage(`Success! New project '${formData.projectname}' created.`);
                
                setTimeout(() => {
                    router.replace('/project'); // Redirect to the project list page
                }, 1500);

            } else {
                setMessage(`Error: Failed to add project. ${data.error || 'Unknown error.'}`);
            }

        } catch (error) {
            console.error('Submission error:', error);
            setMessage('An unexpected error occurred during submission.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Logic: Loading & Main Form ---

    if (isLoading) { 
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-xl font-semibold text-gray-600">Checking authentication... 🔐</p>
            </div>
        );
    }
    
    // Fallback if AssignerID is somehow missing after loading
    if (assignerId === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-xl font-semibold text-red-600">
                    Authentication failed. Please sign in again.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header Bar */}
            <div className="w-full h-10 bg-black flex justify-between items-center px-4 shadow-md">
                <span className="text-white text-lg font-semibold">Commandr</span>
                <Button
                    text="Return To Project List"
                    style="Filled"
                    className="text-white bg-transparent border border-white hover:bg-white hover:text-black p-1 text-sm"
                    onClick={() => {
                        router.replace('/project');
                    }}
                />
            </div>
            
            {/* Main Content */}
            <div className="flex-grow p-4 md:p-8">
                <div className="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-xl shadow-2xl">
                    <h1 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-2">
                        Create New Project 🏗️
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
                            
                            {fields.map(field => (
                                <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                                    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    
                                    {field.type === 'select' ? (
                                        // Static select for Project Status
                                        <select
                                            id={field.name}
                                            name={field.name}
                                            value={formData[field.name]}
                                            onChange={handleChange}
                                            required={field.required}
                                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            {field.options.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                    ) : field.type === 'textarea' ? (
                                        // Textarea for Description
                                        <textarea
                                            id={field.name}
                                            name={field.name}
                                            rows="4"
                                            value={formData[field.name]}
                                            onChange={handleChange}
                                            required={field.required}
                                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    ) : (
                                        // Standard text input for Project Name
                                        <input
                                            id={field.name}
                                            name={field.name}
                                            type={field.type}
                                            value={formData[field.name]}
                                            onChange={handleChange}
                                            required={field.required}
                                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <Button
                                type="submit"
                                style="Filled"
                                text={isSubmitting ? "Creating Project..." : "Create Project"}
                                disabled={isSubmitting}
                                className="w-full bg-blue-600 text-white hover:bg-blue-700"
                            />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}