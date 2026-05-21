# LifeOS — Webhooks

Webhooks let you react to content events in real time. Every create / update / delete on a `ContentEntry` fires a webhook (if registered) with an HMAC-SHA256 signature so you can verify the payload came from your LifeOS instance.

## Register a webhook

Via admin UI (recommended) or the REST API:

```bash
curl -X POST https://your-instance.com/api/v1/webhooks \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://hooks.zapier.com/abc",
    "contentTypeSlug": "personal-crm",
    "events": ["afterCreate", "afterUpdate"]
  }'
```

The response contains a one-time `secret`. **Save it now** — it's hashed at rest and never returned again.

## Payload

```http
POST https://hooks.zapier.com/abc
Content-Type: application/json
X-LifeOS-Signature: sha256=<hex>
X-LifeOS-Attempt: 1
```

```json
{
  "event": "afterCreate",
  "entity": "personal-crm",
  "id": 42,
  "data": { "title": "Alice", "email": "alice@x.com" },
  "workspaceId": 7,
  "timestamp": "2026-05-21T10:30:00.000Z"
}
```

## Verifying the signature

`HMAC-SHA256(rawBody, secret)` in hex must match the `X-LifeOS-Signature` header (after the `sha256=` prefix).

### Node.js

```js
import crypto from 'node:crypto';

export function verifyLifeOS(rawBody, signatureHeader, secret) {
  if (!signatureHeader?.startsWith('sha256=')) return false;
  const provided = signatureHeader.slice(7);
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  // timingSafeEqual prevents timing attacks
  const a = Buffer.from(provided, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Express example
app.post('/lifeos-webhook', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.header('X-LifeOS-Signature');
  if (!verifyLifeOS(req.body, sig, process.env.LIFEOS_WEBHOOK_SECRET)) {
    return res.status(401).send('invalid signature');
  }
  const event = JSON.parse(req.body.toString('utf-8'));
  console.log(event.event, event.entity, event.id);
  res.json({ ok: true });
});
```

### Python (FastAPI)

```python
import hmac, hashlib
from fastapi import FastAPI, Request, HTTPException

LIFEOS_SECRET = os.environ['LIFEOS_WEBHOOK_SECRET'].encode()
app = FastAPI()

def verify(raw: bytes, sig_header: str | None) -> bool:
    if not sig_header or not sig_header.startswith('sha256='):
        return False
    provided = bytes.fromhex(sig_header[7:])
    expected = hmac.new(LIFEOS_SECRET, raw, hashlib.sha256).digest()
    return hmac.compare_digest(provided, expected)

@app.post('/lifeos-webhook')
async def hook(request: Request):
    raw = await request.body()
    if not verify(raw, request.headers.get('x-lifeos-signature')):
        raise HTTPException(401, 'invalid signature')
    event = await request.json()
    print(event['event'], event['entity'], event['id'])
    return {'ok': True}
```

### Go

```go
func verify(raw []byte, sigHeader, secret string) bool {
    if !strings.HasPrefix(sigHeader, "sha256=") {
        return false
    }
    provided, err := hex.DecodeString(strings.TrimPrefix(sigHeader, "sha256="))
    if err != nil {
        return false
    }
    mac := hmac.New(sha256.New, []byte(secret))
    mac.Write(raw)
    return hmac.Equal(provided, mac.Sum(nil))
}
```

## Retry behaviour

If your endpoint returns a non-2xx (or times out / errors), LifeOS:

1. Stores the failure in `WebhookFailure` with `nextRetryAt`
2. Retries with exponential backoff: **1m → 5m → 15m → 1h → 6h**
3. After 5 failed attempts, **disables the webhook** automatically — fix the endpoint, then re-enable from admin

For the retry worker to run, schedule `POST /api/internal/webhook-retry` with header `X-Internal-Token: $INTERNAL_WORKER_TOKEN` every ~30 seconds (cron / k8s `CronJob` / GitHub Actions on schedule).

## Recipe: Slack notification on lead won

1. Create a Slack incoming webhook for your channel.
2. Register the URL with LifeOS, filter by your "leads" content type, events `["afterUpdate"]`.
3. In a tiny relay (Cloudflare Worker / Vercel function), verify the signature, check `event.data.status === 'won'`, then forward to Slack:

```js
export default {
  async fetch(req, env) {
    const raw = await req.text();
    if (!verifyLifeOS(raw, req.headers.get('X-LifeOS-Signature'), env.LIFEOS_SECRET)) {
      return new Response('invalid', { status: 401 });
    }
    const evt = JSON.parse(raw);
    if (evt.event !== 'afterUpdate' || evt.data?.status !== 'won') {
      return new Response('skipped');
    }
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `🎉 Lead won: ${evt.data.title} (${evt.data.estimatedValue} THB)` }),
    });
    return new Response('ok');
  },
};
```

## Recipe: Zapier

1. In Zapier, create a Zap with **Webhooks by Zapier → Catch Hook** as the trigger.
2. Copy the catch URL, register it in LifeOS for the events + content-type you want.
3. **Add a step** to call `verifyLifeOS` via a tiny Worker / Function (Zapier itself doesn't verify HMAC) — or accept the small risk if your collection is non-sensitive.
4. Map fields from `event.data.*` into downstream actions (Sheets, Notion, Airtable, Slack).

## Recipe: n8n

n8n has built-in HMAC verification:

1. **HTTP Request Trigger** node, set `Authentication = HMAC Auth`, `Header Name = X-LifeOS-Signature`, `Algorithm = sha256`, paste your webhook secret.
2. Use the parsed JSON downstream.

## Observing webhook health

- `GET /api/v1/webhooks` — list active + disabled hooks
- `GET /api/v1/webhooks/:id/failures` — last 100 failures with status / attempt / next retry / error message
- Admin **Webhooks** page exposes Enable/Disable/Delete buttons and a Failures expander per row

## Recommended event-to-action map

| Event | Common use |
|---|---|
| `afterCreate` | Forward to Slack/Discord; queue downstream pipeline |
| `afterUpdate` | Re-index search; notify owner of status change |
| `beforeDelete` | Backup; warn integrations downstream |
| `afterDelete` | Clean up referencing records in third-party systems |
