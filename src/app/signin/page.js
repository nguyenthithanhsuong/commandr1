"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/button/button";


export default function SignInPage() {
    const router = useRouter();
    
    //process:
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState(""); 
    const [error, setError] = useState("");
    let ID = 0;
    const generateAttendance = async () => {
    try {
      const response = await fetch("/db/dbroute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "createAttendance", params: {} }),
      });
      const data = await response.json();
      console.log("Attendance auto-generated:", data);
    } catch (error) {
      console.error("Error generating attendance:", error);
    }
  };

  useEffect(() => {
    generateAttendance();   // 👈 runs when page loads
  }, []);
    //button click handle
    const handleSubmit = async (e) => {
        console.log("Submitting sign-in form with:", { email, password });
        e.preventDefault();
        setError("");
        
        try {
            //fetch to api/db to authenticate
            const loginResponse = await fetch('/db/dbroute', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'authenticate',
                    params: {
                        email,
                        password
                    }
                }),
            });

            const result = await loginResponse.json();
            if (!loginResponse.ok) {
                throw new Error(result.error || 'Sign in failed');
            }
            if (result.data.length === 0) {
                alert("Invalid email or password.");
                return;
            }
            
            console.log('ID: ' + result.data.UserID);

            const authorizationResponse = await fetch('/db/dbroute', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'authorization',
                    params: {
                        id: result.data.UserID
                    }
                }),
            });

            const result2 = await authorizationResponse.json();

            console.log('data: '+ result2.data.ispersonnel);

            if (!authorizationResponse.ok) {
                throw new Error(result2.error || 'Divergence failed');
            }
            
            if(result2.data.ispersonnel=='1')
            {
                router.push('/personal');
            }
            else if (result2.data.ispersonnel=='0')
            {
                router.push('/personnel');
            }
            else
            {
                alert("Authorization Failed!");
            }
            
        } catch (error) {
            console.error("Sign-in error:", error);
            alert("Unexpected error, try again later!");
        }
    }
    //ui:

    return (
        <div
        //takes up view pỏt
            className="min-h-screen flex items-center justify-center"
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(to bottom, #ffffff 0%, #f5f5f5 100%)',
            }}
        >
            <div className="w-full max-w-md bg-white/60 backdrop-blur-md rounded-lg p-8 shadow-md">
                <h2 className="text-2xl font-semibold mb-4 text-center">Sign into Commandr</h2>
                <form 
                    className="flex flex-col gap-4" 
                    onSubmit={handleSubmit}
                    onClick={(e) => console.log('Form clicked:', e.target)}
                >
                    <label className="flex flex-col text-sm">
                        <span className="mb-1 font-medium">Email:</span>
                        <input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            name="email"
                            type="email"
                            required
                            className="w-full rounded border px-3 py-2"
                        />
                    </label>
                    <label className="flex flex-col text-sm">
                        <span className="mb-1 font-medium">Password:</span>
                        <input
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            name="password"
                            type="password"
                            required
                            className="w-full rounded border px-3 py-2"
                        />
                    </label>
                    <div className="pt-2">
                        <div style={{ display: 'flex', gap: '10%' }}>
                            <Button
                                text="Sign In"
                                style="Filled"
                                width="100%"
                                type="submit"
                                onClick={(e) => {
                                    console.log('Button clicked');
                                    handleSubmit(e);
                                }}
                            />
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}