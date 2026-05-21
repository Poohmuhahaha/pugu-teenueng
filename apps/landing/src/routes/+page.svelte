<script lang="ts">
  import { onMount } from 'svelte';
  import { t, detectLocale, setLocale, SUPPORTED_LOCALES, type Locale } from '@lifeos/core';

  let email = '';
  let submitted = false;
  let submitting = false;
  let locale: Locale = 'en';

  onMount(() => { locale = detectLocale(); });

  function switchLocale(l: Locale) {
    setLocale(l);
    locale = l;
  }

  async function joinWaitlist() {
    if (!email.trim() || submitting) return;
    submitting = true;
    try {
      const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const apiBase = (typeof import.meta !== 'undefined' && (import.meta as { env?: { PUBLIC_API_URL?: string } }).env?.PUBLIC_API_URL) ?? '';
      const res = await fetch(`${apiBase}/api/v1/waitlist/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          utmSource: sp.get('utm_source'),
          utmCampaign: sp.get('utm_campaign'),
          ref: typeof document !== 'undefined' ? (document.referrer || null) : null,
        }),
      });
      submitted = res.ok;
    } finally {
      submitting = false;
    }
  }
</script>

<header>
  <div class="brand">LifeOS</div>
  <nav>
    <a href="#features">Features</a>
    <a href="#pricing">Pricing</a>
    <a href="https://github.com/lifeos">GitHub</a>
    <div class="lang">
      {#each SUPPORTED_LOCALES as l}
        <button class:active={locale === l} on:click={() => switchLocale(l)}>{l.toUpperCase()}</button>
      {/each}
    </div>
  </nav>
</header>

<main>
  <section class="hero">
    <h1>{t('landing.headline.left', locale)} <span class="accent">{t('landing.headline.right', locale)}</span></h1>
    <p class="lede">{t('landing.lede', locale)}</p>
    <form class="waitlist" on:submit|preventDefault={joinWaitlist}>
      <input type="email" bind:value={email} placeholder="you@example.com" required />
      <button type="submit" disabled={submitting}>{submitted ? t('landing.cta.done', locale) : submitting ? t('landing.cta.sending', locale) : t('landing.cta', locale)}</button>
    </form>
    <p class="microcopy">{t('landing.microcopy', locale)}</p>
  </section>

  <section id="features" class="features">
    <h2>{t('landing.section.features', locale)}</h2>
    <div class="grid">
      <div class="card">
        <div class="dot"></div>
        <h3>Knowledge graph</h3>
        <p>Bi-directional <code>[[wiki-links]]</code> with hover-preview. The connections behind what you know.</p>
      </div>
      <div class="card">
        <div class="dot yellow"></div>
        <h3>Block editor</h3>
        <p>TipTap-powered pages. Headings, todos, code, embeds. Same data, multiple views.</p>
      </div>
      <div class="card">
        <div class="dot"></div>
        <h3>Database views</h3>
        <p>Table, Kanban, Calendar, Timeline — all reading the same content entries.</p>
      </div>
      <div class="card">
        <div class="dot yellow"></div>
        <h3>Local-first + offline PWA</h3>
        <p>RxDB sync engine. Airplane mode editing. True ownership.</p>
      </div>
      <div class="card">
        <div class="dot"></div>
        <h3>Public REST API</h3>
        <p>Strapi-style filters, sort, pagination. API keys per workspace. OpenAPI 3.1 spec.</p>
      </div>
      <div class="card">
        <div class="dot yellow"></div>
        <h3>Webhooks</h3>
        <p>HMAC-signed events on every create / update / delete. Wire to Slack, Zapier, anything.</p>
      </div>
    </div>
  </section>

  <section id="pricing" class="pricing">
    <h2>{t('landing.section.pricing', locale)}</h2>
    <div class="tiers">
      <div class="tier">
        <div class="tier-name">Free</div>
        <div class="tier-price">฿0 <span>/mo</span></div>
        <ul>
          <li>1 workspace · 1 user</li>
          <li>1,000 entries</li>
          <li>Community support</li>
        </ul>
      </div>
      <div class="tier accent">
        <div class="tier-name">Personal Pro</div>
        <div class="tier-price">฿199 <span>/mo</span></div>
        <ul>
          <li>Unlimited entries</li>
          <li>5 GB files</li>
          <li>Public API access</li>
          <li>Priority email</li>
        </ul>
      </div>
      <div class="tier">
        <div class="tier-name">Studio</div>
        <div class="tier-price">฿999 <span>/mo</span></div>
        <ul>
          <li>10 users</li>
          <li>50 GB · SSO · audit log</li>
          <li>Email SLA 24h</li>
        </ul>
      </div>
      <div class="tier">
        <div class="tier-name">Self-host</div>
        <div class="tier-price">฿0 <span>· AGPL-3.0</span></div>
        <ul>
          <li>Unlimited everything</li>
          <li>Docker + Helm</li>
          <li>Paid customization & support</li>
        </ul>
      </div>
    </div>
  </section>
</main>

<footer>
  <span>© 2026 LifeOS · <a href="https://github.com/lifeos/lifeos/blob/main/docs/quickstart.md">Quickstart</a> · <a href="https://github.com/lifeos/lifeos/blob/main/docs/self-host.md">Self-host</a> · <a href="https://github.com/lifeos/lifeos/blob/main/docs/api.md">API docs</a> · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></span>
</footer>

<style>
  :global(html, body) { margin: 0; padding: 0; }
  :global(body) {
    font-family: -apple-system, system-ui, 'Inter', sans-serif;
    color: #111;
    background: #fff;
    line-height: 1.55;
  }
  header { display: flex; align-items: center; justify-content: space-between; padding: 20px 32px; max-width: 1100px; margin: 0 auto; }
  .brand { font-weight: 800; letter-spacing: -0.02em; font-size: 17px; color: #7c3aed; }
  nav { display: flex; gap: 24px; align-items: center; }
  nav a { color: #111; text-decoration: none; font-size: 14px; font-weight: 500; }
  nav a:hover { color: #7c3aed; }
  .lang { display: flex; gap: 4px; padding: 2px; background: #f3f4f6; border-radius: 6px; }
  .lang button { background: transparent; border: none; padding: 4px 8px; font-size: 11px; cursor: pointer; border-radius: 4px; color: #6b7280; font-weight: 600; }
  .lang button.active { background: #fff; color: #7c3aed; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }

  main { max-width: 1100px; margin: 0 auto; padding: 0 32px; }
  .hero { text-align: center; padding: 80px 0 60px; }
  .hero h1 { font-size: clamp(36px, 6vw, 64px); letter-spacing: -0.03em; line-height: 1.05; margin: 0 0 16px; }
  .accent { color: #7c3aed; }
  .lede { font-size: 18px; color: #4b5563; max-width: 540px; margin: 0 auto 32px; }
  .waitlist { display: flex; gap: 8px; max-width: 420px; margin: 0 auto; }
  .waitlist input { flex: 1; height: 44px; padding: 0 16px; border: 1px solid #d4d4d8; border-radius: 10px; font-size: 14px; }
  .waitlist button { height: 44px; padding: 0 20px; background: #7c3aed; color: #fff; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; cursor: pointer; }
  .microcopy { margin-top: 14px; font-size: 12px; color: #6b7280; }

  section { padding: 80px 0; }
  h2 { font-size: 30px; letter-spacing: -0.02em; margin-bottom: 32px; }

  .features .grid { display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
  .card { background: #fafafa; border: 1px solid #e5e7eb; border-radius: 14px; padding: 22px; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: #7c3aed; margin-bottom: 12px; }
  .dot.yellow { background: #facc15; }
  .card h3 { margin: 0 0 6px; font-size: 16px; }
  .card p { margin: 0; color: #4b5563; font-size: 14px; }
  .card code { background: rgba(124, 58, 237, 0.08); padding: 1px 5px; border-radius: 4px; font-size: 12px; }

  .pricing .tiers { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
  .tier { background: #fafafa; border: 1px solid #e5e7eb; border-radius: 14px; padding: 24px; }
  .tier.accent { border-color: #7c3aed; background: #fff; box-shadow: 0 4px 24px rgba(124, 58, 237, 0.1); }
  .tier-name { font-size: 13px; font-weight: 700; text-transform: uppercase; color: #6b7280; letter-spacing: 0.06em; }
  .tier-price { font-size: 28px; font-weight: 700; margin: 8px 0 20px; }
  .tier-price span { font-size: 14px; color: #6b7280; font-weight: 500; }
  .tier ul { padding: 0; margin: 0; list-style: none; }
  .tier li { font-size: 13px; padding: 4px 0; color: #374151; }

  footer { text-align: center; padding: 40px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
  footer a { color: #6b7280; }
</style>
