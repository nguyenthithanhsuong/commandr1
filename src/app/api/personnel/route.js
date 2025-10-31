import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

export async function GET() {
    const dbconnection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'ScottAnderson01',
        database: 'commandr'
    });

    try {
        const query = "SELECT * FROM Account";
        const [data] = await dbconnection.execute(query);
        await dbconnection.end();

        return NextResponse.json({ 
            data,
            success: true 
        });
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json(
            { 
                message: 'Database query failed', 
                success: false 
            }, 
            { status: 500 }
        );
    }
}