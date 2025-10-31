import mysql from 'mysql2/promise';

export const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'ScottAnderson01',
    database: 'commandr',
});

try{
  const connection = await db.getConnection();
  console.log("Database connection established");
  connection.release();
} catch (error) {
  console.error("Database connection failed:", error);
  process.exit(1);
}