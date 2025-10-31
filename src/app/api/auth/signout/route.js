import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ success: true });
    // Delete the auth cookie by removing it from the response
    response.cookies.delete('auth_token', { path: '/' });
    return response;
}