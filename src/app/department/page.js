"use client"

import React, { useEffect, useState, useMemo, useCallback } from "react"; 
import { useRouter } from "next/navigation";
import Button from "../components/button/button";


export default function DepartmentPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [positions, setPositions] = useState([]); 
    const [searchTerm, setSearchTerm] = useState('');
    const [openDepartments, setOpenDepartments] = useState({});
    const [AssignerID, setAssignerID] = useState([]);

    // State for Add Department
    const [showAddDepartmentInput, setShowAddDepartmentInput] = useState(false);
    const [newDepartmentName, setNewDepartmentName] = useState('');

    // State for Add Position
    const [showAddPositionInput, setShowAddPositionInput] = useState(false);
    const [newPositionName, setNewPositionName] = useState('');
    const [newPositionSalary, setNewPositionSalary] = useState('');
    const [DepartmentList, setDepartmentList] = useState([]); 
    const [selectedDepartment, setSelectedDepartment] = useState(''); 

    // ⭐ 1. NEW STATE FOR EDITING
    const [editingPositionId, setEditingPositionId] = useState(null);
    const [editPositionName, setEditPositionName] = useState('');
    const [editPositionSalary, setEditPositionSalary] = useState('');
    const [editDepartmentId, setEditDepartmentId] = useState('');
    const [editingDepartmentId, setEditingDepartmentId] = useState(null);
    const [editDepartmentName, setEditDepartmentName] = useState('');

    // --- UPDATED TOGGLE FUNCTION FOR TRUE ACCORDION BEHAVIOR ---
    const toggleDepartment = (departmentName) => {
        // Auto-close any open position edit mode
        setEditingPositionId(null); 
        
        setOpenDepartments(prev => {
            const isCurrentlyOpen = prev[departmentName];
            
            // If the clicked department is already open, close it.
            if (isCurrentlyOpen) {
                return { [departmentName]: false };
            }
            
            // If the clicked department is closed, open it and close all others.
            return { [departmentName]: true };
        });
    };
    // -----------------------------------------------------------------

    // NavLink component (omitted for brevity)
    const NavLink = ({ name, href }) => {
        const isActive = router.pathname === href || (name === 'Department' && router.pathname === '/department');
        const baseClasses = "text-sm font-medium px-3 py-1 rounded-md transition duration-150 ease-in-out cursor-pointer";
        const activeClasses = "bg-white text-black shadow-md";
        const inactiveClasses = "text-gray-300 hover:bg-gray-800 hover:text-white";
        return (
            <span
                onClick={() => router.push(href)}
                className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
            >
                {name}
            </span>
        );
    };

    const fetchDepartment = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/db/dbroute', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    operation: 'getPosition', 
                    params: { } 
                }),
            });
            const data = await response.json();
            console.log('Fetched positions:', data);
            if (response.ok) {
                setPositions(data.data); 
            } else {
                console.error('Failed to fetch positions:', data.error);
                setPositions([]);
            }
        } catch (error) {
            console.error('Error fetching positions:', error);
            setPositions([]);
        }
        setIsLoading(false);
    }, []);

    const fetchDepartmentList = useCallback(async () => {
    const response = await fetch('/db/dbroute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation: 'getDepartments' })
    });
    const result = await response.json();
    if (result.success) {
        setDepartmentList(result.data); // Store in state
    } else {
        console.error('Failed to fetch department list:', result.error);
        setDepartmentList([]);
    }
}, []);
    
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const response = await fetch('/api/auth/check', { credentials: 'include' });
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
        
                fetchDepartment();
                fetchDepartmentList();
    }, [router, fetchDepartment, fetchDepartmentList]); 

    // Group and Filter Logic 
    const groupedDepartments = useMemo(() => {
        let currentPositions = positions;

        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            currentPositions = currentPositions.filter(pos =>
                pos.positionname.toLowerCase().includes(lowerCaseSearch) ||
                pos.departmentname.toLowerCase().includes(lowerCaseSearch)
            );
        }

        const departmentsMap = new Map();
        currentPositions.forEach(pos => {
            const deptName = pos.departmentname || 'Unassigned';
            const deptId = pos.departmentid !== undefined && pos.departmentid !== null ? pos.departmentid : null; 
            
            if (!departmentsMap.has(deptName)) {
                departmentsMap.set(deptName, {
                    departmentname: deptName,
                    // Only assign deptId if it's not 'Unassigned'
                    departmentid: deptName !== 'Unassigned' ? deptId : null, 
                    positions: []
                });
            }
            departmentsMap.get(deptName).positions.push(pos);
        });

        return Array.from(departmentsMap.values());
    }, [positions, searchTerm]);

    // --- API Handlers (Create) ---

    // Function to handle adding the new department
    const handleAddDepartment = async () => {
        if (!newDepartmentName.trim()) {
            alert("Department name cannot be empty.");
            return;
        }

        try {
            const response = await fetch('/db/dbroute', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'addDepartment', 
                    params: { 
                        data:{
                        departmentname: newDepartmentName.trim()
                        }
                    } 
                }),
            });
            const data = await response.json();

            if (response.ok && data.success) {
                alert(`Department "${newDepartmentName}" added successfully!`);
                setNewDepartmentName('');
                setShowAddDepartmentInput(false);
                await fetchDepartment(); 
                await fetchDepartmentList(); 
            } else {
                console.error('Failed to add department:', data.error);
                alert(`Failed to add department: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error adding department:', error);
            alert('Error connecting to the server to add department.');
        } 
    };

    // Function to handle adding the new position
    const handleAddPosition = async () => {
        if (!newPositionName.trim() || !selectedDepartment || isNaN(Number(newPositionSalary))) {
            alert("Please provide a valid Position Name, Department, and Salary.");
            return;
        }
        
        const selectedDept = DepartmentList.find(d => d.departmentid.toString() === selectedDepartment.toString());
        
        if (!selectedDept) {
            alert("Invalid department selected.");
            return;
        }

        try {
            const response = await fetch('/db/dbroute', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'addPosition', 
                    params: { 
                        data:
                        {
                        positionname: newPositionName.trim(),
                        salary: Number(newPositionSalary), 
                        departmentid: selectedDept.departmentid 
                        }
                    } 
                }),
            });
            const data = await response.json();

            if (response.ok && data.success) {
                alert(`Position "${newPositionName}" added to ${selectedDept.departmentname} successfully!`);
                setNewPositionName('');
                setNewPositionSalary('');
                setSelectedDepartment('');
                setShowAddPositionInput(false); 
                await fetchDepartment(); 
            } else {
                console.error('Failed to add position:', data.error);
                alert(`Failed to add position: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error adding position:', error);
            alert('Error connecting to the server to add position.');
        } 
    };

    // --- API Handlers (Update/Delete) ---

    // ⭐ 2. UPDATE HANDLER
    const handleUpdatePosition = async (positionId) => {
        if (editPositionName==null || editPositionName==='' || editDepartmentId==null || editDepartmentId==='' || isNaN(Number(editPositionSalary))) {
            alert("Please provide valid data for update.");
            return;
        }
        try {
            const response = await fetch('/db/dbroute', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'updatePosition', // Define this in your dbroute
                    params: { 
                        id: positionId,
                        data: {
                            positionname: editPositionName,
                            salary: Number(editPositionSalary),
                            departmentid: editDepartmentId 
                        }
                    } 
                }),
            });
            const data = await response.json();

            if (response.ok && data.success) {
                alert(`Position updated successfully!`);
                setEditingPositionId(null); // Exit edit mode
                await fetchDepartment(); // Refresh data
            } else {
                console.error('Failed to update position:', data.error);
                alert(`Failed to update position: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating position:', error);
            alert('Error connecting to the server to update position.');
        } 
    };

    const handleUpdateDepartment = async (departmentId) => {
    if (!editDepartmentName.trim()) {
        alert("Department name cannot be empty.");
        return;
    }

    try {
        const response = await fetch('/db/dbroute', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                operation: 'updateDepartment',
                params: { 
                    id: departmentId,
                    data: { departmentname: editDepartmentName.trim() }
                }
            }),
        });
        const data = await response.json();

        if (response.ok && data.success) {
            alert(`Department updated successfully!`);
            setEditingDepartmentId(null);
            await fetchDepartment();
            await fetchDepartmentList();
        } else {
            console.error('Failed to update department:', data.error);
            alert(`Failed to update department: ${data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error updating department:', error);
        alert('Error connecting to the server to update department.');
    }
};

    // ⭐ 3. DELETE POSITION HANDLER
    const handleDeletePosition = async (positionId, positionName) => {
        if (!window.confirm(`Are you sure you want to delete the position: "${positionName}"?`)) {
            return;
        }

        try {
            const response = await fetch('/db/dbroute', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'deletePosition', // Define this in your dbroute
                    params: { id: positionId } 
                }),
            });
            const data = await response.json();

            if (response.ok && data.success) {
                alert(`Position "${positionName}" deleted successfully!`);
                await fetchDepartment(); // Refresh data
            } else {
                console.error('Failed to delete position:', data.error);
                alert(`Failed to delete position: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting position:', error);
            alert('Error connecting to the server to delete position.');
        }
    };
    
    // ⭐ 4. DELETE DEPARTMENT HANDLER
    const handleDeleteDepartment = async (departmentId, departmentName) => {
        if(departmentId=='0'||departmentId==null)
        {
            alert("Cannot delete Unassigned!");
            return;
        }
        if (!window.confirm(`WARNING: Deleting department "${departmentName}" will unassign all its positions. Are you sure you want to proceed?`)) {
            return;
        }
        try {
            const response = await fetch('/db/dbroute', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    operation: 'deleteDepartment', // Define this in your dbroute
                    params: { id: departmentId } 
                }),
            });
            const data = await response.json();

            if (response.ok && data.success) {
                alert(`Department "${departmentName}" deleted successfully!`);
                await fetchDepartment(); // Refresh positions
                await fetchDepartmentList(); // Refresh department list
            } else {
                console.error('Failed to delete department:', data.error);
                alert(`Failed to delete department: ${data.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting department:', error);
            alert('Error connecting to the server to delete department.');
        }
    };


    if (isLoading) {
        return <div className="p-4 text-lg font-semibold text-blue-600">Loading positions data...</div>;
    }

    

    // --- RENDER START ---
    return (
        <div className="p-4">
            {/* Header Bar (omitted for brevity) */}
            <header className="w-full h-12 bg-black flex justify-between items-center px-4 shadow-md">
                <span className="text-white text-xl font-bold tracking-wider mr-6">Commandr</span>
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
                    className="ml-4 text-white bg-transparent border border-white hover:bg-white hover:text-black transition duration-200 ease-in-out p-1 px-3 text-sm font-medium flex-shrink-0" 
                    onClick={async () => {
                        await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' });
                        router.replace('/signin');
                    }}
                />
            </header>
            
            {/* Search Bar (omitted for brevity) */}
            <div className="flex flex-col items-center mt-4 mb-6">
                <input
                    type="search"
                    placeholder="Search by Position or Department Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-grow w-full md:max-w-md p-2 px-4 text-base text-gray-900 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
            </div>

            {/* Action buttons section (omitted for brevity) */}
            <div className="flex justify-between items-center my-4">
                <h1 className="text-2xl font-bold">
                    {"Positions & Departments List 📊"}
                </h1>
                <div className="flex space-x-3">
                    <Button
                        text="Add Position"
                        style="Filled" 
                        className="text-white bg-blue-600 border border-blue-600 hover:bg-blue-700 p-2 text-sm rounded-md shadow-md transition duration-150" 
                        onClick={() => {
                            setShowAddPositionInput(prev => !prev);
                            setShowAddDepartmentInput(false); 
                            setNewPositionName('');
                            setNewPositionSalary('');
                            setSelectedDepartment('');
                            setEditingPositionId(null); // Exit edit mode
                        }}
                    />
                    <Button
                        text="Add Department"
                        style="Filled" 
                        className="text-white bg-blue-600 border border-blue-600 hover:bg-blue-700 p-2 text-sm rounded-md shadow-md transition duration-150" 
                        onClick={() => {
                            setShowAddDepartmentInput(prev => !prev);
                            setShowAddPositionInput(false); 
                            setNewDepartmentName('');
                            setEditingPositionId(null); // Exit edit mode
                        }}
                    />
                </div>
            </div>
            
            {/* ADD POSITION INPUT FIELD (omitted for brevity) */}
            {showAddPositionInput && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4 p-4 border border-green-300 bg-green-50 rounded-lg shadow-inner transition duration-300">
                    <input
                        type="text"
                        placeholder="Position Name (e.g., Senior Developer)"
                        value={newPositionName}
                        onChange={(e) => setNewPositionName(e.target.value)}
                        className="p-2 text-base rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <input
                        type="number"
                        placeholder="Base Salary (e.g., 60000)"
                        value={newPositionSalary}
                        onChange={(e) => setNewPositionSalary(e.target.value)}
                        className="p-2 text-base rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="p-2 text-base rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                        <option value="" disabled>Select Department</option>
                        {Array.isArray(DepartmentList) && DepartmentList.map(dept => (
                            <option key={dept.departmentid} value={dept.departmentid}>
                                {dept.departmentname}
                            </option>
                        ))}
                    </select>
                    
                    {/* Action buttons for Position */}
                    <div className="flex gap-2">
                        <Button
                            text="Save Position"
                            style="Filled" 
                            className="text-white bg-green-600 border border-green-600 hover:bg-green-700 p-2 text-sm rounded-md shadow-md transition duration-150 flex-grow" 
                            onClick={handleAddPosition}
                        />
                        <Button
                            text="Cancel"
                            style="Outline" 
                            className="text-gray-700 border border-gray-400 hover:bg-gray-200 p-2 text-sm rounded-md shadow-md transition duration-150 flex-shrink-0" 
                            onClick={() => setShowAddPositionInput(false)}
                        />
                    </div>
                </div>
            )}

            {/* ADD DEPARTMENT INPUT FIELD (omitted for brevity) */}
            {showAddDepartmentInput && (
                <div className="flex gap-3 mb-4 p-3 border border-blue-300 bg-blue-50 rounded-lg shadow-inner transition duration-300">
                    <input
                        type="text"
                        placeholder="Enter new department name (e.g., Marketing, HR, Engineering)"
                        value={newDepartmentName}
                        onChange={(e) => setNewDepartmentName(e.target.value)}
                        className="flex-grow p-2 text-base rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleAddDepartment();
                            }
                        }}
                    />
                    <Button
                        text="Save Department"
                        style="Filled" 
                        className="text-white bg-blue-600 border border-blue-600 hover:bg-blue-700 p-2 text-sm rounded-md shadow-md transition duration-150 flex-shrink-0" 
                        onClick={handleAddDepartment}
                    />
                    <Button
                        text="Cancel"
                        style="Outline" 
                        className="text-gray-700 border border-gray-400 hover:bg-gray-200 p-2 text-sm rounded-md shadow-md transition duration-150 flex-shrink-0" 
                        onClick={() => {
                            setShowAddDepartmentInput(false);
                            setNewDepartmentName('');
                        }}
                    />
                </div>
            )}

            {/* Table Container - Accordion Wrapper */}
            <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/2">Total Positions / Position Name / Base Salary</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
  {groupedDepartments.map((dept) => {
  const isOpen = openDepartments[dept.departmentname];
  const isEditingDept = editingDepartmentId !== null && dept.departmentid !== null && editingDepartmentId === dept.departmentid;



  return (
    <React.Fragment key={dept.departmentid || dept.departmentname}>
      {/* DEPARTMENT HEADER ROW */}
      <tr
        onClick={() => toggleDepartment(dept.departmentname)}
        className="cursor-pointer bg-gray-50 hover:bg-gray-100 font-semibold border-b border-gray-300 transition duration-150"
      >
        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
          {dept.departmentname}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
          {dept.positions.length} Positions
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
          <span
            className={`inline-block transition-transform duration-200 ${
              isOpen ? "rotate-90" : ""
            } text-gray-500`}
          >
            &#9654;
          </span>
          <Button
            text="Edit"
            style="Filled"
            className="bg-yellow-500 hover:bg-yellow-600 text-white p-1 px-3 text-xs rounded-md shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              setEditingDepartmentId(dept.departmentid);
              setEditDepartmentName(dept.departmentname);
              setShowAddDepartmentInput(false);
              setShowAddPositionInput(false);
              setEditingPositionId(null);
            }}
          />
          <Button
            text="Delete"
            style="Filled"
            className="bg-red-500 hover:bg-red-600 text-white p-1 px-3 text-xs rounded-md shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteDepartment(dept.departmentid, dept.departmentname);
            }}
          />
        </td>
      </tr>

      {/* ✅ INLINE EDIT ROW — placed directly after department */}
      {isEditingDept && (
        <tr className="bg-yellow-50 border-b border-dashed border-yellow-300">
          <td colSpan="3" className="p-3">
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={editDepartmentName}
                onChange={(e) => setEditDepartmentName(e.target.value)}
                className="p-2 text-sm rounded-md border border-gray-300 flex-grow"
              />
              <Button
                text="Save"
                style="Filled"
                className="bg-green-500 hover:bg-green-600 text-white p-1 px-3 text-xs rounded-md shadow-sm flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUpdateDepartment(dept.departmentid);
                }}
              />
              <Button
                text="Cancel"
                style="Outline"
                className="text-gray-700 border border-gray-400 hover:bg-gray-200 p-1 px-3 text-xs rounded-md shadow-sm flex-shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingDepartmentId(null);
                }}
              />
            </div>
          </td>
        </tr>
      )}

      {/* POSITIONS */}
      {isOpen &&
        dept.positions.map((pos) => {
          const isEditing = editingPositionId === pos.positionid;
          return (
            <React.Fragment key={pos.positionid}>
              <tr className="bg-white hover:bg-blue-50 border-b border-dashed border-gray-200">
                <td className="px-6 py-2"></td>
                <td className="px-6 py-2 text-sm text-gray-600 font-medium space-x-4">
                  <span>{pos.positionname}</span>
                  <span className="text-xs text-gray-500 border-l pl-4 ml-4">
                    {pos.salary
                      ? `$${Number(pos.salary).toLocaleString()}`
                      : "N/A"}
                  </span>
                </td>
                <td className="px-6 py-2 text-sm text-gray-600 space-x-2">
                  <Button
                    text="Edit"
                    style="Filled"
                    className="bg-yellow-500 hover:bg-yellow-600 text-white p-1 px-3 text-xs rounded-md shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingPositionId(pos.positionid);
                      setEditPositionName(pos.positionname);
                      setEditPositionSalary(pos.salary);
                      setEditDepartmentId(pos.departmentid);
                      setShowAddPositionInput(false);
                    }}
                  />
                  <Button
                    text="Delete"
                    style="Filled"
                    className="bg-red-500 hover:bg-red-600 text-white p-1 px-3 text-xs rounded-md shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePosition(pos.positionid, pos.positionname);
                    }}
                  />
                </td>
              </tr>

              {/* Position Inline Edit */}
              {isEditing && (
                <tr className="bg-yellow-50 border-b border-dashed border-yellow-300">
                  <td className="p-2" colSpan="1"></td>
                  <td className="p-2" colSpan="2">
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={editPositionName}
                        onChange={(e) =>
                          setEditPositionName(e.target.value)
                        }
                        className="p-1 text-sm rounded-md border border-gray-300 w-1/3"
                      />
                      <input
                        type="number"
                        value={editPositionSalary}
                        onChange={(e) =>
                          setEditPositionSalary(e.target.value)
                        }
                        className="p-1 text-sm rounded-md border border-gray-300 w-1/4"
                      />
                      <select
                        value={editDepartmentId}
                        onChange={(e) =>
                          setEditDepartmentId(e.target.value)
                        }
                        className="p-1 text-sm rounded-md border border-gray-300 bg-white w-1/4"
                      >
                        {DepartmentList.map((deptOption) => (
                          <option
                            key={deptOption.departmentid}
                            value={deptOption.departmentid}
                          >
                            {deptOption.departmentname}
                          </option>
                        ))}
                      </select>
                      <Button
                        text="Save"
                        style="Filled"
                        className="bg-green-500 hover:bg-green-600 text-white p-1 px-3 text-xs rounded-md shadow-sm flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdatePosition(pos.positionid);
                        }}
                      />
                      <Button
                        text="Cancel"
                        style="Outline"
                        className="text-gray-700 border border-gray-400 hover:bg-gray-200 p-1 px-3 text-xs rounded-md shadow-sm flex-shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPositionId(null);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          );
        })}
    </React.Fragment>
  );
})}

</tbody>

                </table>
            </div>
            
            {/* Display message if no results found after filtering (omitted for brevity) */}
            {groupedDepartments.length === 0 && !isLoading && (
                <p className="text-center text-gray-500 mt-8">
                    {searchTerm 
                        ? `No department or position found matching "${searchTerm}".` 
                        : "No department or position records found."}
                </p>
            )}
        </div>
    )
}