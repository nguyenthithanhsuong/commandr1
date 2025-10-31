import { NextResponse } from 'next/server';
 
// This function can be marked `async` if using `await` inside
export function middleware(request) {
  // Get the path the user is trying to access
  const path = request.nextUrl.pathname;

  // Define protected routes
  const protectedRoutes = ['/personnel'];

  if (!protectedRoutes.includes(path)) {
    return NextResponse.next();
  }

  // Read cookies from header and validate token payload (avoid trusting presence only)
  const cookieHeader = request.headers.get('cookie') || '';
  const cookies = {};
  cookieHeader.split(';').forEach((c) => {
    const idx = c.indexOf('=');
    if (idx === -1) return;
    const name = c.slice(0, idx).trim();
    const val = c.slice(idx + 1).trim();
    cookies[name] = decodeURIComponent(val);
  });

  const token = cookies['auth_token'];

  if (!token) return NextResponse.redirect(new URL('/signin', request.url));

  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    if (!payload.exp || payload.exp < Date.now()) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    // token looks valid, allow
    return NextResponse.next();
  } catch (err) {
    // invalid token
    return NextResponse.redirect(new URL('/signin', request.url));
  }
}
 
// Configure which paths should trigger this middleware
export const config = {
  matcher: [
    '/personnel',
    '/personnel/:path*',
    // add other protected routes here
  ]
}