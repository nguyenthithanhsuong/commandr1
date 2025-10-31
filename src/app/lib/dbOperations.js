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
                personnel AS M ON P.UserID = M.UserID
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
export async function addPersonnel(data) {}





export async function updatePersonnel(id, data) {
    try {
        const { email, name, role } = data;
        const [result] = await db.execute(
            "UPDATE Account SET email = ?, name = ?, role = ? WHERE id = ?",
            [email, name, role, id]
        );
        return { success: true, data: result };
    } catch (error) {
        console.error("Update personnel error:", error);
        return { success: false, error: "Failed to update personnel" };
    }
}

// Add more database operations as needed
export async function createPersonnel(data) {
    try {
        const { email, password, name, role } = data;
        const [result] = await db.execute(
            "INSERT INTO Account (email, password, name, role) VALUES (?, ?, ?, ?)",
            [email, password, name, role]
        );
        return { success: true, data: result };
    } catch (error) {
        console.error("Create personnel error:", error);
        return { success: false, error: "Failed to create personnel" };
    }
}

export async function deletePersonnel(id) {
    try {
        const [result] = await db.execute(
            "DELETE FROM Account WHERE id = ?",
            [id]
        );
        return { success: true, data: result };
    } catch (error) {
        console.error("Delete personnel error:", error);
        return { success: false, error: "Failed to delete personnel" };
    }
}