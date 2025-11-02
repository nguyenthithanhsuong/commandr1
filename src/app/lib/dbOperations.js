"use server";
import { db } from "./db.js";

// Authentication Operations
export async function authenticateUser(email, password) {
    try {
        const query=
        `Select * From Account
        JOIN personnel on Account.UserID = personnel.UserID
        WHERE email = ? AND Password = ? AND IsActive = 1`
        const [rows] = await db.execute(
            query,
            [email, password]
        );
        return { success: true, data: rows };
    } catch (error) {
        console.error("Authentication error:", error);
        return { success: false, error: "Authentication failed" };
    }
}

// Get Position
export async function getPositions() {
    try {
        const query = `
            SELECT 
                PositionID AS positionid,
                PositionName AS positionname,
                DepartmentID AS departmentid
            FROM 
                position
            ORDER BY 
                PositionID
        `;
        const [rows] = await db.execute(query);
        return { success: true, data: rows };
    } catch (error) {
        console.error("Get positions error:", error);
        return { success: false, error: "Failed to fetch positions" };
    }
}

// Load All Personnel
export async function getAllPersonnel() {
    try {
        const query = `
            SELECT
                P.UserID AS userid,
                P.Name AS name,
                Pos.PositionName AS position,
                Pos.PositionID AS positionid,
                P.Dateofbirth AS dateofbirth,
                P.Gender AS gender,
                P.EmployDate AS employdate,
                P.PhoneNumber AS phonenumber,
                P.ManagerID AS managerid,
                D.DepartmentName AS department,
                P.IsActive AS isactive,
                P.TerminationDate AS terminationdate,
                M.Name AS managername
            FROM
                personnel AS P 
            LEFT JOIN
                personnel AS M ON P.ManagerID = M.UserID
            JOIN
                position AS Pos ON P.PositionID = Pos.PositionID
            JOIN
                department AS D ON Pos.DepartmentID = D.DepartmentID
        `;
        const [rows] = await db.execute(query);
        return { success: true, data: rows };
    } catch (error) {
        console.error("Get personnel error:", error);
        return { success: false, error: "Failed to fetch personnel" };
    }
}

// Load One Personnel
export async function getPersonnelById(id) {
    try {
        const query = `
            SELECT
                P.UserID AS userid,
                P.Name AS name,
                Pos.PositionName AS position,
                P.Dateofbirth AS dateofbirth,
                P.Gender AS gender,
                P.EmployDate AS employdate,
                P.PhoneNumber AS phonenumber,
                P.ManagerID AS managerid,
                D.DepartmentName AS department,
                P.IsActive AS isactive,
                P.TerminationDate AS terminationdate,
                M.Name AS managername,
                account.Email AS email
            FROM
                personnel AS P 
            LEFT JOIN
                personnel AS M ON P.ManagerID = M.UserID
            JOIN
                position AS Pos ON P.PositionID = Pos.PositionID
            JOIN
                department AS D ON Pos.DepartmentID = D.DepartmentID
            JOIN
                account ON P.UserID = account.UserID
            WHERE
                P.UserID = ?
        `;
        const [rows] = await db.execute(query, [id]);
        if (rows.length === 0) {
            return { success: false, error: "Personnel not found" };
        }
        return { success: true, data: rows[0] };
    } catch (error) {
        console.error("Get personnel by ID error:", error);
        return { success: false, error: "Failed to fetch personnel" };
    }
}

// Add Personnel
export async function addPersonnel(id, data) {
    try
    {
        const managerId = id; 
    
        const query = `
        INSERT into personnel
        (Name, DateOfbirth, Gender, PhoneNumber, PositionID, EmployDate, IsActive, ManagerID)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `; 
        // 9 placeholders for 9 columns

        const [result] = await db.execute(query, [
            data.name,
            data.dateofbirth,
            data.gender,
            data.phonenumber,
            data.positionid,
            data.employdate,
            1, // Use the boolean isactive from formData, convert to 1/0
            managerId // Use the ID passed to the function
        ]);
        
        const newPersonnelId = result.insertId; 

        const query2 = `
        Insert into Account (UserID, AccessID, Email, Password, HRID)
        VALUES (?, ?, ?, ?, ?)
        `;
        
        await db.execute(query2, [
            newPersonnelId, // UserID = New Personnel ID
            '1', // AccessID - Assuming '1' is the correct default access level
            data.email,
            data.password,
            managerId, // HRID = Manager ID
        ]);

        return { success: true, data: result };
    } catch (error) {
        console.error("Add personnel error:", error);
        return { success: false, error: "Failed to add personnel" };
    }
}

//Update Personnel
export async function updatePersonnel(id, data) {
    try {
        // Start by updating the personnel table
        const personnelUpdateQuery = `
            UPDATE personnel SET 
                Name = ?, 
                Dateofbirth = ?, 
                Gender = ?, 
                PhoneNumber = ?, 
                PositionID = ?, 
                EmployDate = ?,
                IsActive = ?,
                TerminationDate = ?
            WHERE UserID = ?
        `;

        const [personnelResult] = await db.execute(personnelUpdateQuery, [
            data.name,
            data.dateofbirth,
            data.gender,
            data.phonenumber,
            data.positionid,
            data.employdate,
            data.isactive ? 1 : 0, // Convert boolean/value to 1 or 0
            data.terminationdate || null, // Allow null if no termination date
            id
        ]);
        
        if (data.email || data.password) {
            let accountUpdateParts = [];
            let accountUpdateValues = [];

            if (data.email) {
                accountUpdateParts.push("Email = ?");
                accountUpdateValues.push(data.email);
            }
            if (data.password) {
                accountUpdateParts.push("Password = ?");
                accountUpdateValues.push(data.password);
            }

            if (accountUpdateParts.length > 0) {
                const accountUpdateQuery = `
                    UPDATE Account SET 
                        ${accountUpdateParts.join(', ')}
                    WHERE UserID = ?
                `;
                accountUpdateValues.push(id);
                await db.execute(accountUpdateQuery, accountUpdateValues);
            }
        }

        return { success: true, rowsAffected: personnelResult.affectedRows };
    } catch (error) {
        console.error("Update personnel error:", error);
        return { success: false, error: "Failed to update personnel" };
    }
}

//Delete Personnel
export async function deletePersonnel(id) {
    try {
        const query = `DELETE FROM Account WHERE UserID = ?;`;
        const [accountResult] = await db.execute(
            query,
            [id]
        );
        if (accountResult.affectedRows === 0) {
             // Log but still return success if the record wasn't found (idempotent delete)
             console.warn(`Account with ID ${id} not found for deletion.`);
        }
        const query2 = `DELETE FROM Personnel WHERE UserID = ?;`;
        const [personnelResult] = await db.execute(
            query2,
            [id]
        );

        if (personnelResult.affectedRows === 0) {
             // Log but still return success if the record wasn't found (idempotent delete)
             console.warn(`Personnel with ID ${id} not found for deletion.`);
        }

        return { success: true, message: "Personnel and related account successfully deleted." };
    } catch (error) {
        console.error("Delete personnel error:", error);
        return { success: false, error: "Failed to delete personnel" };
    }
}

//Retire Personnel
export async function retirePersonnel(id)
{
    try
    {
        const personnelUpdateQuery = `
            UPDATE personnel SET 
                IsActive = ?,
                TerminationDate = ?
            WHERE UserID = ?
        `;
        
        const today = new Date().toISOString().slice(0, 10);

        const [personnelResult] = await db.execute(personnelUpdateQuery, [
            0, // Convert boolean/value to 1 or 0
            today, // Set termination date to today
            id
        ]);

        return { success: true, rowsAffected: personnelResult.affectedRows };

    } catch (error) {
        console.error("Update personnel error:", error);
        return { success: false, error: "Failed to update personnel" };
    }
}

//View Task
export async function getAllTask() {
    try {
        const query = `
            SELECT
                T.TaskID AS taskid,
                T.TaskName AS taskname,
                T.TaskStatus AS taskstatus,
                A.Name AS assignername,
                P.Name AS personnelname,
                T.CreationDate AS creationdate,
                Pro.ProjectName AS projectname,
                T.Description AS description
            FROM
                Task as T 
            LEFT JOIN
                personnel AS A ON T.AssignerID = A.UserID
            LEFT JOIN
                personnel AS P ON T.PersonnelID = P.UserID
            LEFT JOIN
                project as Pro on T.ProjectID = Pro.ProjectID
        `;
        const [rows] = await db.execute(query);
        return { success: true, data: rows };
    } catch (error) {
        console.error("Get task error:", error);
        return { success: false, error: "Failed to fetch tasks" };
    }
}

//View Task by ID
export async function getTaskById(id) {
    try {
        const query = `
            SELECT
                T.TaskID AS taskid,
                T.TaskName AS taskname,
                T.TaskStatus AS taskstatus,
                A.Name AS assignername,
                P.Name AS personnelname,
                T.CreationDate AS creationdate,
                Pro.ProjectName AS projectname,
                T.Description AS description
            FROM
                Task as T
            LEFT JOIN
                personnel AS A ON T.AssignerID = A.UserID
            LEFT JOIN
                personnel AS P ON T.PersonnelID = P.UserID
            LEFT JOIN
                project as Pro on T.ProjectID = Pro.ProjectID
            WHERE
                T.TaskID = ?
        `;
        const [rows] = await db.execute(query, [id]);
        if (rows.length === 0) {
            return { success: false, error: "Task not found" };
        }
        return { success: true, data: rows[0] };
    } catch (error) {
        console.error("Get task by ID error:", error);
        return { success: false, error: "Failed to fetch task" };
    }
}  
// Add Task
export async function addTask(data) {
    try {
        const query = `
        INSERT into Task
        (TaskName, TaskStatus, AssignerID, PersonnelID, ProjectID, Description)
        VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [
            data.taskname,
            data.taskstatus,
            data.assignerid,
            data.personnelid,
            data.projectid,
            data.description
        ]);
        return { success: true, data: result };
    }
    catch (error) {
        console.error("Add task error:", error);
        return { success: false, error: "Failed to add task" };
    }
}

//Update Task
export async function updateTask(id, data) {
    try {
        const taskUpdateQuery = `
            UPDATE Task SET
                TaskName = ?,
                TaskStatus = ?,
                PersonnelID = ?,
                ProjectID = ?,
                Description = ?
            WHERE TaskID = ?
            `
        const [taskResult] = await db.execute(taskUpdateQuery, [
            data.taskname,
            data.taskstatus,
            data.personnelid,
            data.projectid,
            data.description,
            id
        ]);
        return { success: true, rowsAffected: taskResult.affectedRows };
    } catch (error) {
        console.error("Update task error:", error);
        return { success: false, error: "Failed to update task" };
    }
}
        
//Delete Task
export async function deleteTask(id) {
    try {   
        const query = `DELETE FROM Task WHERE TaskID = ?;`;
        const [taskResult] = await db.execute(
            query,
            [id]
        );
        if (taskResult.affectedRows === 0) {
                // Log but still return success if the record wasn't found (idempotent delete)
                console.warn(`Task with ID ${id} not found for deletion.`);
        }
        return { success: true, message: "Task successfully deleted." };
    } catch (error) {
        console.error("Delete task error:", error);
        return { success: false, error: "Failed to delete task" };
    }
}

//View Project
export async function getAllProject() {
    try {
        const query = `
            SELECT
                P.ProjectID AS projectid,
                P.ProjectName AS projectname,
                P.ProjectStatus AS projectstatus,
                P.CreationDate AS creationdate,
                P.Description AS description,
                A.Name AS assignername
            FROM
                Project as P
            LEFT JOIN
                personnel AS A ON P.AssignerID = A.UserID
        `;
        const [rows] = await db.execute(query);
        return { success: true, data: rows };
    } catch (error) {
        console.error("Get task error:", error);
        return { success: false, error: "Failed to fetch tasks" };
    }
}

 