import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from './$types';
import { db } from '$lib/server/db';
import { resolveActor } from '$lib/server/auth';
import { fireWebhooks } from '$lib/server/webhook';

export async function PATCH(event: RequestEvent) {
    const { id } = event.params;
    let workspaceId = 1;
    try {
        const actor = await resolveActor(event);
        workspaceId = actor.workspaceId;
    } catch (e) {
        // Fallback for simulation or unauthenticated requests
    }
    
    const data = await event.request.json();
    
    // Verify prospect exists in the workspace
    const existing = await db.prospect.findFirst({
        where: { id: Number(id), workspaceId }
    });
    if (!existing) {
        throw error(404, 'Prospect not found');
    }
    
    const updateData: Record<string, any> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.status !== undefined) updateData.status = data.status;
    
    const prospect = await db.prospect.update({
        where: { id: Number(id) },
        data: updateData
    });
    
    if (data.status === 'approved') {
        console.log(`[QuestPage] Prospect ${id} approved. Triggering Webhook...`);
        // Dispatch webhook callback for prospect.approved
        await fireWebhooks({
            workspaceId,
            contentTypeSlug: 'prospect',
            event: 'prospect.approved',
            entityId: prospect.id,
            data: prospect
        });
    }
    
    return json(prospect);
}
