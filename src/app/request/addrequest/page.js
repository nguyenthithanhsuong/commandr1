"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Button from "../../components/button/button";

export default function AddRequestPage() {
  const router = useRouter();

  // Form data state
  const [formData, setFormData] = useState({
    requesttype: "",
    description: "",
  });

  // Auth and assigner/requester ID
  const [assignerId, setAssignerId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  // 🔐 Check authentication and get assigner/requester ID
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("../api/auth/check", { credentials: "include" });
        if (!response.ok) {
          router.replace("/signin");
          return;
        }
        const data = await response.json();
        setAssignerId(data.user);
        setIsLoading(false);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.replace("/signin");
      }
    };
    checkAuth();
  }, [router]);

  // Input fields
  const fields = [
    {
  label: "Request Type",
  name: "requesttype",
  type: "select",
  options: [
    "Vacation Leave",
    "Sick Leave",
    "Personal Leave",
    "Work From Home Request",
    "Overtime Request",
    "Late Arrival Notice",
    "Early Check-Out Request",
    "Shift Change Request",
    "Equipment Request",
    "Expense Reimbursement",
    "Training Request",
    "Schedule Adjustment",
    "Project Support Request",
    "Day Off Request",
    "Other",
  ],
  required: true,
},
{ label: "Description", name: "description", type: "textarea", required: true },
  ];

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value.toString(),
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    if (!formData.requesttype || !formData.description) {
      setMessage("Please fill in all required fields and ensure you are logged in.");
      setIsSubmitting(false);
      return;
    }
    try {
      const response = await fetch("/db/dbroute", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "createRequest", // must match your backend
          params: {
            data: {
            requesterid: assignerId, 
            requesttype: formData.requesttype,
            description: formData.description,
            status: "Pending",
            creationdate: new Date().toISOString().slice(0, 10)
            }
          },
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage(`✅ Success! New request '${formData.requesttype}' created.`);
        setTimeout(() => router.replace("/request"), 1500);
      } else {
        setMessage(`❌ Error: Failed to add request. ${data.error || "Unknown error."}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      setMessage("An unexpected error occurred during submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER LOGIC ---

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-xl font-semibold text-gray-600">Checking authentication... 🔐</p>
      </div>
    );
  }

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
          text="Return To Request List"
          style="Filled"
          className="text-white bg-transparent border border-white hover:bg-white hover:text-black p-1 text-sm"
          onClick={() => router.replace("/request")}
        />
      </div>

      {/* Main Content */}
      <div className="flex-grow p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white p-6 md:p-10 rounded-xl shadow-2xl">
          <h1 className="text-3xl font-extrabold text-gray-800 mb-6 border-b pb-2">
            Submit New Request 📨
          </h1>

          {/* Status Message */}
          {message && (
            <div
              className={`p-4 mb-4 rounded-lg font-medium ${
                message.includes("Success")
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
              role="alert"
            >
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map((field) => (
                <div
                  key={field.name}
                  className={field.type === "textarea" ? "md:col-span-2" : ""}
                >
                  <label
                    htmlFor={field.name}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    {field.label}{" "}
                    {field.required && <span className="text-red-500">*</span>}
                  </label>

                  {field.type === "select" ? (
  <select
    id={field.name}
    name={field.name}
    value={formData[field.name]}
    onChange={handleChange}
    required={field.required}
    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
  >
    <option value="">Select a request type...</option>
    {field.options.map((option) => (
      <option key={option} value={option}>{option}</option>
    ))}
  </select>
) : field.type === "textarea" ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      value={formData[field.name]}
                      onChange={handleChange}
                      required={field.required}
                      className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
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
                text={isSubmitting ? "Submitting Request..." : "Submit Request"}
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
