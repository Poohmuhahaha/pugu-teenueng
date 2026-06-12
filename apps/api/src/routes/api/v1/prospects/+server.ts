import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { db } from '$lib/server/db';
import { resolveActor } from '$lib/server/auth';

export async function GET(event: RequestEvent) {
    let workspaceId = 1;
    try {
        const actor = await resolveActor(event);
        workspaceId = actor.workspaceId;
    } catch (e) {
        const wsId = event.url.searchParams.get('workspaceId');
        if (wsId) workspaceId = Number(wsId);
    }
    
    const prospects = await db.prospect.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' }
    });
    
    return json(prospects);
}

export async function POST(event: RequestEvent) {
    let workspaceId = 1;
    try {
        const actor = await resolveActor(event);
        workspaceId = actor.workspaceId;
    } catch (e) {
        // fallback
    }
    const data = await event.request.json();
    
    const prospect = await db.prospect.create({
        data: {
            workspaceId: data.workspaceId || workspaceId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            status: 'pending'
        }
    });
    
    return json(prospect);
}
