/**
 * Stripe billing — lazy SDK loader keeps the dep optional for self-host.
 *
 * Required env (cloud only):
 *   STRIPE_SECRET_KEY=sk_live_…
 *   STRIPE_WEBHOOK_SECRET=whsec_…
 *   STRIPE_PRICE_PERSONAL=price_…
 *   STRIPE_PRICE_STUDIO=price_…
 *   PUBLIC_BASE_URL=https://lifeos.so
 */

let cached: typeof import('stripe').default | null | undefined;

async function loadStripe(): Promise<typeof import('stripe').default | null> {
  if (cached !== undefined) return cached;
  if (!process.env.STRIPE_SECRET_KEY) {
    cached = null;
    return null;
  }
  try {
    const mod = await import(/* @vite-ignore */ 'stripe');
    cached = mod.default;
    return cached;
  } catch {
    cached = null;
    return null;
  }
}

export interface CheckoutSessionRequest {
  workspaceId: number;
  workspaceSlug: string;
  customerEmail: string;
  plan: 'personal' | 'studio';
  existingCustomerId?: string | null;
}

export interface CheckoutSession { url: string; sessionId: string; }

export async function createCheckoutSession(req: CheckoutSessionRequest): Promise<CheckoutSession | null> {
  const Stripe = await loadStripe();
  if (!Stripe) return null;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });

  const priceId =
    req.plan === 'studio'
      ? process.env.STRIPE_PRICE_STUDIO
      : process.env.STRIPE_PRICE_PERSONAL;
  if (!priceId) throw new Error(`No price configured for plan=${req.plan}`);

  const base = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3001';
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: req.existingCustomerId ?? undefined,
    customer_email: req.existingCustomerId ? undefined : req.customerEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${base}/billing?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/billing?cancelled=1`,
    client_reference_id: String(req.workspaceId),
    metadata: { workspaceId: String(req.workspaceId), plan: req.plan },
    subscription_data: {
      metadata: { workspaceId: String(req.workspaceId), plan: req.plan },
    },
  });

  if (!session.url) return null;
  return { url: session.url, sessionId: session.id };
}

export async function verifyWebhookSignature(rawBody: string, signature: string): Promise<unknown | null> {
  const Stripe = await loadStripe();
  if (!Stripe || !process.env.STRIPE_WEBHOOK_SECRET) return null;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });
  try {
    return stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return null;
  }
}

export interface PortalRequest {
  customerId: string;
  workspaceSlug: string;
}

export async function createPortalSession(req: PortalRequest): Promise<{ url: string } | null> {
  const Stripe = await loadStripe();
  if (!Stripe) return null;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' });
  const base = process.env.PUBLIC_BASE_URL ?? 'http://localhost:3001';
  const session = await stripe.billingPortal.sessions.create({
    customer: req.customerId,
    return_url: `${base}/billing`,
  });
  return { url: session.url };
}

/** Plan limits — checked before every entry creation. */
export interface PlanLimits {
  entries: number;     // soft-cap; -1 = unlimited
  workspaceMembers: number;
  storageBytes: number; // -1 = unlimited
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free:       { entries: 1000, workspaceMembers: 1,  storageBytes: 50 * 1024 * 1024 },
  personal:   { entries: -1,   workspaceMembers: 1,  storageBytes: 5  * 1024 * 1024 * 1024 },
  studio:     { entries: -1,   workspaceMembers: 10, storageBytes: 50 * 1024 * 1024 * 1024 },
  enterprise: { entries: -1,   workspaceMembers: -1, storageBytes: -1 },
};
