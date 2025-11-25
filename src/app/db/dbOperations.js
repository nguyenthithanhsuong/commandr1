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
        return { success: true, data: rows[0]};
    } catch (error) {
        console.error("Authentication error:", error);
        return { success: false, error: "Authentication failed" };
    }
}

export async function authorization(id)
{
    try
    {
        const query = `
        Select
            P.UserID AS userid,
            A.AccessID AS accessid,
            A.Is_Personnel AS ispersonnel,
            A.Is_Admin AS isadmin,
            A.Personnel_Permission AS personnelpermission,
            A.Work_Permission AS workpermission,
            A.Attendance_Permission AS attendancepermission,
            A.Report_Permission AS reportpermission

            FROM

            Personnel AS P
            JOIN Position AS POS ON P.PositionId = Pos.PositionID
            JOIN Authorization AS A ON Pos.AccessID = A.AccessID

            WHERE P.UserID = ?`
        const [rows] = await db.execute
            (
                query,
                [id],
            );
            console.log('Authorization check for ' + [id] + ' successful!');
            console.log(rows[0]);
            return {success: true, data: rows[0]};
    }
    catch (error)
    {
        console.error("Authorization check failed!");
        return  { success: false, error: "Authorization check failed"};
    }
}
// Get AccessID
export async function getAccess(id)
{
    try
    {
        const query = `select
                    AccessID
                    From personnel
                    join position on personnel.positionid = position.positionid
                    where userid = ?`
        const [rows] = await db.execute(query, [id]);
        return {success:true, accessid: rows[0].AccessID}
    }
    catch (error)
    {
        return { success: false, error: "Access check failed"};
    }
}
// Get Position
export async function getPositions(data) {
    try {
        let query;
        console.log('data = ' + data);
        if(data=='1')
        {
        query = `
            SELECT
                P.PositionID AS positionid,
                P.PositionName AS positionname,
                D.DepartmentName AS departmentname,
                P.BaseSalary AS salary,
                D.DepartmentId AS departmentid
            FROM
                Position as P
            LEFT JOIN
                Department as D ON P.DepartmentID = D.DepartmentID
        `;
        }
        else
        {
            query = `
            SELECT
                P.PositionID AS positionid,
                P.PositionName AS positionname,
                D.DepartmentName AS departmentname,
                P.BaseSalary AS salary,
                D.DepartmentId AS departmentid
            FROM
                Position as P
            LEFT JOIN
                Department as D ON P.DepartmentID = D.DepartmentID
			WHERE AccessID = '4'
        `;
        }
        const [rows] = await db.execute(query);
        return { success: true, data: rows };
    } catch (error) {
        console.error("Get position error:", error);
        return { success: false, error: "Failed to fetch position" };
    }
}


export async function getDepartments()
{
    try
    {
        const query = `
        SELECT departmentid, departmentname
        FROM Department
        ORDER BY departmentid ASC`;

        const [results] = await db.execute(query);

        return { success: true, data: results };
    } catch (error) {
        console.error("Get departments error:", error);
        return { success: false, error: "Failed to fetch departments" };
    }
}

export async function addDepartment(data)
{
    try
    {
        const query = `
        INSERT INTO DEPARTMENT (departmentname)
        VALUES (?)`;

        const [result] = await db.execute(query, [
            data.departmentname
        ]);

        return { success: true, data: result };
    } catch (error) {
        console.error("Add department error:", error);
        return { success: false, error: "Failed to add department" };
    }
}

export async function addPosition(data)
{
    try
    {
        const query = `
        INSERT INTO \`position\` (positionname, departmentid, basesalary)
        VALUES (?, ?, ?)`;

        const [result] = await db.execute(query, [
            data.positionname,
            data.departmentid,
            data.salary
        ]);

        return { success: true, data: result };
    } catch (error) {
        console.error("Add position error:", error);
        return { success: false, error: "Failed to add position" };
    }
}

export async function updatePosition(id, data) {
    try {
        // Constructing the UPDATE query for the Position table
        const query = `
            UPDATE \`position\`
            SET positionname = ?, departmentid = ?, basesalary = ?
            WHERE PositionID = ?;
        `;

        const [result] = await db.execute(query, [
            data.positionname,
            data.departmentid,
            data.salary, // Assuming 'salary' from the data object maps to 'basesalary' column
            id
        ]);

        // Check if a row was actually affected/updated
        if (result.affectedRows === 0) {
            return { success: false, error: "Position not found or no changes made" };
        }

        return { success: true, data: result };
    } catch (error) {
        console.error("Update position error:", error);
        return { success: false, error: "Failed to update position" };
    }
}

export async function updateDepartment(id, data) {
    try {
        // Constructing the UPDATE query for the Position table
        const query = `
            UPDATE department
            SET departmentname = ?
            WHERE departmentid = ?;
        `;

        const [result] = await db.execute(query, [
            data.departmentname,
            id
        ]);

        // Check if a row was actually affected/updated
        if (result.affectedRows === 0) {
            return { success: false, error: "Department not found or no changes made" };
        }

        return { success: true, data: result };
    } catch (error) {
        console.error("Update Department error:", error);
        return { success: false, error: "Failed to update Department" };
    }
}

export async function deletePosition(id) {
    try {   
        const query = `DELETE FROM Position WHERE PositionID = ?;`;
        const [taskResult] = await db.execute(
            query,
            [id]
        );
        if (taskResult.affectedRows === 0) {
                // Log but still return success if the record wasn't found (idempotent delete)
                console.warn(`Position with ID ${id} not found for deletion.`);
        }
        return { success: true, message: "Position successfully deleted." };
    } catch (error) {
        console.error("Delete position error:", error);
        return { success: false, error: "Failed to delete position" };
    }
}

export async function deleteDepartment(id) {
    try {   
        const query = `UPDATE Position Set DepartmentID = '0' WHERE DepartmentID = ?`;
        const [taskresult] = await db.execute(
            query,
            [id]
        );
        const query2 = `DELETE FROM Department WHERE DepartmentID = ?;`;
        const [taskResult] = await db.execute(
            query2,
            [id]
        );
        if (taskResult.affectedRows === 0) {
                console.warn(`Department with ID ${id} not found for deletion.`);
        }
        return { success: true, message: "Department successfully deleted." };
    } catch (error) {
        console.error("Delete Department error:", error);
        return { success: false, error: "Failed to delete Department" };
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
//Load All Active Personnel
export async function getAllPersonnelActive() {
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
            WHERE
                P.IsActive=1
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
          P.DateOfBirth AS dateofbirth,
          P.Gender AS gender,
          P.EmployDate AS employdate,
          P.PhoneNumber AS phonenumber,
          P.ManagerID AS managerid,
          D.DepartmentName AS department,
          P.IsActive AS isactive,
          P.TerminationDate AS terminationdate,
          M.Name AS managername,
          account.Email AS email,
          Pos.BaseSalary AS basesalary,
          Pos.AccessID AS accessid,
          
          -- Attendance percentage (count of days checked_in / total days)
          ROUND(
            (SUM(CASE WHEN A.CheckInStatus = 'Checked In' THEN 1 ELSE 0 END) / COUNT(A.AttendanceDate)) * 100,
            2
          ) AS attendanceRate,

          -- Salary = Base Salary * (attendanceRate / 100)
          ROUND(
            Pos.BaseSalary * (
              (SUM(CASE WHEN A.CheckInStatus = 'Checked In' THEN 1 ELSE 0 END) / COUNT(A.AttendanceDate))
            ),
            2
          ) AS salary

      FROM personnel AS P
      LEFT JOIN personnel AS M ON P.ManagerID = M.UserID
      JOIN position AS Pos ON P.PositionID = Pos.PositionID
      JOIN department AS D ON Pos.DepartmentID = D.DepartmentID
      JOIN account ON P.UserID = account.UserID
      LEFT JOIN attendance AS A ON P.UserID = A.UserID

      WHERE
      P.UserID = ?
      GROUP BY P.UserID
    `;

    const [rows] = await db.execute(query, [id]);

    if (rows.length === 0) {
      return { success: false, error: "Personnel not found" };
    }

    // Fill in safe defaults for nulls
    const data = rows[0];
    data.attendancerate = data.attendancerate || 0;
    data.salary = data.salary || 0;

    return { success: true, data };
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
        Insert into Account (UserID, Email, Password, HRID)
        VALUES (?, ?, ?, ?)
        `;
        
        await db.execute(query2, [
            newPersonnelId, // UserID = New Personnel ID
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
                TerminationDate = CURDATE()
            WHERE UserID = ?
        `;
        

        const [personnelResult] = await db.execute(personnelUpdateQuery, [
            0,
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
                T.Enddate AS enddate,
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
                P.UserID AS personnelid,
                T.CreationDate AS creationdate,
                T.enddate as enddate,
                Pro.ProjectName AS projectname,
                Pro.ProjectID AS projectid,
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
        return { success: true, data: rows[0] };
    } catch (error) {
        console.error("Get task by ID error:", error);
        return { success: false, error: "Failed to fetch task" };
    }
} 
// View Task by Project Id
export async function getTaskByProjectId(id) {
    try {
        const query = `
            SELECT
                T.TaskID AS taskid,
                T.TaskName AS taskname,
                T.TaskStatus AS taskstatus,
                A.Name AS assignername,
                P.Name AS personnelname,
                T.CreationDate AS creationdate,
                T.Enddate as enddate,
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
                T.ProjectID = ?
        `;
        const [rows] = await db.execute(query, [id]);
        return { success: true, data: rows };
    } catch (error) {
        console.error("Get task by ID error:", error);
        return { success: false, error: "Failed to fetch task" };
    }
} 

export async function getTaskByUserID(id) {
    try {
        const query = `
            SELECT
                T.TaskID AS taskid,
                T.TaskName AS taskname,
                T.TaskStatus AS taskstatus,
                A.Name AS assignername,
                P.Name AS personnelname,
                T.CreationDate AS creationdate,
                T.Enddate as enddate,
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
                T.PersonnelID = ?
        `;
        const [rows] = await db.execute(query, [id]);
        return { success: true, data: rows };
    } catch (error) {
        console.error("Get task by ID error:", error);
        return { success: false, error: "Failed to fetch task" };
    }
} 

// Add Task
export async function addTask(id, data) {
    try {
        const query = `
        INSERT into Task
        (TaskName, TaskStatus, AssignerID, PersonnelID, ProjectID, Description, Enddate)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [
            data.taskname,
            data.taskstatus,
            id,
            data.personnelid,
            data.projectid,
            data.description,
            data.enddate
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
                Description = ?,
                Enddate = ?
            WHERE TaskID = ?
            `
        const [taskResult] = await db.execute(taskUpdateQuery, [
            data.taskname,
            data.taskstatus,
            data.personnelid,
            data.projectid,
            data.description,
            data.enddate,
            id
        ]);
        return { success: true, rowsAffected: taskResult.affectedRows };
    } catch (error) {
        console.error("Update task error:", error);
        return { success: false, error: "Failed to update task" };
    }
}   
//Update Task Status:
export async function updateTaskStatus(id, data) {
    try {
        const taskUpdateQuery = `
            UPDATE Task SET
                TaskStatus = ?
            WHERE TaskID = ?
            `
        const [taskResult] = await db.execute(taskUpdateQuery, [
            data.taskstatus,
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

 export async function getProjectById(id) {
    try {
        const query = `
            SELECT
                P.ProjectID AS projectid,
                P.ProjectName AS projectname,
                P.ProjectStatus AS projectstatus,
                P.CreationDate AS creationdate,
                P.Description AS description,
                P.AssignerID AS assignerid,
                A.Name AS assignername
            FROM
                Project as P
            LEFT JOIN
                personnel AS A ON P.AssignerID = A.UserID
            WHERE
                P.ProjectID = ?
        `;
        const [rows] = await db.execute(query, [id]);
        if (rows.length === 0) {
            return { success: false, error: "Project not found" };
        }
        return { success: true, data: rows[0] };
    } catch (error) {
        console.error("Get project by ID error:", error);
        return { success: false, error: "Failed to fetch project" };
    }
}

// Add Project
export async function addProject(id, data) {
    try {
        // Note: Assuming ProjectID and CreationDate are handled by the database
        const query = `
            INSERT INTO Project
            (ProjectName, ProjectStatus, Description, AssignerID)
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [
            data.projectname,
            data.projectstatus,
            data.description,
            id // AssignerID is the UserID of the person creating/managing the project
        ]);
        return { success: true, data: result };
    } catch (error) {
        console.error("Add project error:", error);
        return { success: false, error: "Failed to add project" };
    }
}

// Update Project
export async function updateProject(id, data) {
    try {
        const projectUpdateQuery = `
            UPDATE Project SET
                ProjectName = ?,
                ProjectStatus = ?,
                Description = ?
            WHERE ProjectID = ?
        `;
        const [projectResult] = await db.execute(projectUpdateQuery, [
            data.projectname,
            data.projectstatus,
            data.description,
            id
        ]);
        return { success: true, rowsAffected: projectResult.affectedRows };
    } catch (error) {
        console.error("Update project error:", error);
        return { success: false, error: "Failed to update project" };
    }
}

// Delete Project
export async function deleteProject(id) {
    try {
        // Important: You may need to handle foreign key constraints 
        // (e.g., associated Tasks) before deleting the project. 
        // For this function, we assume cascading delete or no existing tasks.

        const query = `DELETE FROM Project WHERE ProjectID = ?;`;
        const [projectResult] = await db.execute(
            query,
            [id]
        );
        if (projectResult.affectedRows === 0) {
            console.warn(`Project with ID ${id} not found for deletion.`);
        }
        return { success: true, message: "Project successfully deleted." };
    } catch (error) {
        console.error("Delete project error:", error);
        return { success: false, error: "Failed to delete project" };
    }
}

//Fetch Request:
export async function getAllRequest() {
    try {
        const query = `
            SELECT
                R.RequestID AS requestid,
                R.RequesterID AS requesterid,
                Req.Name AS requestername,
                R.ApproverID AS approverid,
                App.Name AS approvername,
                R.RequestType AS type,
                R.Description AS description,
                R.Status AS requeststatus,
                R.CreatedAt AS creationdate
            FROM
                Request as R
            LEFT JOIN
                personnel AS Req ON R.RequesterID = Req.UserID
            LEFT JOIN
                personnel AS App ON R.ApproverID = App.UserID
        `;
        const [rows] = await db.execute(query);
        return { success: true, data: rows };
    } catch (error) {
        console.error("Get request error:", error);
        return { success: false, error: "Failed to fetch request" };
    }
}

export async function getRequest(id) {
    try {
        const query = `
            SELECT
                R.RequestID AS requestid,
                R.RequesterID AS requesterid,
                Req.Name AS requestername,
                R.ApproverID AS approverid,
                App.Name AS approvername,
                R.RequestType AS type,
                R.Description AS description,
                R.Status AS requeststatus,
                R.CreatedAt AS creationdate
            FROM
                Request as R
            LEFT JOIN
                personnel AS Req ON R.RequesterID = Req.UserID
            LEFT JOIN
                personnel AS App ON R.ApproverID = App.UserID
            WHERE
                R.RequesterID = ?
        `;
        const [rows] = await db.execute(query, [id]);
        return { success: true, data: rows };
    } catch (error) {
        console.error("Get request error:", error);
        return { success: false, error: "Failed to fetch request" };
    }
}

export async function updateRequestStatus(id, data, status) {
    try {
        const projectUpdateQuery = `
            UPDATE Request SET
                Status = ?,
                ApproverID = ?
            WHERE RequestID = ?
        `;
        const [requestResults] = await db.execute(projectUpdateQuery, [
            status,
            data,
            id
        ]);
        return { success: true, rowsAffected: requestResults.affectedRows };
    } catch (error) {
        console.error("Update request error:", error);
        return { success: false, error: "Failed to update request" };
    }
}

export async function deleteRequest(id) {
    try {   
        const query = `DELETE FROM Request WHERE RequestID = ?;`;
        const [requestResults] = await db.execute(
            query,
            [id]
        );
        return { success: true, message: "Request successfully deleted." };
    } catch (error) {
        console.error("Delete Request error:", error);
        return { success: false, error: "Failed to Request position" };
    }
}

export async function addRequest(data) {
    try {
        // Note: Assuming ProjectID and CreationDate are handled by the database
        const query = `
            INSERT INTO Request
            (RequesterID, ApproverID, RequestType, Description, Status, CreatedAt)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const [result] = await db.execute(query, [
            data.requesterid,
            null,
            data.requesttype,
            data.description,
            data.status,
            data.creationdate
        ]);
        return { success: true, data: result };
    } catch (error) {
        console.error("Add Request error:", error);
        return { success: false, error: "Failed to add Request" };
    }
}

export async function getAttendance() {
  try {
    const query = `
  SELECT 
    a.UserID AS UserID,
    p.Name AS Name,
    a.AttendanceDate,
    a.CheckInStatus,
    a.CheckInDateTime,
    a.CheckOutStatus,
    a.CheckOutDateTime
  FROM Attendance a
  JOIN Personnel p ON a.UserID = p.UserID
`;

    const [rows] = await db.execute(query);
    return { success: true, data: rows };
  } catch (error) {
    console.error("Failed to fetch Attendance: ", error);
    return { success: false, error: "Failed to fetch Attendance" };
  }
}

export async function getAttendanceByID(id, type) {
  try {
    if(type=='All')
    {
        const query = `
    SELECT 
        a.UserID AS UserID,
        p.Name AS Name,
        a.AttendanceDate,
        a.CheckInStatus,
        a.CheckInDateTime,
        a.CheckOutStatus,
        a.CheckOutDateTime
    FROM Attendance a
    JOIN Personnel p ON a.UserID = p.UserID
    WHERE p.UserID = ?
    `;

        const [rows] = await db.execute(query, [id]);
        return { success: true, data: rows };
    }
    else{
        const query = `
    SELECT 
        a.UserID AS UserID,
        p.Name AS Name,
        a.AttendanceDate,
        a.CheckInStatus,
        a.CheckInDateTime,
        a.CheckOutStatus,
        a.CheckOutDateTime
    FROM Attendance a
    JOIN Personnel p ON a.UserID = p.UserID
    WHERE p.UserID = ? AND AttendanceDate = CURDATE()
    `;

        const [rows] = await db.execute(query, [id]);
        return { success: true, data: rows[0] };
    }
  } catch (error) {
    console.error("Failed to fetch Attendance: ", error);
    return { success: false, error: "Failed to fetch Attendance" };
  }
}


export async function createAttendance()
{
    try
    {
        const query = `
        INSERT INTO Attendance (UserID, AttendanceDate, CheckInStatus)
            SELECT p.UserID, CURDATE(), 'Pending'
            FROM Personnel p
            WHERE NOT EXISTS (
    SELECT 1 
    FROM Attendance a
    WHERE a.UserID = p.UserID
      AND a.AttendanceDate = CURDATE()
            )
        `;
        const [result] = await db.execute(query);
        return { success: true, data: result };
    }
    catch (error)
    {
        console.error("Failed to generate Attendance: ", error);
        return { success: false, error: "Failed to generate Attendance"};
    }
}

export async function checkIn(id, date) {
    console.log("checkIn params =>", id, date);
  try {
    const query = `
      UPDATE Attendance
      SET CheckInStatus = 'Checked In',
          CheckInDateTime = NOW()
      WHERE UserID = ?
        AND AttendanceDate = CURDATE()
        AND CheckInStatus = 'Pending';
    `;

    const [result] = await db.execute(query, [id]);
    if (result.affectedRows === 0) {
            console.warn(`Attendance with ID ${id} not found.`);
        }
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to check in: ", error);
    return { success: false, error: "Failed to check in" };
  }
}

export async function checkOut(id, date) {
  try {
    const query = `
      UPDATE Attendance
      SET CheckOutStatus = 'Checked Out',
          CheckOutDateTime = NOW()
      WHERE UserID = ?
        AND AttendanceDate = CURDATE()
        AND CheckInStatus = 'Checked In'
        AND CheckOutStatus = 'Pending';
    `;

    const [result] = await db.execute(query, [id]);
    if (result.affectedRows === 0) {
            console.warn(`Attendance with ID ${id} not found.`);
        }
    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to check out: ", error);
    return { success: false, error: "Failed to check out" };
  }
}

export async function clearAttendance()
{
    try
    {
        const [result] = await db.execute(`Delete From Attendance`)
        return { success: true, data: result };
    }
    catch (error)
    {
        return {success: false, error: "Failed to clear Attendance"}
    }
}

export async function getReport() {
  try {
    // 🧩 Query all necessary datasets
    const [personnel] = await db.execute(`
      SELECT 
        UserID,
        Name,
        Gender,
        EmployDate,
        TerminationDate,
        IsActive,
        positionid
      FROM personnel;
    `);

    const [projects] = await db.execute(`
      SELECT 
        ProjectID,
        ProjectName,
        ProjectStatus,
        AssignerID,
        CreationDate,
        enddate
      FROM project;
    `);

    const [tasks] = await db.execute(`
      SELECT 
        TaskID,
        TaskName,
        TaskStatus,
        AssignerID,
        PersonnelID,
        ProjectID,
        CreationDate,
        enddate
      FROM task;
    `);

    const [attendance] = await db.execute(`
      SELECT 
        a.UserID,
        p.Name,
        a.AttendanceDate,
        a.CheckInStatus,
        a.CheckOutStatus
      FROM attendance a
      JOIN personnel p ON a.UserID = p.UserID;
    `);

    // ✅ Return combined data for the frontend report page
    return {
      success: true,
      data: {
        personnel,
        projects,
        tasks,
        attendance,
      },
    };
  } catch (error) {
    console.error("❌ Error in getReport():", error);
    return {
      success: false,
      error: "Failed to generate report data.",
    };
  }
}


export async function getNotification(id) {
  try {
    const query = `
  SELECT 
N.NotiID AS notiid,
N.NotiType AS notiype,
N.NotifierID AS notifierid,
P.NAME AS notifiername,
N.NotifiedID AS notifiedID,
Q.NAME AS notifiedname,
N.SeenStatus AS seen,
N.CreatedAt AS creationdate
From NOTIFICATION As N
JOIN PERSONNEL AS P ON N.NotifierID = P.UserID 
JOIN PERSONNEL AS Q ON N.NotifiedID = Q.UserID
WHERE N.NotiID = ?;
`;

    const [rows] = await db.execute(query, [id]);
    return { success: true, data: rows };
  } catch (error) {
    console.error("Failed to fetch Notification for "+ [id], error);
    return { success: false, error: "Failed to fetch Notification" };
  }
}

export async function readNotification(id){
  try {
    const query = `
    UPDATE Notification
    SET SeenStatus = TRUE
    WHERE NotiID = ?;
`;

    const [rows] = await db.execute(query, [id]);
    return { success: true, data: rows };
  } catch (error) {
    console.error("Failed to read Notification for "+ [id], error);
    return { success: false, error: "Failed to read Notification" };
  }
}

export async function sendNotification(data){
  try {
    const query = `
    INSERT INTO Notification (NotiType, NotifierID, NotifiedID, SeenStatus, CreatedAt)
    VALUES (?, ?, ?, FALSE, NOW());
`;

    const [rows] = await db.execute(query,
        [
            data.notitype,
            data.notifierid,
            data.notifiedid
        ]
    );
    return { success: true, data: rows };
  } catch (error) {
    console.error("Failed to send Notification", error);
    return { success: false, error: "Failed to send Notification" };
  }
}

