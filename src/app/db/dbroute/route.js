import { NextResponse } from 'next/server';
import * as dbOps from '@/app/db/dbOperations';

export async function POST(request) {
    try {
        const { operation, params } = await request.json();
        
        let result;
        switch (operation) {
            //authentication
            case 'authenticate':
                result = await dbOps.authenticateUser(params.email, params.password);
                break;
            //personnel
            case 'getAllPersonnel':
                result = await dbOps.getAllPersonnel();
                break;
            case 'getAllPersonnelActive':
                result = await dbOps.getAllPersonnelActive();
                break;
            case 'getPersonnelById':
                result = await dbOps.getPersonnelById(params.id);
                break;
            case 'createPersonnel':
                result = await dbOps.addPersonnel(params.id, params.data);
                break;
            case 'updatePersonnel':
                result = await dbOps.updatePersonnel(params.id, params.data);
                break;
            case 'deletePersonnel':
                result = await dbOps.deletePersonnel(params.id);
                break;
            case 'retirePersonnel':
                    result = await dbOps.retirePersonnel(params.id);
                    break;
            //position
            case 'getPositions':
                result = await dbOps.getPositions();
                break;
            //task
            case 'getAllTask':
                result = await dbOps.getAllTask();
                break;
            case 'getTaskById':
                result = await dbOps.getTaskById(params.id);
                break;
            case 'createTask':
                result = await dbOps.addTask(params.data);
                break;
            case 'updateTask':
                result = await dbOps.updateTask(params.id, params.data);
                break;
            case 'deleteTask':
                result = await dbOps.deleteTask(params.id);
                break;
            //project
            case 'getAllProject':
                result = await dbOps.getAllProject();
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
                    id: user.UserID,
                    email: user.Email,
                    exp: Date.now() + 24 * 60 * 60 * 1000,
                })).toString('base64');
                    const response = NextResponse.json({ data: result.data});
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

        return NextResponse.json({ success: true, data: result.data });

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}