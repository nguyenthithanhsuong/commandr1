"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation"; 
import Button from "../../components/button/button";

export default function UpdateProjectPage() { // Renamed component
        const router = useRouter();
        const searchParams = useSearchParams();
        const projectid = searchParams.get('id'); 
    
        const [isLoading, setIsLoading] = useState(true); 
        
        const [isSubmitting, setIsSubmitting] = useState(false); 
        const [message, setMessage] = useState('');
    
        const [formData, setFormData] = useState({
                projectname: ' ',
                projectstatus: 'Planning',
                description: ''
            });

        //auth bundle
                    const [AssignerID, setAssignerID] = useState([]);
                    useEffect(() => {
                            const checkAuth = async () => {
                                try {
                                    const response = await fetch('../api/auth/check', { credentials: 'include' });
                                    if (!response.ok) {
                                        router.replace('/signin');
                                        return;
                                    }
                                    const data = await response.json();
                                    setAssignerID(data.user);
                                } catch (error) {
                                    console.error('Auth check failed:', error);
                                    router.replace('/signin');
                                }
                            };
                            checkAuth();
                        }, [router]);
                    
                    //authorization bundle
                    const [authorization, setAuthorization] = useState('');
                
                    //fetch perms
                    useEffect(() => {
                        if (!AssignerID) return;
                
                        const fetchAuthorization = async () => {
                        const authorizationResponse = await fetch('/db/dbroute', {
                            method: 'POST',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                            operation: 'authorization',
                            params: { id: AssignerID }
                      })
                    });
                
                    const result = await authorizationResponse.json();
                    setAuthorization(result.data);
                  };
                  fetchAuthorization();
                  }, [AssignerID]);
                
                  //reroute for personnels
                  useEffect(() => {
                    if (!authorization) return;  // Wait until authorization is set
                
                    if (authorization.ispersonnel == 1) {
                        router.replace('/personal');
                    }
                }, [authorization, router]);
                
                  //reroute for specific perms
                  useEffect(() => {
                    if (!authorization) return;  // Wait until authorization is set
                
                    if (authorization.workpermission == 0) {
                        router.replace('/project');
                    }
                    setIsLoading(false);
                }, [authorization, router]);
                
    useEffect(() => {
        const fetchDependencies = async () => {
            let projectData = null;
            try {
                const projectResponse = await fetch('/db/dbroute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ operation: 'getProjectById', params: { id: projectid } }), 
                });
                const data = await projectResponse.json();
                if (projectResponse.ok && data.success) {
                    projectData = data.data;
                } else {
                    console.error('Error fetching project:', projectData.error);
                }

                if (projectData) {
                // Map fetched data to form state, including the newly fetched positionid
                setFormData({
                projectname: projectData.projectname,
                projectstatus: projectData.projectstatus, 
                description: projectData.description
                });
            }
            else{
                setMessage('Project details not found or could not be loaded.');
                setFormData(false);
            }
         } catch (error) {
                console.error('Fetch dependencies error:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDependencies();
    }, [projectid]); 

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
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsSubmitting(true);

        // Basic validation
        const requiredFields = ['projectname'];
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
                    operation: 'updateProject', 
                    params: {
                        id: projectid, // ⭐ Pass the ID
                        data: formData, // Pass all updated Project data
                    },
                }),
            });
            
            const data = await response.json();

            if (response.ok && data.success) {
                setMessage(`✅ Success! Project '${formData.projectname}' updated.`);
                
                setTimeout(() => {
                    router.replace('/project'); 
                }, 1500);

            } else {
                setMessage(`❌ Error: Failed to update Project. ${data.error || 'Unknown error.'}`);
            }

        } catch (error) {
            setMessage('❌ An unexpected error occurred during submission.');
            console.error('Submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Logic: Loading & Main Form ---

    if (isLoading) { 
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-xl font-semibold text-gray-600">Loading project details... 🔄</p>
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
                        Edit Project: **{formData.projectname}** 📝
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
                                text={isSubmitting ? "Updating Project..." : "Update Project"}
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