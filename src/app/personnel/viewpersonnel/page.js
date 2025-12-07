"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Button from "../../components/button/button";

export default function ViewPersonnelPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userid = searchParams.get("id");

    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState(null);

    // --- AUTH ---
    const [AssignerID, setAssignerID] = useState(null);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch("../api/auth/check", {
                    credentials: "include",
                });
                if (!response.ok) {
                    router.replace("/signin");
                    return;
                }
                const data = await response.json();
                setAssignerID(data.user);
            } catch (error) {
                console.error("Auth check failed:", error);
                router.replace("/signin");
            }
        };

        checkAuth();
    }, [router]);

    // --- AUTHORIZATION ---
    const [authorization, setAuthorization] = useState(null); // FIXED

    useEffect(() => {
        if (!AssignerID) return; // Prevents premature request

        const fetchAuthorization = async () => {
            try {
                const authorizationResponse = await fetch("/db/dbroute", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        operation: "authorization",
                        params: { id: AssignerID },
                    }),
                });

                const result = await authorizationResponse.json();
                setAuthorization(result.data);
            } catch (error) {
                console.error("Authorization fetch error:", error);
            }
        };

        fetchAuthorization();
    }, [AssignerID]);

    // Redirect personnel users
    useEffect(() => {
        if (!authorization) return;

        if (authorization.ispersonnel == 1) {
            router.replace("/personal");
        }
        console.log(authorization);
    }, [authorization, router]);

    // --- FETCH PERSONNEL DATA ---
    useEffect(() => {
        if (!userid) {
            console.error("No User ID provided in URL.");
            setIsLoading(false);
            return;
        }

        const fetchPersonnelById = async () => {
            try {
                const response = await fetch("/db/dbroute", {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        operation: "getPersonnelById",
                        params: { id: userid },
                    }),
                });

                const data = await response.json();
                console.log(data.data);
                if (response.ok && data.data) {
                    setUser(data.data);
                } else {
                    console.error("Failed to fetch personnel:", data.error);
                }
            } catch (error) {
                console.error("Error fetching personnel:", error);
            }

            setIsLoading(false);
        };

        fetchPersonnelById();
    }, [userid]);

    // --- ACTION HANDLERS ---
    const handleUpdate = () => {
        router.push(`/personnel/updatepersonnel?id=${userid}`);
    };

    const handleRetire = async () => {
        if (!window.confirm(`Retire ${user.name}? This cannot be undone.`)) return;

        try {
            const response = await fetch("/db/dbroute", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    operation: "retirePersonnel",
                    params: { id: userid },
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert("Personnel retired successfully!");
            } else {
                alert(`Failed to retire: ${data.error}`);
            }

            router.replace("/personnel");
        } catch (error) {
            console.error("Error retiring personnel:", error);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm(`Delete ${user.name}? This cannot be undone.`)) return;

        try {
            const response = await fetch("/db/dbroute", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    operation: "deletePersonnel",
                    params: { id: userid },
                }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert("Personnel deleted successfully!");
            } else {
                alert(`Failed to delete: ${data.error}`);
            }

            router.replace("/personnel");
        } catch (error) {
            console.error("Error deleting personnel:", error);
        }
    };

    // --- HELPER FUNCTIONS ---
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        const options = { timeZone: "Asia/Bangkok" };
        const [month, day, year] = date
            .toLocaleDateString("en-US", options)
            .split("/");
        return `${month}-${day}-${year}`;
    };

    const DetailRow = ({ label, value }) => (
        <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
            <strong className="text-gray-700 text-base">{label}:</strong>
            <span className="text-gray-900 text-base font-medium">{value}</span>
        </div>
    );

    // --- LOADING STATES ---
    if (isLoading || authorization === null) {
        return (
            <div className="p-8 text-center text-lg text-gray-700">
                Loading user details...
            </div>
        );
    }

    if (!user) {
        return (
            <div className="p-8 text-center text-xl font-semibold text-red-600">
                User details not found.
            </div>
        );
    }

    // --- RENDER PAGE ---
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="w-full h-12 bg-black flex justify-between items-center px-4 shadow-md">
                <span className="text-white text-xl font-bold tracking-wider">
                    Commandr
                </span>

                <Button
                    text="Return To Personnel List"
                    style="Filled"
                    className="text-white bg-transparent border border-white hover:bg-white hover:text-black transition duration-200 ease-in-out p-1 px-3 text-sm font-medium"
                    onClick={() => router.replace("/personnel")}
                />
            </header>

            <main className="p-4 md:p-8 max-w-4xl mx-auto">
                <div className="pb-6 border-b mb-6 flex justify-between items-center">
                    <div>
                        {user.isactive == '1' && (<h1 className="text-3xl font-extrabold text-gray-900">
                            Personnel Details
                        </h1>)}
                        {user.isactive == '0' && (<h1 className="text-3xl font-extrabold text-gray-900">
                            Retired Personnel Details
                        </h1>)}
                        <p className="text-xl text-gray-600 mt-1">
                            Viewing:{" "}
                            <span className="font-semibold">{user.name}</span>
                        </p>
                    </div>

                    {/* FIXED BUTTON RENDERING */}
                    {(
    authorization.isadmin == '1' ||
    (
        user.isactive == '1' &&
        user.accessid == '4' &&
        authorization.personnelpermission == '1'
    )
) && (
    <div className="flex space-x-3">
        <Button
            text="Update Personnel"
            style="Filled"
            className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md"
            onClick={handleUpdate}
        />

        <Button
            text="Retire Personnel"
            style="Filled"
            className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md"
            onClick={handleRetire}
        />

        <Button
            text="Delete Personnel"
            style="Filled"
            className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg shadow-md"
            onClick={handleDelete}
        />
    </div>
)}

                </div>

                <div className="bg-white p-6 md:p-10 shadow-xl rounded-lg border border-gray-100">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">
                        Basic Information
                    </h2>

                    <DetailRow label="Name" value={user.name} />
                    <DetailRow label="Date of Birth" value={formatDate(user.dateofbirth)} />
                    <DetailRow label="Gender" value={user.gender} />
                    <DetailRow label="Phone Number" value={user.phonenumber} />

                    <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-6 border-b pb-3">
                        Employment Details
                    </h2>

                    <DetailRow label="Position" value={user.position} />
                    <DetailRow label="Department" value={user.department} />
                    <DetailRow label="Employment Date" value={formatDate(user.employdate)} />
                    <DetailRow label="Manager" value={user.managername} />
                    <DetailRow label="Is Active" value={user.isactive ? "Yes" : "No"} />

                    {user.terminationdate && user.terminationdate !== "N/A" && (
                        <DetailRow
                            label="Termination Date"
                            value={formatDate(user.terminationdate)}
                        />
                    )}

                    <DetailRow label="Attendance" value={user.attendanceRate} />
                    <DetailRow label="Base Salary" value={user.basesalary} />
                    <DetailRow label="Salary" value={user.salary} />
                </div>
            </main>
        </div>
    );
}
