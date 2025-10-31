"use server";
import { db } from "./db.js";

// Authentication Operations
export async function authenticateUser(email, password) {
    try {
        const [rows] = await db.execute(
            "SELECT * FROM Account WHERE email = ? AND password = ?",
            [email, password]
        );
        return { success: true, data: rows };
    } catch (error) {
        console.error("Authentication error:", error);
        return { success: false, error: "Authentication failed" };
    }
}

// Load All Personnel
export async function getAllPersonnel() {
    try {
        const query = `
            SELECT
                P.UserID AS userid,
                P.Name AS name,
                P.Position AS position,
                P.Dateofbirth AS dateofbirth,
                P.Gender AS gender,
                P.EmployDate AS employdate,
                P.PhoneNumber AS phonenumber,
                P.ManagerID AS managerid,
                P.Department AS department,
                P.IsActive AS isactive,
                P.TerminationDate AS terminationdate,
                M.Name AS managername
            FROM
                personnel AS P 
            LEFT JOIN
                personnel AS M ON P.ManagerID = M.UserID
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
                P.Position AS position,
                P.Dateofbirth AS dateofbirth,
                P.Gender AS gender,
                P.EmployDate AS employdate,
                P.PhoneNumber AS phonenumber,
                P.ManagerID AS managerid,
                P.Department AS department,
                P.IsActive AS isactive,
                P.TerminationDate AS terminationdate,
                M.Name AS managername
            FROM
                personnel AS P
            LEFT JOIN
                personnel AS M ON P.UserID = M.UserID
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
        (Name, DateOfbirth, Gender, PhoneNumber, Position, Department, EmployDate, IsActive, ManagerID)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `; 
        // 9 placeholders for 9 columns

        const [result] = await db.execute(query, [
            data.name,
            data.dateofbirth,
            data.gender,
            data.phonenumber,
            data.position,
            data.department,
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

