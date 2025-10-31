import { NextResponse } from 'next/server';
import * as dbOps from '@/app/lib/dbOperations';

export async function POST(request) {
    try {
        const { operation, params } = await request.json();

        let result;
        switch (operation) {
            case 'authenticate':
                result = await dbOps.authenticateUser(params.email, params.password);
                break;
            case 'getAllPersonnel':
                result = await dbOps.getAllPersonnel();
                break;
            case 'getPersonnelById':
                result = await dbOps.getPersonnelById(params.id);
                break;
            case 'updatePersonnel':
                result = await dbOps.updatePersonnel(params.id, params.data);
                break;
            case 'createPersonnel':
                result = await dbOps.createPersonnel(params.data);
                break;
            case 'deletePersonnel':
                result = await dbOps.deletePersonnel(params.id);
                break;
            default:
                return NextResponse.json(
                    { error: 'Unknown operation' },
                    { status: 400 }
                );
        }

        if (!result.success) {
            return NextResponse.json(
                { error: result.error },
                { status: 400 }
            );
        }

        // If this was an authentication request and succeeded, set the session cookie here
        if (operation === 'authenticate') {
            // result.data is expected to be an array of matching users
            const user = Array.isArray(result.data) && result.data[0];
            if (user) {
                const token = Buffer.from(JSON.stringify({
                    id: user.id,
                    email: user.email,
                    exp: Date.now() + 24 * 60 * 60 * 1000,
                })).toString('base64');

                    const response = NextResponse.json({ data: result.data });
                response.cookies.set('auth_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: 24 * 60 * 60,
                    path: '/',
                });

                return response;
            }
        }

        return NextResponse.json({ data: result.data });

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}