"use client";

import React, { useState, useEffect } from "react";
// We need to use 'useSearchParams' to get the task ID from the URL
import { useRouter, useSearchParams } from "next/navigation"; 
import Button from "../../components/button/button";

// NOTE: In a real application, the current user's ID (the assigner) 
// would come from an authentication context/session. We'll hardcode it for this example.
const ASSIGNER_ID = '1'; 

export default function UpdateTaskPage() { // Renamed component
    const router = useRouter();
    const searchParams = useSearchParams();
    const taskId = searchParams.get('id'); // ⭐ GET THE TASK ID FROM THE URL

    // --- State Initialization ---
    const [personnelList, setPersonnelList] = useState([]);
    const [projectList, setProjectList] = useState([]);
    
    // ⭐ New state for the initial task data
    const [initialTaskData, setInitialTaskData] = useState(null); 

    const [isLoading, setIsLoading] = useState(true); 
    const [formData, setFormData] = useState({
        taskname: '',
        taskstatus: 'To Do', 
        assignerid: ASSIGNER_ID,
        personnelid: '', 
        projectid: '', 
        description: '',
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState('');

    // --- Data Fetching Hook: Task, Personnel, and Projects ---
    useEffect(() => {
        if (!taskId) {
            setMessage("Error: No Task ID provided for update.");
            setIsLoading(false);
            return;
        }

        const fetchDependencies = async () => {
            try {
                // 0. Fetch Specific Task Data
                const taskResponse = await fetch('/db/dbroute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // Operation needs to be 'getTaskById'
                    body: JSON.stringify({ operation: 'getTaskById', params: { id: taskId } }), 
                });
                const taskData = await taskResponse.json();

                if (taskResponse.ok && taskData.success) {
                    setInitialTaskData(taskData.data);
                    // ⭐ Initialize form data with fetched task values (using their ID fields)
                    setFormData({
                        taskname: taskData.data.taskname,
                        taskstatus: taskData.data.taskstatus,
                        assignerid: ASSIGNER_ID, 
                        personnelid: taskData.data.personnelid?.toString() || '',
                        projectid: taskData.data.projectid?.toString() || '', 
                        description: taskData.data.description || '',
                    });
                } else {
                    console.error('Error fetching task:', taskData.error);
                    setMessage(`Could not load task with ID ${taskId}. ${taskData.error}`);
                    setIsLoading(false);
                    return; // Stop if the task can't be loaded
                }


                // 1. Fetch All Personnel Active
                const personnelResponse = await fetch('/db/dbroute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ operation: 'getAllPersonnelActive' }),
                });
                const personnelData = await personnelResponse.json();
                if (personnelResponse.ok && personnelData.success) {
                    setPersonnelList(personnelData.data);
                } else {
                    console.error('Error fetching personnel:', personnelData.error);
                }

                // 2. Fetch All Projects
                const projectResponse = await fetch('/db/dbroute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ operation: 'getAllProject' }),
                });
                const projectData = await projectResponse.json();
                if (projectResponse.ok && projectData.success) {
                    setProjectList(projectData.data);
                } else {
                    console.error('Error fetching projects:', projectData.error);
                }
                
            } catch (error) {
                console.error('Fetch dependencies error:', error);
                setMessage('An unexpected error occurred while fetching task details, personnel, and project lists.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchDependencies();
    }, [taskId]); // Re-run effect if taskId changes

    // --- Form Fields Definition (Remains the same as AddTaskPage) ---
    const fields = [
        { label: "Task Name", name: "taskname", type: "text", required: true },
        { label: "Task Status", name: "taskstatus", type: "select", options: ["To Do", "In Progress", "Completed"], required: true },
        { label: "Assigned Personnel", name: "personnelid", type: "select-dynamic-personnel", required: true },
        { label: "Related Project", name: "projectid", type: "select-dynamic-project", required: false },
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
        const requiredFields = ['taskname', 'taskstatus', 'personnelid'];
        const isValid = requiredFields.every(field => formData[field]);

        if (!isValid) {
            setMessage("Please fill in all required fields (Task Name, Status, and Assigned Personnel).");
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
                    // ⭐ The operation changes to 'updateTask'
                    operation: 'updateTask', 
                    params: {
                        id: taskId, // ⭐ Pass the Task ID
                        data: formData, // Pass all updated task data
                    },
                }),
            });
            
            const data = await response.json();

            if (response.ok && data.success) {
                setMessage(`Success! Task '${formData.taskname}' updated.`);
                
                setTimeout(() => {
                    router.replace('/task'); 
                }, 1500);

            } else {
                setMessage(`Error: Failed to update task. ${data.error || 'Unknown error.'}`);
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
                <p className="text-xl font-semibold text-gray-600">Loading task details... 🔄</p>
            </div>
        );
    }

    if (!initialTaskData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-xl font-semibold text-red-600">
                    Task Not Found or an Error Occurred.
                </p>
            </div>
        );
    }
    
    if (personnelList.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <p className="text-xl font-semibold text-red-600">
                    Cannot edit task: No personnel records found to assign to.
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
                        Edit Task: **{initialTaskData.taskname}** 📝
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
                                            value={formData[field.name]}
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
                                        // Standard text input for Task Name
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
                                text={isSubmitting ? "Updating Task..." : "Update Task"}
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