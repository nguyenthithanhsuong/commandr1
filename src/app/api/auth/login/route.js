import { NextResponse } from 'next/server';
import { db } from '@/app/lib/db.js';

export async function POST(request) {
    try {
        const { email, password } = await request.json();
        const query=
        `Select * From Account
        JOIN personnel on Account.UserID = personnel.UserID
        WHERE email = ? AND Password = ? AND IsActive = 1`
        const [rows] = await db.execute(
            query,
            [email, password]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Don't send the password back to the client
        const user = {
            id: rows[0].id,
            email: rows[0].email,
            // Add any other user fields you want to return
        };

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}