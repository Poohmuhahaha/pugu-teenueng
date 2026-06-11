import { json } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { db } from '$lib/server/db';

export async function PATCH({ params, request }: RequestEvent) {
    const { id } = params;
    const data = await request.json();
    
    const prospect = await db.prospect.update({
        where: { id: Number(id) },
        data: { status: data.status }
    });
    
    // In a full implementation, we would dispatch a webhook here
    // using $lib/server/webhook or a BullMQ queue
    if (data.status === 'approved') {
        console.log(`[QuestPage] Prospect ${id} approved. Triggering Webhook...`);
    }
    
    return json(prospect);
}
