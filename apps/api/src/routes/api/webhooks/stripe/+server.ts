import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { verifyWebhookSignature } from '$lib/server/billing';

/**
 * Stripe → LifeOS event sink.
 * Handles customer.subscription.{created,updated,deleted} and checkout.session.completed.
 * Signature verified via STRIPE_WEBHOOK_SECRET.
 */
export async function POST({ request }) {
  const sig = request.headers.get('stripe-signature');
  if (!sig) throw error(400, 'Missing signature');

  const raw = await request.text();
  const ev = (await verifyWebhookSignature(raw, sig)) as
    | { type: string; data: { object: Record<string, unknown> } }
    | null;
  if (!ev) throw error(400, 'Invalid signature');

  switch (ev.type) {
    case 'checkout.session.completed': {
      const s = ev.data.object as {
        client_reference_id?: string;
        customer?: string;
        subscription?: string;
        metadata?: { workspaceId?: string; plan?: string };
      };
      const workspaceId = parseInt(s.client_reference_id ?? s.metadata?.workspaceId ?? '0');
      if (!workspaceId) break;
      await db.workspace.update({
        where: { id: workspaceId },
        data: { stripeCustomerId: (s.customer as string) ?? undefined },
      });
      await db.subscription.upsert({
        where: { workspaceId },
        update: {
          stripeSubscriptionId: (s.subscription as string) ?? undefined,
          plan: s.metadata?.plan ?? 'personal',
          status: 'active',
        },
        create: {
          workspaceId,
          stripeSubscriptionId: (s.subscription as string) ?? undefined,
          plan: s.metadata?.plan ?? 'personal',
          status: 'active',
        },
      });
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const sub = ev.data.object as {
        id: string;
        status: string;
        current_period_end: number;
        cancel_at_period_end?: boolean;
        items: { data: Array<{ price: { id: string } }> };
        metadata?: { workspaceId?: string; plan?: string };
      };
      const workspaceId = parseInt(sub.metadata?.workspaceId ?? '0');
      if (!workspaceId) break;
      await db.subscription.upsert({
        where: { workspaceId },
        update: {
          stripeSubscriptionId: sub.id,
          stripePriceId: sub.items.data[0]?.price.id,
          status: sub.status,
          plan: sub.metadata?.plan ?? 'personal',
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
        },
        create: {
          workspaceId,
          stripeSubscriptionId: sub.id,
          stripePriceId: sub.items.data[0]?.price.id,
          status: sub.status,
          plan: sub.metadata?.plan ?? 'personal',
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
        },
      });
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = ev.data.object as { metadata?: { workspaceId?: string } };
      const workspaceId = parseInt(sub.metadata?.workspaceId ?? '0');
      if (!workspaceId) break;
      await db.subscription.updateMany({
        where: { workspaceId },
        data: { status: 'canceled', plan: 'free' },
      });
      break;
    }
    default:
      // Acknowledge but ignore unknown events
      break;
  }
  return json({ received: true });
}
