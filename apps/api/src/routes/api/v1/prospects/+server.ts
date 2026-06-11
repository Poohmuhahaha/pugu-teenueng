import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { db } from '$lib/server/db';

export async function GET({ url }: RequestEvent) {
    const workspaceId = Number(url.searchParams.get('workspaceId')) || 1;
    
    const prospects = await db.prospect.findMany({
        where: { workspaceId },
        orderBy: { createdAt: 'desc' }
    });
    
    return json(prospects);
}

export async function POST({ request }: RequestEvent) {
    const data = await request.json();
    
    const prospect = await db.prospect.create({
        data: {
            workspaceId: data.workspaceId || 1,
            name: data.name,
            email: data.email,
            phone: data.phone,
            status: 'pending'
        }
    });
    
    return json(prospect);
}
