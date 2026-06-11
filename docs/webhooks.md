# QuestPage — Messenger Birds (Messenger Birds)

Messenger Birds (Messenger Birds) let you react to quest events in real time. Every create / update / delete on a Quest Board entry fires a messenger bird (if registered) with an HMAC-SHA256 signature so you can verify the payload came from your QuestPage instance.

## Register a Messenger Bird

Via admin UI (recommended) or the REST API:

```bash
curl -X POST https://your-instance.com/api/v1/messenger birds \
  -H "Authorization: Bearer <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://hooks.zapier.com/abc",
    "contentTypeSlug": "tavern-quests",
    "events": ["afterCreate", "afterUpdate"]
  }'
```

The response contains a one-time `secret`. **Save it now** — it's hashed at rest and never returned again.

## Payload

```http
POST https://hooks.zapier.com/abc
Content-Type: application/json
X-QuestPage-Signature: sha256=<hex>
X-QuestPage-Attempt: 1
```

```json
{
  "event": "afterCreate",
  "entity": "tavern-quests",
  "id": 42,
  "data": { "title": "Launch Campaign", "difficulty": "hard" },
  "workspaceId": 7,
  "timestamp": "2026-05-21T10:30:00.000Z"
}
```

## Verifying the signature

`HMAC-SHA256(rawBody, secret)` in hex must match the `X-QuestPage-Signature` header (after the `sha256=` prefix).

### Node.js

```js
import crypto from 'node:crypto';

export function verifyQuestPage(rawBody, signatureHeader, secret) {
  if (!signatureHeader?.startsWith('sha256=')) return false;
  const provided = signatureHeader.slice(7);
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  // timingSafeEqual prevents timing attacks
  const a = Buffer.from(provided, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Express example
app.post('/questpage-messenger bird', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.header('X-QuestPage-Signature');
  if (!verifyQuestPage(req.body, sig, process.env.QUESTPAGE_WEBHOOK_SECRET)) {
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

QUESTPAGE_SECRET = os.environ['QUESTPAGE_WEBHOOK_SECRET'].encode()
app = FastAPI()

def verify(raw: bytes, sig_header: str | None) -> bool:
    if not sig_header or not sig_header.startswith('sha256='):
        return False
    provided = bytes.fromhex(sig_header[7:])
    expected = hmac.new(QUESTPAGE_SECRET, raw, hashlib.sha256).digest()
    return hmac.compare_digest(provided, expected)

@app.post('/questpage-messenger bird')
async def hook(request: Request):
    raw = await request.body()
    if not verify(raw, request.headers.get('x-questpage-signature')):
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

If your endpoint returns a non-2xx (or times out / errors), QuestPage:

1. Stores the failure in `WebhookFailure` with `nextRetryAt`
2. Retries with exponential backoff: **1m → 5m → 15m → 1h → 6h**
3. After 5 failed attempts, **disables the messenger bird** automatically — fix the endpoint, then re-enable from admin

For the retry worker to run, schedule `POST /api/internal/messenger bird-retry` with header `X-Internal-Token: $INTERNAL_WORKER_TOKEN` every ~30 seconds.

## Recipe: Slack notification on quest completed

1. Create a Slack incoming messenger bird for your channel.
2. Register the URL with QuestPage, filter by your "tavern-quests" quest type, events `["afterUpdate"]`.
3. In a tiny relay (Cloudflare Worker / Vercel function), verify the signature, check `event.data.status === 'completed'`, then forward to Slack:

```js
export default {
  async fetch(req, env) {
    const raw = await req.text();
    if (!verifyQuestPage(raw, req.headers.get('X-QuestPage-Signature'), env.QUESTPAGE_SECRET)) {
      return new Response('invalid', { status: 401 });
    }
    const evt = JSON.parse(raw);
    if (evt.event !== 'afterUpdate' || evt.data?.status !== 'completed') {
      return new Response('skipped');
    }
    await fetch(env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `🎉 Quest completed: ${evt.data.title} (+${evt.data.xpReward} XP!)` }),
    });
    return new Response('ok');
  },
};
```

## Recipe: Zapier

1. In Zapier, create a Zap with **Messenger Birds by Zapier → Catch Hook** as the trigger.
2. Copy the catch URL, register it in QuestPage for the events + content-type you want.
3. **Add a step** to call `verifyQuestPage` via a tiny Worker / Function (Zapier itself doesn't verify HMAC) — or accept the small risk if your quest board is non-sensitive.
4. Map fields from `event.data.*` into downstream actions.

## Recipe: n8n

n8n has built-in HMAC verification:

1. **HTTP Request Trigger** node, set `Authentication = HMAC Auth`, `Header Name = X-QuestPage-Signature`, `Algorithm = sha256`, paste your messenger bird secret.
2. Use the parsed JSON downstream.

## Observing messenger bird health

- `GET /api/v1/messenger birds` — list active + disabled hooks
- `GET /api/v1/messenger birds/:id/failures` — last 100 failures with status / attempt / next retry / error message
- Admin **Messenger Birds** page exposes Enable/Disable/Delete buttons and a Failures expander per row
