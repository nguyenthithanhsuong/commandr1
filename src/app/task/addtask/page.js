"use client"

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "../../components/button/button";


export default function AddTaskPage() {
    const router = useRouter();

    const [personnelList, setPersonnelList] = useState([]);
    const [projectList, setProjectList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [formData, setFormData] = useState({
        taskname: '',
        taskstatus: 'To Do', // Default status
        assignerid: '1', 
        personnelid: '', // Who the task is assigned to
        projectid: null, // Which project the task belongs to
        description: '',
        enddate: '', // **NEW: Due Date field**
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');
    
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('../api/auth/check', { credentials: 'include' });
                if (!response.ok) {
                    router.replace('/signin');
                    return;
                }
                const data = await response.json();
                if (data.user) {
                    setFormData(prev => ({
                        ...prev,
                        assignerid: data.user.toString() // Assuming data.user is the ID
                    }));
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                router.replace('/signin');
            }
        };
        checkAuth();
    }, [router]);


    // --- Data Fetching Hook: Personnel and Projects ---

    useEffect(() => {
        const fetchDependencies = async () => {
            try {
                // 1. Fetch All Personnel (for assignment)
                const personnelResponse = await fetch('/db/dbroute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ operation: 'getAllPersonnelActive' }),
                });
                const personnelData = await personnelResponse.json();

                let defaultPersonnelId = '';
                if (personnelResponse.ok && personnelData.success && personnelData.data.length > 0) {
                    setPersonnelList(personnelData.data);
                    defaultPersonnelId = personnelData.data[0].userid.toString();
                } else if (!personnelResponse.ok || !personnelData.success) {
                    console.error('Error fetching personnel:', personnelData.error || personnelResponse.statusText);
                }

                // 2. Fetch All Projects (for project linkage)
                const projectResponse = await fetch('/db/dbroute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ operation: 'getAllProject' }),
                });
                const projectData = await projectResponse.json();
                
                let defaultProjectId = null;
                if (projectResponse.ok && projectData.success && projectData.data.length > 0) {
                    setProjectList(projectData.data);
                } else if (!projectResponse.ok || !projectData.success) {
                     console.error('Error fetching projects:', projectData.error || projectResponse.statusText);
                }
                
                // Set initial form data after fetching lists
                setFormData(prev => ({
                    ...prev,
                    personnelid: defaultPersonnelId || prev.personnelid,
                    projectid: defaultProjectId || prev.projectid,
                }));
                
            } catch (error) {
                console.error('Fetch dependencies error:', error);
                setMessage('An unexpected error occurred while fetching personnel and project lists.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDependencies();
    }, []); 

    // --- Form Fields Definition ---
    const fields = [
        { label: "Task Name", name: "taskname", type: "text", required: true },
        { label: "Task Status", name: "taskstatus", type: "select", options: ["To Do", "In Progress", "Completed"], required: true },
        { label: "Assigned Personnel", name: "personnelid", type: "select-dynamic-personnel", required: true },
        { label: "Due Date", name: "enddate", type: "date", required: false }, // **NEW FIELD**
        { label: "Related Project", name: "projectid", type: "select-dynamic-project", required: false },
        { label: "Description", name: "description", type: "textarea", required: false },
    ];

    // --- Handlers ---

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            // Convert to string for consistency, value from date input is YYYY-MM-DD string
            [name]: value.toString(), 
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsSubmitting(true);

        // Basic validation
        const requiredFields = ['taskname', 'taskstatus', 'personnelid'];
        const isValid = requiredFields.every(field => formData[field]);

        if (!isValid) {
            setMessage("Please fill in all required fields (Task Name, Status, and Assigned Personnel).");
            setIsSubmitting(false);
            return;
        }

        // Prepare data for submission, converting empty string dates/projects to null for DB
        const dataToSubmit = {
            ...formData,
            // Convert empty string date to null for SQL compatibility (if the column allows NULL)
            enddate: formData.enddate === '' ? null : formData.enddate, 
            // Convert empty string projectid to null
            projectid: formData.projectid === '' ? null : formData.projectid,
        };
        
        // Use the assignerid from the state, which is updated in the checkAuth useEffect
        const currentAssignerId = dataToSubmit.assignerid; 

        try {
            const response = await fetch('/db/dbroute', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'createTask', 
                    params: {
                        id: currentAssignerId, // Use ID from state/fetched data
                        data: dataToSubmit, // Pass prepared task data
                    },
                }),
            });
            
            const data = await response.json();

            if (response.ok && data.success) {
                setMessage(`Success! New task '${formData.taskname}' added.`);
                
                setTimeout(() => {
                    router.replace('/task'); 
                }, 1500);

            } else {
                setMessage(`Error: Failed to add task. ${data.error || 'Unknown error.'}`);
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
                <p className="text-xl font-semibold text-gray-600">Loading personnel and project lists... 🔄</p>
            </div>
        );
    }
    
    // Check if essential lists are empty
    if (personnelList.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-xl font-semibold text-red-600">
                    Cannot add a task: No personnel records found to assign to.
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
                    text="Return To Task List"
                    style="Filled"
                    className="text-white bg-transparent border border-white hover:bg-white hover:text-black p-1 text-sm"
                    onClick={() => {
                        router.replace('/task');
                    }}
                />
            </div>
            
            {/* Main Content */}
            <div className="flex-grow p-4 md:p-8">
                <div className="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-xl shadow-2xl">
                    <h1 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-2">
                        Create New Task ✍️
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
                                        // Static select for Task Status
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
                                    ) : field.type === 'select-dynamic-personnel' ? (
                                        // Dynamic select for Personnel
                                        <select
                                            id={field.name}
                                            name={field.name}
                                            value={formData[field.name]}
                                            onChange={handleChange}
                                            required={field.required}
                                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="" disabled>Select Personnel</option> 
                                            {personnelList.map(person => (
                                                <option key={person.userid} value={person.userid}>
                                                    {person.name} ({person.position})
                                                </option>
                                            ))}
                                        </select>
                                    ) : field.type === 'select-dynamic-project' ? (
                                        // Dynamic select for Project
                                        <select
                                            id={field.name}
                                            name={field.name}
                                            value={formData[field.name] || ""} // Use "" for the 'No Project' option to be selected if projectid is null
                                            onChange={handleChange}
                                            required={field.required}
                                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                                        >
                                            <option value="">No Project (Optional)</option> 
                                            {projectList.map(project => (
                                                <option key={project.projectid} value={project.projectid}>
                                                    {project.projectname}
                                                </option>
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
                                        // Standard text or date input (including the new 'date' type)
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
                                text={isSubmitting ? "Creating Task..." : "Create Task"}
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