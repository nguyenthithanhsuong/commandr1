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
            case 'getPosition':
                result = await dbOps.getPositions();
                break;
            case 'addPosition':
                result = await dbOps.addPosition(params.data);
                break;
            case 'updatePosition':
                result = await dbOps.updatePosition(params.id, params.data);
                break;
            case 'deletePosition':
                result = await dbOps.deletePosition(params.id);
                break;
            case 'getDepartments':
                result = await dbOps.getDepartments();
                break;
            case 'addDepartment':
                result = await dbOps.addDepartment(params.data);
                break;
            case 'updateDepartment':
                result = await dbOps.updateDepartment(params.id, params.data);
                break;
            case 'deleteDepartment':
                result = await dbOps.deleteDepartment(params.id);
                break;
            //task
            case 'getAllTask':
                result = await dbOps.getAllTask();
                break;
            case 'getTaskById':
                result = await dbOps.getTaskById(params.id);
                break;
            case 'getTaskByProjectId':
                result = await dbOps.getTaskByProjectId(params.id);
                break; 
            case 'createTask':
                result = await dbOps.addTask(params.id, params.data);
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
            case 'getProjectById':
                result = await dbOps.getProjectById(params.id);
                break;
            case 'createProject':
                result = await dbOps.addProject(params.id, params.data);
                break;
            case 'updateProject':
                result = await dbOps.updateProject(params.id, params.data);
                break;
            case 'deleteProject':
                result = await dbOps.deleteProject(params.id);
                break;
            //requeest:
            case 'getAllRequest':
                result = await dbOps.getAllRequest();
                break;
            case 'createRequest':
                result = await dbOps.addRequest(params.data);
                break;
            case 'updateRequestStatus':
                result = await dbOps.updateRequestStatus(params.id, params.data, params.status)
                break;
            case 'deleteRequest':
                result = await dbOps.deleteRequest(params.id);
                break;
            //attendance
            case 'getAttendance':
                result  = await dbOps.getAttendance();
                break;
            case 'createAttendance':
                result = await dbOps.createAttendance();
                break;
            case 'checkIn':
                result = await dbOps.checkIn(params.id, params.date);
                break;
            case 'checkOut':
                result = await dbOps.checkOut(params.id, params.date);
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