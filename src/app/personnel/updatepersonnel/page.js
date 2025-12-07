"use client"

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "../../components/button/button";

export default function UpdatePersonnelPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const personnelId = searchParams.get('id'); 

    const [positions, setPositions] = useState([]);
    const [isLoading, setIsLoading] = useState(true); 
    const [isSubmitting, setIsSubmitting] = useState(false); 
    const [message, setMessage] = useState('');
    
    // The main data to be edited
    const [formData, setFormData] = useState(null); 

    // Helper function to format date strings for input[type="date"]
    const formatInputDate = (dateString) => {
        return dateString ? new Date(dateString).toISOString().substring(0, 10) : '';
    };

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
    
        if (authorization.personnelpermission == 0) {
            router.replace('/personnel');
        }
    }, [authorization, router]);

    // --- Combined Data Fetching Effect (Personnel Data + Positions) ---
    useEffect(() => {
        if (!personnelId) {
            console.error("No Personnel ID provided in URL.");
            setIsLoading(false);
            return;
        }
    }, [personnelId]); 

     useEffect(() => {
        if(!authorization) return;
        async function fetchAllData() {
            let personnelData = null;
            let fetchedPositions = [];

            // 1. Fetch Personnel Data
            try {
                const personnelResponse = await fetch('/db/dbroute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ operation: 'getPersonnelById', params: { id: personnelId } }),
                });
                const data = await personnelResponse.json();
                if (personnelResponse.ok && data.data) {
                    personnelData = data.data;
                }
            } catch (error) {
                console.error('Error fetching personnel data:', error);
            }

            // 2. Fetch Positions List
            try {
                const positionsResponse = await fetch('/db/dbroute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ operation: 'getPosition' , params: {data: authorization.isadmin} }),
                });
                const posData = await positionsResponse.json();
                if (positionsResponse.ok && posData.success) {
                    fetchedPositions = posData.data;
                }
            } catch (error) {
                console.error('Error fetching positions list:', error);
            }

            setPositions(fetchedPositions);

            if (personnelData) {
                // Map fetched data to form state, including the newly fetched positionid
                setFormData({
                    id: personnelId, 
                    name: personnelData.name || '',
                    dateofbirth: formatInputDate(personnelData.dateofbirth),
                    gender: personnelData.gender || 'Male',
                    phonenumber: personnelData.phonenumber || '',
                    positionid: personnelData.positionid ? personnelData.positionid.toString() : '', // ⬅️ USE positionid
                    employdate: formatInputDate(personnelData.employdate),
                    managerid: personnelData.managerid || '',
                    email: personnelData.email || '', 
                    password: '',
                    // Include isactive and terminationdate for the DB update call
                    isactive: personnelData.isactive, 
                    terminationdate: personnelData.terminationdate ? formatInputDate(personnelData.terminationdate) : null,
                });
            } else {
                setMessage('Personnel details not found or could not be loaded.');
                setFormData(false);
            }

            setIsLoading(false);
        }

        fetchAllData();
    }, [authorization]); 

    // ⬅️ UPDATED FIELD DEFINITIONS: Changed Position to use PositionID and dynamic select
    const fields = [
        // Basic Info
        { label: "Full Name", name: "name", type: "text", required: true },
        { label: "Date of Birth", name: "dateofbirth", type: "date", required: true },
        { label: "Gender", name: "gender", type: "select", options: ["Male", "Female", "Other"], required: true },
        { label: "Phone Number", name: "phonenumber", type: "tel", required: true },
        // Employment Details
        { label: "Position", name: "positionid", type: "select-dynamic", required: true }, // ⬅️ Use positionid
        // REMOVED 'Department' as it's derived from PositionID
        { label: "Employment Date", name: "employdate", type: "date", required: true },
        // Account Info
        { label: "email", name: "email", type: "email", required: true }, 
        { label: "New password (Optional)", name: "password", type: "password", required: false },
    ];

    // --- Form Handling ---
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

        const requiredFields = fields.filter(f => f.required && f.name !== 'password').map(f => f.name);
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'updatePersonnel', 
                    params: {
                        id: personnelId, 
                        data: formData, // formData now contains positionid
                    },
                }),
            });
            
            const data = await response.json();

            if (response.ok && !data.error) {
                setMessage(`✅ Success! Personnel '${formData.name}' updated.`);
                
                setTimeout(() => {
                    router.replace('/personnel'); 
                }, 1500);

            } else {
                setMessage(`❌ Error: Failed to update personnel. ${data.error || 'Unknown error.'}`);
            }

        } catch (error) {
            console.error('Submission error:', error);
            setMessage('❌ An unexpected error occurred during submission.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Render Logic ---

    if (isLoading) {
        return <div className="p-8 text-center text-lg text-gray-700">Loading personnel details...</div>;
    }

    if (formData === false) {
        return <div className="p-8 text-center text-xl font-semibold text-red-600">Personnel details not found.</div>;
    }
    
    if (!formData) {
        return <div className="p-8 text-center text-xl font-semibold text-red-600">Personnel details could not be loaded.</div>;
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
                        Update Personnel
                    </h1>
                    <p className="text-xl text-gray-600 mt-1 mb-4">Editing: <span className="font-semibold">{formData.name} (ID: {personnelId})</span></p>

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
                            {fields
                                .map(field => (
                                <div key={field.name}>
                                    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                                        {field.label} {field.required && <span className="text-red-500">*</span>}
                                    </label>
                                    
                                    {field.type === 'select-dynamic' ? (
                                        // ⬅️ NEW: Dynamic select for PositionID
                                        <select
                                            id={field.name}
                                            name={field.name}
                                            value={formData[field.name] || ''}
                                            onChange={handleChange}
                                            required={field.required}
                                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        >
                                            <option value="" disabled>Select a Position</option> 
                                            {positions.map(pos => (
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
                                            value={formData[field.name] || ''}
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
                                            value={formData[field.name] === null || formData[field.name] === undefined ? '' : formData[field.name]}
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
                                style="Filled"
                                text={isSubmitting ? "Updating Personnel..." : "Save Changes"}
                                disabled={isSubmitting}
                                className="w-full bg-indigo-600 text-white hover:bg-indigo-700"
                            />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}