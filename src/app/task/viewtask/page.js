"use client"

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "../../components/button/button"; // Assuming the Button component is correctly imported

// Utility component to display a single detail row
const DetailRow = ({ label, value }) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
        <strong className="text-gray-700 text-base">{label}:</strong>
        <span className="text-gray-900 text-base font-medium">{value}</span>
    </div>
);

// Helper function to format date strings
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const options = { timeZone: "Asia/Bangkok" };
  const parts = date.toLocaleDateString("en-US", options).split("/");
  const [month, day, year] = parts;
  return `${month}-${day}-${year}`;
};

export default function ViewTaskPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    // Get the task ID from the URL query parameter 'id'
    const taskid = searchParams.get('id');

    const [isLoading, setIsLoading] = useState(true);
    const [task, setTask] = useState(null);

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

    // --- Data Fetching Effect ---
    useEffect(() => {
        if (!taskid) {
            console.error("No Task ID provided in URL.");
            setIsLoading(false);
            return;
        }

        const fetchTaskById = async () => {
            try {
                // Call the API route handler that uses the 'getTaskById' server action
                const response = await fetch('/db/dbroute', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        operation: 'getTaskById', // Matches the operation in your API route
                        params: {
                            id: taskid // Pass the task ID
                        }
                    }),
                });
                const data = await response.json();
                
                if (response.ok && data.data) {
                    setTask(data.data); // Set the fetched task data
                } else {
                    setTask(null);
                }
            } catch (error) {
                console.error('Error fetching task by ID:', error);
            }
            setIsLoading(false);
        };
        
        fetchTaskById();
    }, [taskid]);

    // --- Action Handlers ---

    const handleUpdate = () => {
        router.push(`/task/updatetask?id=${taskid}`);
    };

    const handleDelete = async () => {
        if (!task || !window.confirm(`Are you sure you want to delete task: ${task.taskname}? This action cannot be undone.`)) {
            return;
        }

        try {
            console.log(`Attempting to delete task with ID: ${taskid}`);
            
            // Example API call structure using the 'deleteTask' operation
            const response = await fetch('/db/dbroute', { 
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'deleteTask',
                    params: { id: taskid }
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert('Task deleted successfully!');
            } else {
                alert(`Failed to delete task: ${data.error || 'Unknown error'}`);
            }
            router.replace('/task'); // Redirect back to the task list
        } catch (error) {
            console.error('Error deleting task:', error);
            alert('An error occurred while deleting the task.');
        }
    };

    // --- Loading and Error States ---

    if (isLoading) {
        return <div className="p-8 text-center text-lg text-gray-700">Loading task details...</div>;
    }

    if (!task) {
        return <div className="p-8 text-center text-xl font-semibold text-red-600">Task details not found.</div>;
    }

    // --- Rendered Component ---

    return(
        <div className="min-h-screen bg-gray-50">
            {/* Header/Navigation Bar (Black) */}
            <header className="w-full h-12 bg-black flex justify-between items-center px-4 shadow-md">
                <span className="text-white text-xl font-bold tracking-wider">Commandr</span>

                <Button
                    text="Return To Task List"
                    style="Filled"
                    className="text-white bg-transparent border border-white hover:bg-white hover:text-black transition duration-200 ease-in-out p-1 px-3 text-sm font-medium"
                    onClick={() => {
                        router.replace('/task');
                    }}
                />
            </header>
            
            <main className="p-4 md:p-8 max-w-4xl mx-auto">
                {/* Task Header and Action Buttons */}
                <div className="pb-6 border-b border-gray-300 mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">
                            Task Details 📋
                        </h1>
                        <p className="text-xl text-gray-600 mt-1">Viewing: <span className="font-semibold">{task.taskname}</span></p>
                    </div>
                    
                    {authorization.workpermission == 1 && (<div className="flex space-x-3">
                        {/* Update Button */}
                        <Button
                            text="Update Task"
                            style="Filled" 
                            className="bg-blue-600 text-white hover:bg-blue-700 transition duration-200 ease-in-out px-4 py-2 font-medium rounded-lg shadow-md"
                            onClick={handleUpdate}
                        />
                        
                        {/* Delete Button */}
                        <Button
                            text="Delete Task"
                            style="Filled"
                            className="bg-red-600 text-white hover:bg-red-700 transition duration-200 ease-in-out px-4 py-2 font-medium rounded-lg shadow-md"
                            onClick={handleDelete}
                        />
                    </div>)}
                </div>

                {/* Details Card (White Background) */}
                <div className="bg-white p-6 md:p-10 shadow-xl rounded-lg border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">Task Information</h2>
                    
                    <div className="space-y-0">
                        <DetailRow label="Task Name" value={task.taskname} />
                        <DetailRow label="Project" value={task.projectname || 'N/A'} />
                        <DetailRow label="Status" value={task.taskstatus} />
                        <DetailRow label="Assigned To" value={task.personnelname || 'Unassigned'} />
                        <DetailRow label="Assigned By" value={task.assignername || 'N/A'} />
                        <DetailRow label="Creation Date" value={formatDate(task.creationdate)} />
                        <DetailRow label="End Date" value={formatDate(task.enddate) || 'N/A'} />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-6 border-b pb-3">Description</h2>
                    
                    <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-gray-700">
                        {task.description || 'No description provided.'}
                    </div>
                </div>

            </main>
        </div>
    );
}