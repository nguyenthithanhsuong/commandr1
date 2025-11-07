import { NextResponse } from 'next/server';

// Simple cookie parser for the Cookie header
function parseCookies(cookieHeader) {
    const result = {};
    if (!cookieHeader) return result;
    const parts = cookieHeader.split(';');
    for (const part of parts) {
        const idx = part.indexOf('=');
        if (idx === -1) continue;
        const name = part.slice(0, idx).trim();
        const val = part.slice(idx + 1).trim();
        result[name] = decodeURIComponent(val);
    }
    return result;
}

export async function GET(request) {
    // Read cookies from the incoming request's headers (more reliable in Route Handlers)
    const cookieHeader = request.headers.get('cookie');
    const cookies = parseCookies(cookieHeader);
    const tokenValue = cookies['auth_token'];

    console.log('/api/auth/check cookie value:', tokenValue);
    if (!tokenValue) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        const userData = JSON.parse(Buffer.from(tokenValue, 'base64').toString());
        if (userData.exp < Date.now()) {
            return NextResponse.json({ error: 'Session expired' }, { status: 401 });
        }
        return NextResponse.json({ authenticated: true, user: userData.id });
    } catch (error) {
        console.error('/api/auth/check error parsing token:', error);
        return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
}

