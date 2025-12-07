"use client"

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "../../components/button/button"; // Assuming the Button component is correctly imported

const DetailRow = ({ label, value }) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
        <strong className="text-gray-700 text-base">{label}:</strong>
        <span className="text-gray-900 text-base font-medium">{value}</span>
    </div>
);

// Helper function to format date strings (copied from viewtask)
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const options = { timeZone: "Asia/Bangkok" };
  const parts = date.toLocaleDateString("en-US", options).split("/");
  const [month, day, year] = parts;
  return `${month}-${day}-${year}`;
};

export default function ViewProjectPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    // Get the task ID from the URL query parameter 'id'
    const projectid = searchParams.get('id');
    
    
    const [isLoading, setIsLoading] = useState(true);
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);

//auth bundle
            const [AssignerID, setAssignerID] = useState(null);
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

    // --- Data Fetching Effect ---
    useEffect(() => {
        if (!projectid) {
            console.error("No Project ID provided in URL.");
            setIsLoading(false);
            return;
        }

        const fetchProjectById = async () => {
            try {
                // Call the API route handler that uses the 'getProjectById' server action
                const response = await fetch('/db/dbroute', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        operation: 'getProjectById', 
                        params: {
                            id: projectid // Pass the project ID
                        }
                    }),
                });
                const data = await response.json();
                
                if (response.ok && data.data) {
                    setProject(data.data); // Set the fetched project data
                } else {
                    setProject(null);
                }
            } catch (error) {
                console.error('Error fetching project by ID:', error);
            }
            setIsLoading(false);
        };

        const fetchTasks = async () => {
            try {
                const response = await fetch('/db/dbroute', {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        // Operation changed to getAllTask
                        operation: 'getTaskByProjectId',
                        params: {id: projectid}
                    }),
                });
                const data = await response.json();
                if (response.ok && data.data) {
                    // Set tasks data
                    setTasks(data.data);
                } else {
                    console.error('Failed to fetch tasks:', data.error);
                }
            } catch (error) {
                console.error('Error fetching tasks:', error);
            }
            setIsLoading(false);
        }
        fetchProjectById();
        fetchTasks();
    }, [projectid]);

    // --- Action Handlers ---

    const handleUpdate = () => {
        router.push(`/project/updateproject?id=${projectid}`);
    };

    const handleDelete = async () => {
        if (!project || !window.confirm(`Are you sure you want to delete project: ${project.projectname}? This action cannot be undone.`)) {
            return;
        }

        try {
            console.log(`Attempting to delete project with ID: ${projectid}`);
            
            const response = await fetch('/db/dbroute', { 
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'deleteProject',
                    params: { id: projectid }
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                console.log('Project deleted successfully!');
            } else {
                console.error(`Failed to delete project: ${data.error || 'Unknown error'}`);
            }
            // Use standard window navigation instead of router.replace
            window.location.href = '/project'; 
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('An error occurred while deleting the project.');
        }
    };

    // --- Loading and Error States ---

    if (isLoading) {
        return <div className="p-8 text-center text-lg text-gray-700">Loading project details...</div>;
    }

    if (!project) {
        // We now know this is a data retrieval issue, not a missing ID issue.
        return <div className="p-8 text-center text-xl font-semibold text-red-600">Project details not found. Please check console for backend error details.</div>;
    }

    // --- Rendered Component ---

    return(
        <div className="min-h-screen bg-gray-50 relative">

            {/* Header/Navigation Bar (Black) */}
            <header className="w-full h-12 bg-black flex justify-between items-center px-4 shadow-md">
                <span className="text-white text-xl font-bold tracking-wider">Commandr</span>

                <Button
                                    text="Return To Project List"
                                    style="Filled"
                                    className="text-white bg-transparent border border-white hover:bg-white hover:text-black transition duration-200 ease-in-out p-1 px-3 text-sm font-medium"
                                    onClick={() => {
                                        router.replace('/project');
                                    }}
                />
            </header>
            
            <main className="p-4 md:p-8 max-w-4xl mx-auto">
                {/* Project Header and Action Buttons */}
                <div className="pb-6 border-b border-gray-300 mb-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">
                            Project Details 🏛️
                        </h1>
                        <p className="text-xl text-gray-600 mt-1">Viewing: <span className="font-semibold">{project.projectname}</span></p>
                    </div>
                    
                    {authorization.workpermission == 1 && (<div className="flex space-x-3">
                        {/* Update Button (Replaced component with native button) */}
                        <Button
                                                    text="Update Project"
                                                    style="Filled" 
                                                    className="bg-blue-600 text-white hover:bg-blue-700 transition duration-200 ease-in-out px-4 py-2 font-medium rounded-lg shadow-md"
                                                    onClick={handleUpdate}
                                                />
                                                
                                                {/* Delete Button */}
                                                <Button
                                                    text="Delete Project"
                                                    style="Filled"
                                                    className="bg-red-600 text-white hover:bg-red-700 transition duration-200 ease-in-out px-4 py-2 font-medium rounded-lg shadow-md"
                                                    onClick={handleDelete}
                        />
                    </div>)}
                </div>

                {/* Details Card (White Background) */}
                <div className="bg-white p-6 md:p-10 shadow-xl rounded-lg border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">Project Information</h2>
                    
                    <div className="space-y-0">
                        <DetailRow label="Project Name" value={project.projectname} />
                        <DetailRow label="Status" value={project.projectstatus} />
                        <DetailRow label="Project Manager" value={project.assignername || 'Unassigned'} />
                        <DetailRow label="Creation Date" value={formatDate(project.creationdate)} />
                        <DetailRow label="Start Date" value={formatDate(project.startdate)} />
                        <DetailRow label="Due Date" value={formatDate(project.enddate)} />
                    </div>

                    <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-6 border-b pb-3">Description</h2>
                    
                    <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-gray-700">
                        {project.description || 'No description provided.'}
                    </div>
                </div>
                {/*Tasks associated with the project*/}
                <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                    <tr className="bg-gray-100">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creation Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {tasks.map((task) => (
                            <tr 
                                key={task.taskid} 
                                onClick={() => handleRowClick(task)}
                                className="cursor-pointer hover:bg-blue-50 transition duration-150 ease-in-out">
                                
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.taskid}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.taskname}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        task.taskstatus === 'Completed' ? 'bg-green-100 text-green-800' : 
                                        task.taskstatus === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : 
                                        'bg-red-100 text-red-800' // Default/Pending
                                    }`}>
                                        {task.taskstatus}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.personnelname || 'Unassigned'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(task.creationdate)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(task.enddate)}</td>
                                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{task.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            </main>
        </div>
    );
}
