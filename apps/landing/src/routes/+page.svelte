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
    <a href="#features">{t('nav.features', locale)}</a>
    <a href="#pricing">{t('nav.pricing', locale)}</a>
    <a href="https://github.com/Poohmuhahaha/lifeos">{t('nav.github', locale)}</a>
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
      <input type="email" bind:value={email} placeholder={t('landing.cta.placeholder', locale)} required />
      <button type="submit" disabled={submitting}>{submitted ? t('landing.cta.done', locale) : submitting ? t('landing.cta.sending', locale) : t('landing.cta', locale)}</button>
    </form>
    <p class="microcopy">{t('landing.microcopy', locale)}</p>
  </section>

  <section id="features" class="features">
    <h2>{t('landing.section.features', locale)}</h2>
    <div class="grid">
      <div class="card">
        <div class="dot"></div>
        <h3>{t('landing.feature.graph.title', locale)}</h3>
        <p>{@html t('landing.feature.graph.desc', locale)}</p>
      </div>
      <div class="card">
        <div class="dot green"></div>
        <h3>{t('landing.feature.editor.title', locale)}</h3>
        <p>{@html t('landing.feature.editor.desc', locale)}</p>
      </div>
      <div class="card">
        <div class="dot"></div>
        <h3>{t('landing.feature.db.title', locale)}</h3>
        <p>{@html t('landing.feature.db.desc', locale)}</p>
      </div>
      <div class="card">
        <div class="dot green"></div>
        <h3>{t('landing.feature.local.title', locale)}</h3>
        <p>{@html t('landing.feature.local.desc', locale)}</p>
      </div>
      <div class="card">
        <div class="dot"></div>
        <h3>{t('landing.feature.api.title', locale)}</h3>
        <p>{@html t('landing.feature.api.desc', locale)}</p>
      </div>
      <div class="card">
        <div class="dot green"></div>
        <h3>{t('landing.feature.webhooks.title', locale)}</h3>
        <p>{@html t('landing.feature.webhooks.desc', locale)}</p>
      </div>
    </div>
  </section>

  <section id="pricing" class="pricing">
    <h2>{t('landing.section.pricing', locale)}</h2>
    <div class="tiers">
      <div class="tier">
        <div class="tier-name">{t('landing.pricing.free.name', locale)}</div>
        <div class="tier-price">{t('landing.pricing.free.price', locale)} <span>{t('landing.pricing.free.period', locale)}</span></div>
        <ul>
          <li>{t('landing.pricing.free.bullet1', locale)}</li>
          <li>{t('landing.pricing.free.bullet2', locale)}</li>
          <li>{t('landing.pricing.free.bullet3', locale)}</li>
        </ul>
      </div>
      <div class="tier accent" data-label={locale === 'en' ? 'RECOMMENDED' : 'แนะนำ'}>
        <div class="tier-name">{t('landing.pricing.pro.name', locale)}</div>
        <div class="tier-price">{t('landing.pricing.pro.price', locale)} <span>{t('landing.pricing.pro.period', locale)}</span></div>
        <ul>
          <li>{t('landing.pricing.pro.bullet1', locale)}</li>
          <li>{t('landing.pricing.pro.bullet2', locale)}</li>
          <li>{t('landing.pricing.pro.bullet3', locale)}</li>
          <li>{t('landing.pricing.pro.bullet4', locale)}</li>
        </ul>
      </div>
      <div class="tier">
        <div class="tier-name">{t('landing.pricing.studio.name', locale)}</div>
        <div class="tier-price">{t('landing.pricing.studio.price', locale)} <span>{t('landing.pricing.studio.period', locale)}</span></div>
        <ul>
          <li>{t('landing.pricing.studio.bullet1', locale)}</li>
          <li>{t('landing.pricing.studio.bullet2', locale)}</li>
          <li>{t('landing.pricing.studio.bullet3', locale)}</li>
        </ul>
      </div>
      <div class="tier">
        <div class="tier-name">{t('landing.pricing.selfhost.name', locale)}</div>
        <div class="tier-price">{t('landing.pricing.selfhost.price', locale)} <span>{t('landing.pricing.selfhost.period', locale)}</span></div>
        <ul>
          <li>{t('landing.pricing.selfhost.bullet1', locale)}</li>
          <li>{t('landing.pricing.selfhost.bullet2', locale)}</li>
          <li>{t('landing.pricing.selfhost.bullet3', locale)}</li>
        </ul>
      </div>
    </div>
  </section>
</main>

<footer>
  <span>{t('landing.footer.copyright', locale)} · <a href="https://github.com/Poohmuhahaha/lifeos/blob/main/docs/quickstart.md">{t('landing.footer.quickstart', locale)}</a> · <a href="https://github.com/Poohmuhahaha/lifeos/blob/main/docs/self-host.md">{t('landing.footer.selfhost', locale)}</a> · <a href="https://github.com/Poohmuhahaha/lifeos/blob/main/docs/api.md">{t('landing.footer.api', locale)}</a> · <a href="https://github.com/Poohmuhahaha/lifeos/blob/main/docs/webhooks.md">{t('landing.footer.webhooks', locale)}</a> · <a href="/privacy">{t('landing.footer.privacy', locale)}</a> · <a href="/terms">{t('landing.footer.terms', locale)}</a></span>
</footer>

<style>
  :global(html) { scroll-behavior: smooth; }
  :global(html, body) { margin: 0; padding: 0; background: #000000; color: #d7e5f0; }
  :global(body) {
    font-family: 'Plus Jakarta Sans', -apple-system, system-ui, sans-serif;
    line-height: 1.6;
    background: radial-gradient(circle at 50% -10%, rgba(201, 173, 147, 0.12) 0%, rgba(0, 0, 0, 0) 50%),
                radial-gradient(circle at 0% 40%, rgba(201, 173, 147, 0.03) 0%, rgba(0, 0, 0, 0) 30%),
                #000000;
  }
  header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 32px; max-width: 1200px; margin: 0 auto;
    position: sticky; top: 0; z-index: 100;
    backdrop-filter: blur(16px);
    background: rgba(0, 0, 0, 0.75);
    border-bottom: 1px solid rgba(115, 120, 124, 0.15);
  }
  .brand {
    font-weight: 800; letter-spacing: -0.03em; font-size: 20px;
    color: #c9ad93;
    display: flex; align-items: center; gap: 8px;
  }
  .brand::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #c9ad93;
    box-shadow: 0 0 8px #c9ad93;
  }
  nav { display: flex; gap: 28px; align-items: center; }
  nav a { color: #c5c6c7; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
  nav a:hover { color: #c9ad93; }
  .lang { display: flex; gap: 2px; padding: 2px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.05); }
  .lang button { background: transparent; border: none; padding: 4px 8px; font-size: 11px; cursor: pointer; border-radius: 6px; color: #73787c; font-weight: 600; transition: all 0.2s; }
  .lang button.active { background: rgba(255, 255, 255, 0.1); color: #c9ad93; }

  main { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
  .hero { text-align: center; padding: 120px 0 80px; position: relative; }
  .hero h1 {
    font-size: clamp(40px, 7vw, 76px); font-weight: 800; letter-spacing: -0.04em; line-height: 1.05; margin: 0 0 24px;
    background: linear-gradient(to bottom right, #ffffff 30%, #c5c6c7 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  }
  .accent {
    color: #c9ad93;
    display: inline-block;
  }
  .lede { font-size: 19px; color: #c5c6c7; max-width: 600px; margin: 0 auto 40px; line-height: 1.7; }
  .waitlist { display: flex; gap: 10px; max-width: 460px; margin: 0 auto; }
  .waitlist input {
    flex: 1; height: 48px; padding: 0 16px;
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(115, 120, 124, 0.15);
    border-radius: 12px; font-size: 14px; color: #fff;
    transition: all 0.3s;
    font-family: inherit;
  }
  .waitlist input:focus {
    outline: none; border-color: #c9ad93;
    background: rgba(255, 255, 255, 0.06);
    box-shadow: 0 0 12px rgba(201, 173, 147, 0.15);
  }
  .waitlist button {
    height: 48px; padding: 0 24px;
    background: #c9ad93;
    color: #000000; border: none; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 2px 8px rgba(201, 173, 147, 0.2);
    font-family: inherit;
  }
  .waitlist button:hover:not(:disabled) {
    transform: translateY(-1px);
    background: #554940;
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(85, 73, 64, 0.35);
  }
  .waitlist button:disabled { opacity: 0.7; cursor: progress; }
  .microcopy { margin-top: 16px; font-size: 12px; color: #73787c; letter-spacing: 0.02em; }

  section { padding: 100px 0; border-top: 1px solid rgba(115, 120, 124, 0.15); }
  h2 { font-size: 36px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 48px; text-align: center; color: #ffffff; }

  .features .grid { display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
  .card {
    background: rgba(255, 255, 255, 0.01);
    border: 1px solid rgba(115, 120, 124, 0.15);
    border-radius: 16px; padding: 28px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .card:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.03);
    border-color: #c9ad93;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }
  .dot { width: 12px; height: 12px; border-radius: 50%; background: #c9ad93; margin-bottom: 18px; box-shadow: 0 0 8px #c9ad93; }
  .dot.green { background: #879a77; box-shadow: 0 0 8px #879a77; }
  .card h3 { margin: 0 0 10px; font-size: 18px; font-weight: 700; color: #ffffff; }
  .card p { margin: 0; color: #c5c6c7; font-size: 14px; line-height: 1.6; }
  :global(.card code) { background: rgba(201, 173, 147, 0.1); color: #c9ad93; padding: 2px 6px; border-radius: 6px; font-size: 12px; border: 1px solid rgba(201, 173, 147, 0.08); }

  .pricing .tiers { display: grid; gap: 20px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
  .tier {
    background: rgba(255, 255, 255, 0.01);
    border: 1px solid rgba(115, 120, 124, 0.15);
    border-radius: 18px; padding: 32px 24px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex; flex-direction: column;
  }
  .tier:hover {
    transform: translateY(-4px);
    border-color: rgba(115, 120, 124, 0.3);
  }
  .tier.accent {
    border-color: #c9ad93;
    background: linear-gradient(to bottom, rgba(201, 173, 147, 0.04), rgba(0, 0, 0, 0.4));
    box-shadow: 0 8px 32px rgba(201, 173, 147, 0.1);
    position: relative;
  }
  .tier.accent::before {
    content: attr(data-label);
    position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
    background: #c9ad93;
    color: #000000; font-size: 9px; font-weight: 800; padding: 4px 10px;
    border-radius: 20px; letter-spacing: 0.08em;
  }
  .tier-name { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #c5c6c7; letter-spacing: 0.08em; }
  .tier-price { font-size: 32px; font-weight: 800; margin: 12px 0 24px; color: #fff; }
  .tier-price span { font-size: 14px; color: #c5c6c7; font-weight: 500; }
  .tier ul { padding: 0; margin: 0 0 24px; list-style: none; flex: 1; }
  .tier li { font-size: 13.5px; padding: 6px 0; color: #d7e5f0; display: flex; align-items: center; gap: 8px; }
  .tier li::before { content: '✓'; color: #879a77; font-weight: bold; }
  .tier.accent li::before { color: #879a77; }

  footer { text-align: center; padding: 48px; font-size: 13px; color: #73787c; border-top: 1px solid rgba(115, 120, 124, 0.15); }
  footer a { color: #c5c6c7; text-decoration: none; transition: color 0.2s; }
  footer a:hover { color: #c9ad93; }
</style>
