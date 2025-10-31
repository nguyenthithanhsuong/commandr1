import { NextResponse } from 'next/server';

// Deprecated: session creation should be performed via /api/db authenticate
export async function POST() {
  return NextResponse.json({ error: 'Not allowed' }, { status: 405 });
}