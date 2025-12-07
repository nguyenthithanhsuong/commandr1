"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Button from "../components/button/button";

export default function ReportPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState({
    personnel: [],
    projects: [],
    tasks: [],
  });

  

  const [AssignerID, setAssignerID] = useState(null);

  const NavLink = ({ name, href }) => {
    const isActive = router.pathname === href;
    const baseClasses =
      "text-sm font-medium px-3 py-1 rounded-md transition duration-150 ease-in-out cursor-pointer";
    const activeClasses = "bg-white text-black shadow-md";
    const inactiveClasses =
      "text-gray-300 hover:bg-gray-800 hover:text-white";
    return (
      <span
        onClick={() => router.push(href)}
        className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
      >
        {name}
      </span>
    );
  };

  // Fetch all data
  const fetchReports = async () => {
    try {
      const response = await fetch("/db/dbroute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "getReportData", params: {} }),
      });
      const data = await response.json();
      if (response.ok && data.data) {
        setReportData(data.data);
      } else {
        console.error("Failed to fetch reports:", data.error);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check", { credentials: "include" });
        if (!response.ok) {
          router.replace("/signin");
          return;
        }
        const data = await response.json();
        setAssignerID(data.user);
      } catch (error) {
        router.replace("/signin");
      }
    };
    checkAuth();
    fetchReports();
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


  // Derived Data
  const { personnel, projects, tasks } = reportData;

  // 🧮 Organizational Overview
  const totalEmployees = personnel.length;
  const totalProjects = projects.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.TaskStatus === "Completed").length;
  const overallCompletionRate = totalTasks
    ? ((completedTasks / totalTasks) * 100).toFixed(2)
    : 0;

  // 🧾 Project Summary
  const projectSummary = useMemo(() => {
    return projects.map((project) => {
      const projectTasks = tasks.filter((t) => t.ProjectID === project.ProjectID);
      const assignedPersonnel = [
        ...new Set(projectTasks.map((t) => t.PersonnelID).filter(Boolean)),
      ];
      return {
        ...project,
        totalTasks: projectTasks.length,
        totalPersonnel: assignedPersonnel.length,
        completedTasks: projectTasks.filter((t) => t.TaskStatus === "Completed").length,
      };
    });
  }, [projects, tasks]);

  // 🧍 Employee Performance
  // 🧍 Employee Performance (with Attendance %)
const employeePerformance = useMemo(() => {
  return personnel.map((person) => {
    const empTasks = tasks.filter((t) => t.PersonnelID === person.UserID);
    const total = empTasks.length;
    const completed = empTasks.filter((t) => t.TaskStatus === "Completed").length;
    const completionRate = total ? ((completed / total) * 100).toFixed(2) : 0;

    const empAttendance = reportData.attendance.filter((a) => a.UserID === person.UserID);
    const totalDays = empAttendance.length;
    const attendedDays = empAttendance.filter(
      (a) => a.CheckInStatus === "Checked In" || a.CheckOutStatus === "Checked Out"
    ).length;
    const attendanceRate = totalDays ? ((attendedDays / totalDays) * 100).toFixed(2) : 0;

    return {
      ...person,
      total,
      completed,
      completionRate,
      attendanceRate,
    };
  });
}, [personnel, tasks, reportData.attendance]);


  if (isLoading) return <div className="p-4">Loading Reports...</div>;

  return (
    <div className="p-4">
      {/* Header Bar */}
      <header className="w-full h-12 bg-black flex justify-between items-center px-4 shadow-md">
        <span className="text-white text-xl font-bold tracking-wider">Commandr</span>
        <nav className="flex space-x-3 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <NavLink name="Personnel" href="/personnel" />
          <NavLink name="Attendance" href="/attendance" />
          <NavLink name="Request" href="/request" />
          <NavLink name="Task" href="/task" />
          <NavLink name="Project" href="/project" />
          <NavLink name="Department" href="/department" />
          <NavLink name="Report" href="/report" />
        </nav>
        <Button
          text="Sign Out"
          style="Filled"
          className="text-white bg-transparent border border-white hover:bg-white hover:text-black transition duration-200 ease-in-out p-1 px-3 text-sm font-medium"
          onClick={async () => {
            await fetch("/api/auth/signout", { method: "POST", credentials: "include" });
            router.replace("/signin");
          }}
        />
      </header>

      {/* Overview Section */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 my-6">
        <div className="bg-gray-900 text-white p-4 rounded-xl shadow-md text-center">
          <h3 className="text-sm uppercase text-gray-400">Active Employees</h3>
          <p className="text-2xl font-bold">{totalEmployees}</p>
        </div>
        <div className="bg-gray-900 text-white p-4 rounded-xl shadow-md text-center">
          <h3 className="text-sm uppercase text-gray-400">Total Projects</h3>
          <p className="text-2xl font-bold">{totalProjects}</p>
        </div>
        <div className="bg-gray-900 text-white p-4 rounded-xl shadow-md text-center">
          <h3 className="text-sm uppercase text-gray-400">Total Tasks</h3>
          <p className="text-2xl font-bold">{totalTasks}</p>
        </div>
        <div className="bg-gray-900 text-white p-4 rounded-xl shadow-md text-center">
          <h3 className="text-sm uppercase text-gray-400">Completion Rate</h3>
          <p className="text-2xl font-bold">{overallCompletionRate}%</p>
        </div>
      </section>

      {/* Project Summary */}
<section className="my-6">
  <h2 className="text-xl font-semibold mb-3 text-gray-800">📁 Project Summary</h2>
  <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
    <table className="min-w-full divide-y divide-gray-300">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tasks</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Completed</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Personnel</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {projectSummary.map((p) => (
          <tr
            key={p.ProjectID}
            onClick={() => router.push(`/project/viewproject?id=${p.ProjectID}`)}
            className="hover:bg-blue-50 cursor-pointer transition-colors duration-150"
          >
            <td className="px-6 py-4 text-sm font-medium text-gray-800">{p.ProjectName}</td>
            <td className="px-6 py-4 text-sm">{p.ProjectStatus}</td>
            <td className="px-6 py-4 text-sm text-center">{p.totalTasks}</td>
            <td className="px-6 py-4 text-sm text-center">{p.completedTasks}</td>
            <td className="px-6 py-4 text-sm text-center">{p.totalPersonnel}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>

{/* Employee Performance */}
<section className="my-6">
  <h2 className="text-xl font-semibold mb-3 text-gray-800">👨‍💼 Employee Performance</h2>
  <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
    <table className="min-w-full divide-y divide-gray-300">
      <thead className="bg-gray-100">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Tasks</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Completed</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Attendance Rate</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {employeePerformance.map((emp) => (
          <tr
            key={emp.UserID}
            onClick={() => router.push(`/personnel/viewpersonnel?id=${emp.UserID}`)}
            className="hover:bg-blue-50 cursor-pointer transition-colors duration-150"
          >
            <td className="px-6 py-4 text-sm font-medium text-gray-800">{emp.Name}</td>
            <td className="px-6 py-4 text-sm text-center">{emp.total}</td>
            <td className="px-6 py-4 text-sm text-center">{emp.completed}</td>
            <td className="px-6 py-4 text-sm text-center">{emp.completionRate}%</td>
            <td className="px-6 py-4 text-sm text-center">{emp.attendanceRate}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
</section>


    </div>
  );
}
