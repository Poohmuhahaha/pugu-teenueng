<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { t, detectLocale, setLocale, SUPPORTED_LOCALES, type Locale } from '@lifeos/core';
  import { reveal, staggerChildren, springPress, animate, inView, stagger, prefersReducedMotion, EASING } from '@lifeos/ui/motion';

  let email = '';
  let submitted = false;
  let submitting = false;
  let locale: Locale = 'en';

  let eyebrowEl: HTMLElement;
  let headlineEl: HTMLElement;
  let ledeEl: HTMLElement;
  let bulletsEl: HTMLElement;
  let formEl: HTMLElement;
  let microcopyEl: HTMLElement;
  let heroCtaRowEl: HTMLElement;
  let mockupCardEl: HTMLElement;
  let heroSectionEl: HTMLElement;

  let detachListeners: Array<() => void> = [];

  onMount(() => {
    locale = detectLocale();
    if (prefersReducedMotion()) return;

    startHeroAnimation();
    startMockupLoop();
    startParallax();
  });

  onDestroy(() => {
    for (const off of detachListeners) off();
    detachListeners = [];
  });

  // === Dramatic hero entrance ===
  // Headline animates word-by-word with rotation + y; subsequent rows fade in with
  // tight gaps. The mockup card tilts in from the right with perspective + 3D rotation
  // before settling.
  function startHeroAnimation(): void {
    // Word-wrap the headline so we can animate each word independently.
    if (headlineEl) {
      const text = headlineEl.textContent ?? '';
      // Preserve the `.accent` span by splitting on the rendered children.
      const original = headlineEl.innerHTML;
      const splitHTML = splitIntoWords(original);
      headlineEl.innerHTML = splitHTML;
      const words = Array.from(headlineEl.querySelectorAll('.hero-word')) as HTMLElement[];
      // Set starting state immediately so there's no flash of un-animated text.
      for (const w of words) {
        w.style.opacity = '0';
        w.style.transform = 'translateY(48px) rotate(-2deg)';
        w.style.willChange = 'opacity, transform';
      }
      animate(
        words,
        { opacity: [0, 1], transform: ['translateY(48px) rotate(-2deg)', 'translateY(0) rotate(0)'] },
        { duration: 0.85, easing: EASING.entrance, delay: stagger(0.06, { start: 0.05 }) },
      ).finished.then(() => {
        for (const w of words) w.style.willChange = '';
      });
      void text;
    }

    // The supporting copy below the headline — eyebrow, lede, bullets, form,
    // microcopy + cta-row — comes in after the headline finishes, faster + tighter.
    const supportTargets = [eyebrowEl, ledeEl, bulletsEl, formEl, microcopyEl, heroCtaRowEl].filter(Boolean) as HTMLElement[];
    if (supportTargets.length) {
      for (const el of supportTargets) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.willChange = 'opacity, transform';
      }
      animate(
        supportTargets,
        { opacity: [0, 1], transform: ['translateY(20px)', 'translateY(0)'] },
        { duration: 0.55, easing: EASING.entrance, delay: stagger(0.07, { start: 0.45 }) },
      ).finished.then(() => {
        for (const el of supportTargets) el.style.willChange = '';
      });
    }

    // Mockup card: starts off-screen-right with perspective tilt, swings into place.
    if (mockupCardEl) {
      mockupCardEl.style.opacity = '0';
      mockupCardEl.style.transformStyle = 'preserve-3d';
      mockupCardEl.style.transform = 'perspective(1200px) translate3d(80px, 30px, -60px) rotateY(-18deg) rotateX(6deg)';
      mockupCardEl.style.willChange = 'opacity, transform';
      animate(
        mockupCardEl,
        {
          opacity: [0, 1],
          transform: [
            'perspective(1200px) translate3d(80px, 30px, -60px) rotateY(-18deg) rotateX(6deg)',
            'perspective(1200px) translate3d(0, 0, 0) rotateY(0) rotateX(0)',
          ],
        },
        { duration: 1.1, easing: EASING.entrance, delay: 0.35 },
      ).finished.then(() => {
        mockupCardEl.style.willChange = '';
        mockupCardEl.style.transform = '';
      });

      // Internal mockup content also staggers in slightly behind the card.
      const innerRows = mockupCardEl.querySelectorAll('.mock-row, .mock-block .badge') as NodeListOf<HTMLElement>;
      for (const r of innerRows) {
        r.style.opacity = '0';
        r.style.transform = 'translateY(10px)';
      }
      animate(
        Array.from(innerRows),
        { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0)'] },
        { duration: 0.4, easing: EASING.entrance, delay: stagger(0.05, { start: 0.85 }) },
      );
    }
  }

  function splitIntoWords(html: string): string {
    // Wraps each visible word in a <span class="hero-word"> while preserving
    // nested elements (.accent span). Simple state-machine walk over the HTML.
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const root = doc.body.firstElementChild as HTMLElement;
    const out: string[] = [];
    function walk(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const words = (node.textContent ?? '').split(/(\s+)/);
        for (const w of words) {
          if (!w) continue;
          if (/^\s+$/.test(w)) { out.push(w); continue; }
          out.push(`<span class="hero-word" style="display:inline-block;will-change:opacity,transform">${escapeHtml(w)}</span>`);
        }
        return;
      }
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        const attrs = Array.from(el.attributes).map((a) => `${a.name}="${escapeHtml(a.value)}"`).join(' ');
        out.push(`<${tag}${attrs ? ' ' + attrs : ''}>`);
        for (const child of Array.from(el.childNodes)) walk(child);
        out.push(`</${tag}>`);
      }
    }
    for (const child of Array.from(root.childNodes)) walk(child);
    return out.join('');
  }

  function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, (c) =>
      c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
    );
  }

  // === Mockup loop — stronger pulses ===
  function startMockupLoop(): void {
    let cancelled = false;
    const tick = async () => {
      while (!cancelled) {
        await new Promise((r) => setTimeout(r, 2400));
        if (cancelled || !mockupCardEl) return;
        const checks = mockupCardEl.querySelectorAll('.mock-line:not(.done) .check');
        const badges = mockupCardEl.querySelectorAll('.mock-block .badge');
        if (badges.length) {
          const target = badges[Math.floor(Math.random() * badges.length)] as HTMLElement;
          animate(
            target,
            { transform: ['scale(1) rotate(0)', 'scale(1.25) rotate(-4deg)', 'scale(1) rotate(0)'] },
            { duration: 0.7, easing: EASING.spring },
          );
        }
        if (checks.length) {
          const c = checks[Math.floor(Math.random() * checks.length)] as HTMLElement;
          animate(
            c,
            { transform: ['scale(1)', 'scale(1.3)', 'scale(1)'] },
            { duration: 0.55, easing: EASING.spring },
          );
        }
      }
    };
    void tick();
    const onVis = () => { if (document.hidden) cancelled = true; else { cancelled = false; void tick(); } };
    document.addEventListener('visibilitychange', onVis);
    detachListeners.push(() => { cancelled = true; document.removeEventListener('visibilitychange', onVis); });
  }

  // === Scroll-linked parallax on the mockup card ===
  // As the user scrolls past the hero, the mockup floats upward slightly faster
  // than the page (creates depth between copy and card). Pure transform; off
  // when reduced-motion or when card is offscreen.
  function startParallax(): void {
    if (!mockupCardEl || !heroSectionEl) return;
    let ticking = false;
    const apply = () => {
      const rect = heroSectionEl.getBoundingClientRect();
      // Only run while the hero is still in viewport range
      if (rect.bottom < -200 || rect.top > window.innerHeight) {
        ticking = false;
        return;
      }
      const progress = -rect.top / window.innerHeight; // 0 at top, grows as we scroll
      const y = Math.max(-80, Math.min(0, -progress * 60));
      mockupCardEl.style.transform = `translateY(${y}px)`;
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    detachListeners.push(() => window.removeEventListener('scroll', onScroll));
  }

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

<header class="top-nav">
  <div class="nav-inner">
    <a class="brand" href="/">
      <span class="brand-dot"></span>
      LifeOS
    </a>
    <nav class="nav-links">
      <a href="#features">{t('nav.features', locale)}</a>
      <a href="#pricing">{t('nav.pricing', locale)}</a>
      <a href="/docs/">Docs</a>
      <a href="https://github.com/Poohmuhahaha/lifeos">{t('nav.github', locale)}</a>
    </nav>
    <div class="nav-right">
      <div class="nav-pill-group" role="tablist" aria-label="Language">
        {#each SUPPORTED_LOCALES as l}
          <button
            class="pill-tab"
            class:active={locale === l}
            role="tab"
            aria-selected={locale === l}
            on:click={() => switchLocale(l)}
          >{l.toUpperCase()}</button>
        {/each}
      </div>
    </div>
  </div>
</header>

<main>
  <section class="hero" bind:this={heroSectionEl}>
    <div class="hero-grid">
      <div class="hero-copy">
        <span class="eyebrow" bind:this={eyebrowEl}>{t('landing.eyebrow', locale)}</span>
        <h1 bind:this={headlineEl}>
          {t('landing.headline.left', locale)} <span class="accent">{t('landing.headline.right', locale)}</span>
        </h1>
        <p class="lede" bind:this={ledeEl}>{t('landing.lede', locale)}</p>
        <ul class="hero-bullets" bind:this={bulletsEl}>
          <li>{t('landing.hero.bullet.1', locale)}</li>
          <li>{t('landing.hero.bullet.2', locale)}</li>
          <li>{t('landing.hero.bullet.3', locale)}</li>
        </ul>
        <form class="waitlist" on:submit|preventDefault={joinWaitlist} bind:this={formEl}>
          <input
            class="text-input"
            type="email"
            bind:value={email}
            placeholder={t('landing.cta.placeholder', locale)}
            required
          />
          <button class="button-primary" type="submit" disabled={submitting} use:springPress>
            {submitted
              ? t('landing.cta.done', locale)
              : submitting
              ? t('landing.cta.sending', locale)
              : t('landing.cta', locale)}
          </button>
        </form>
        <p class="microcopy" bind:this={microcopyEl}>{t('landing.microcopy', locale)}</p>
        <div class="hero-cta-row" bind:this={heroCtaRowEl}>
          <a class="text-link" href="https://github.com/Poohmuhahaha/lifeos" target="_blank" rel="noopener">★ {t('landing.cta.secondary', locale)}</a>
        </div>
      </div>
      <div class="hero-mockup" aria-hidden="true">
        <div class="mockup-card" bind:this={mockupCardEl} style="opacity:0">
          <div class="mockup-head">
            <span class="dot-r"></span><span class="dot-y"></span><span class="dot-g"></span>
            <span class="mockup-title">today.md</span>
          </div>
          <div class="mockup-body">
            <div class="mock-row mock-h">Daily note</div>
            <div class="mock-row mock-line"><span class="check"></span>Ship landing page</div>
            <div class="mock-row mock-line done"><span class="check on"></span>Wire waitlist API</div>
            <div class="mock-row mock-line"><span class="check"></span>Review PR <span class="mock-link">#42</span></div>
            <div class="mock-block">
              <span class="badge badge-violet">graph</span>
              <span class="badge badge-orange">editor</span>
              <span class="badge badge-emerald">api</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="trust-band" aria-labelledby="trust-head">
    <h2 class="trust-head" id="trust-head" use:reveal>{t('landing.section.trust', locale)}</h2>
    <div class="trust-grid">
      <div class="trust-item" use:reveal={{ delay: 0.0 }}>
        <span class="trust-icon" aria-hidden="true">⌘</span>
        <div>
          <h3>{t('landing.trust.opensource.title', locale)}</h3>
          <p>{t('landing.trust.opensource.desc', locale)}</p>
        </div>
      </div>
      <div class="trust-item" use:reveal={{ delay: 0.08 }}>
        <span class="trust-icon" aria-hidden="true">▣</span>
        <div>
          <h3>{t('landing.trust.selfhost.title', locale)}</h3>
          <p>{t('landing.trust.selfhost.desc', locale)}</p>
        </div>
      </div>
      <div class="trust-item" use:reveal={{ delay: 0.16 }}>
        <span class="trust-icon" aria-hidden="true">⊕</span>
        <div>
          <h3>{t('landing.trust.e2ee.title', locale)}</h3>
          <p>{t('landing.trust.e2ee.desc', locale)}</p>
        </div>
      </div>
      <div class="trust-item" use:reveal={{ delay: 0.24 }}>
        <span class="trust-icon" aria-hidden="true">{'</>'}</span>
        <div>
          <h3>{t('landing.trust.api.title', locale)}</h3>
          <p>{t('landing.trust.api.desc', locale)}</p>
        </div>
      </div>
    </div>
  </section>

  <section id="features" class="features">
    <div class="section-head">
      <h2>{t('landing.section.features', locale)}</h2>
    </div>
    <div class="grid">
      <div class="feature-card" use:reveal={{ y: 24 }}>
        <span class="feature-icon icon-graph" aria-hidden="true"></span>
        <h3>{t('landing.feature.graph.title', locale)}</h3>
        <p>{@html t('landing.feature.graph.desc', locale)}</p>
      </div>
      <div class="feature-card" use:reveal={{ y: 24 }}>
        <span class="feature-icon icon-editor" aria-hidden="true"></span>
        <h3>{t('landing.feature.editor.title', locale)}</h3>
        <p>{@html t('landing.feature.editor.desc', locale)}</p>
      </div>
      <div class="feature-card" use:reveal={{ y: 24 }}>
        <span class="feature-icon icon-db" aria-hidden="true"></span>
        <h3>{t('landing.feature.db.title', locale)}</h3>
        <p>{@html t('landing.feature.db.desc', locale)}</p>
      </div>
      <div class="feature-card" use:reveal={{ y: 24 }}>
        <span class="feature-icon icon-local" aria-hidden="true"></span>
        <h3>{t('landing.feature.local.title', locale)}</h3>
        <p>{@html t('landing.feature.local.desc', locale)}</p>
      </div>
      <div class="feature-card" use:reveal={{ y: 24 }}>
        <span class="feature-icon icon-api" aria-hidden="true"></span>
        <h3>{t('landing.feature.api.title', locale)}</h3>
        <p>{@html t('landing.feature.api.desc', locale)}</p>
      </div>
      <div class="feature-card" use:reveal={{ y: 24 }}>
        <span class="feature-icon icon-webhooks" aria-hidden="true"></span>
        <h3>{t('landing.feature.webhooks.title', locale)}</h3>
        <p>{@html t('landing.feature.webhooks.desc', locale)}</p>
      </div>
    </div>
  </section>

  <section class="who-section">
    <div class="section-head">
      <h2>{t('landing.section.who', locale)}</h2>
    </div>
    <div class="grid">
      <article class="who-card" use:reveal={{ y: 30 }}>
        <div class="who-tag">01</div>
        <h3>{t('landing.who.kw.title', locale)}</h3>
        <p>{t('landing.who.kw.desc', locale)}</p>
      </article>
      <article class="who-card" use:reveal={{ y: 30 }}>
        <div class="who-tag">02</div>
        <h3>{t('landing.who.indie.title', locale)}</h3>
        <p>{t('landing.who.indie.desc', locale)}</p>
      </article>
      <article class="who-card" use:reveal={{ y: 30 }}>
        <div class="who-tag">03</div>
        <h3>{t('landing.who.team.title', locale)}</h3>
        <p>{t('landing.who.team.desc', locale)}</p>
      </article>
    </div>
  </section>

  <section class="how-section">
    <div class="section-head">
      <h2>{t('landing.section.how', locale)}</h2>
    </div>
    <ol class="how-steps">
      <li use:reveal={{ delay: 0.0, y: 24 }}>
        <span class="step-num">1</span>
        <div>
          <h3>{t('landing.how.step1.title', locale)}</h3>
          <p>{t('landing.how.step1.desc', locale)}</p>
        </div>
      </li>
      <li use:reveal={{ delay: 0.1, y: 24 }}>
        <span class="step-num">2</span>
        <div>
          <h3>{t('landing.how.step2.title', locale)}</h3>
          <p>{t('landing.how.step2.desc', locale)}</p>
        </div>
      </li>
      <li use:reveal={{ delay: 0.2, y: 24 }}>
        <span class="step-num">3</span>
        <div>
          <h3>{t('landing.how.step3.title', locale)}</h3>
          <p>{t('landing.how.step3.desc', locale)}</p>
        </div>
      </li>
    </ol>
  </section>

  <section id="pricing" class="pricing">
    <div class="section-head">
      <h2>{t('landing.section.pricing', locale)}</h2>
    </div>
    <div class="tiers">
      <div class="pricing-tier-card" use:reveal={{ y: 28 }}>
        <div class="tier-name">{t('landing.pricing.free.name', locale)}</div>
        <div class="tier-price">{t('landing.pricing.free.price', locale)} <span>{t('landing.pricing.free.period', locale)}</span></div>
        <ul>
          <li>{t('landing.pricing.free.bullet1', locale)}</li>
          <li>{t('landing.pricing.free.bullet2', locale)}</li>
          <li>{t('landing.pricing.free.bullet3', locale)}</li>
        </ul>
        <a class="button-secondary" href="https://github.com/Poohmuhahaha/lifeos">Get started</a>
      </div>
      <div class="pricing-tier-card featured" use:reveal={{ y: 28, scale: 0.96 }}>
        <span class="featured-badge">{locale === 'en' ? 'RECOMMENDED' : 'แนะนำ'}</span>
        <div class="tier-name">{t('landing.pricing.pro.name', locale)}</div>
        <div class="tier-price">{t('landing.pricing.pro.price', locale)} <span>{t('landing.pricing.pro.period', locale)}</span></div>
        <ul>
          <li>{t('landing.pricing.pro.bullet1', locale)}</li>
          <li>{t('landing.pricing.pro.bullet2', locale)}</li>
          <li>{t('landing.pricing.pro.bullet3', locale)}</li>
          <li>{t('landing.pricing.pro.bullet4', locale)}</li>
        </ul>
        <a class="button-primary on-dark" href="#top">Join waitlist</a>
      </div>
      <div class="pricing-tier-card" use:reveal={{ y: 28 }}>
        <div class="tier-name">{t('landing.pricing.studio.name', locale)}</div>
        <div class="tier-price">{t('landing.pricing.studio.price', locale)} <span>{t('landing.pricing.studio.period', locale)}</span></div>
        <ul>
          <li>{t('landing.pricing.studio.bullet1', locale)}</li>
          <li>{t('landing.pricing.studio.bullet2', locale)}</li>
          <li>{t('landing.pricing.studio.bullet3', locale)}</li>
        </ul>
        <a class="button-secondary" href="#top">Contact us</a>
      </div>
      <div class="pricing-tier-card" use:reveal={{ y: 28 }}>
        <div class="tier-name">{t('landing.pricing.selfhost.name', locale)}</div>
        <div class="tier-price">{t('landing.pricing.selfhost.price', locale)} <span>{t('landing.pricing.selfhost.period', locale)}</span></div>
        <ul>
          <li>{t('landing.pricing.selfhost.bullet1', locale)}</li>
          <li>{t('landing.pricing.selfhost.bullet2', locale)}</li>
          <li>{t('landing.pricing.selfhost.bullet3', locale)}</li>
        </ul>
        <a class="button-secondary" href="/docs/self-host">Read docs</a>
      </div>
    </div>
  </section>

  <section id="faq" class="faq-section">
    <div class="section-head">
      <h2>{t('landing.section.faq', locale)}</h2>
    </div>
    <div class="faq-list">
      <details class="faq-item" use:reveal={{ y: 12, duration: 0.3 }}>
        <summary>{t('landing.faq.q1', locale)}</summary>
        <p>{t('landing.faq.a1', locale)}</p>
      </details>
      <details class="faq-item" use:reveal={{ y: 12, duration: 0.3 }}>
        <summary>{t('landing.faq.q2', locale)}</summary>
        <p>{t('landing.faq.a2', locale)}</p>
      </details>
      <details class="faq-item" use:reveal={{ y: 12, duration: 0.3 }}>
        <summary>{t('landing.faq.q3', locale)}</summary>
        <p>{t('landing.faq.a3', locale)}</p>
      </details>
      <details class="faq-item" use:reveal={{ y: 12, duration: 0.3 }}>
        <summary>{t('landing.faq.q4', locale)}</summary>
        <p>{t('landing.faq.a4', locale)}</p>
      </details>
      <details class="faq-item" use:reveal={{ y: 12, duration: 0.3 }}>
        <summary>{t('landing.faq.q5', locale)}</summary>
        <p>{t('landing.faq.a5', locale)}</p>
      </details>
    </div>
  </section>

  <section class="cta-band">
    <div class="cta-card">
      <h2>{locale === 'en' ? 'Smarter, simpler ownership of your data.' : 'การเป็นเจ้าของข้อมูลที่ง่ายและฉลาดกว่า'}</h2>
      <p>{locale === 'en' ? 'Self-host on your own box, or use the cloud when you want zero ops. Either way, the data is yours.' : 'โฮสต์บนเซิร์ฟเวอร์ของคุณเอง หรือใช้คลาวด์ของเรา ข้อมูลเป็นของคุณเสมอ'}</p>
      <a class="button-primary" href="#top">{t('landing.cta', locale)}</a>
    </div>
  </section>
</main>

<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-brand">
      <a class="brand brand-light" href="/">
        <span class="brand-dot light"></span>
        LifeOS
      </a>
      <p class="footer-tag">Headless productivity OS. Self-host or cloud.</p>
    </div>
    <div class="footer-cols">
      <div class="footer-col">
        <h4>Product</h4>
        <a href="#features">{t('nav.features', locale)}</a>
        <a href="#pricing">{t('nav.pricing', locale)}</a>
        <a href="https://github.com/Poohmuhahaha/lifeos">{t('nav.github', locale)}</a>
      </div>
      <div class="footer-col">
        <h4>Docs</h4>
        <a href="/docs/quickstart">{t('landing.footer.quickstart', locale)}</a>
        <a href="/docs/self-host">{t('landing.footer.selfhost', locale)}</a>
        <a href="/docs/api">{t('landing.footer.api', locale)}</a>
        <a href="/docs/webhooks">{t('landing.footer.webhooks', locale)}</a>
      </div>
      <div class="footer-col">
        <h4>Legal</h4>
        <a href="/privacy">{t('landing.footer.privacy', locale)}</a>
        <a href="/terms">{t('landing.footer.terms', locale)}</a>
      </div>
    </div>
  </div>
  <div class="footer-bottom">
    <span>{t('landing.footer.copyright', locale)}</span>
  </div>
</footer>

<style>
  /* === Cal.com-inspired design tokens === */
  :global(:root) {
    --c-primary: #111111;
    --c-primary-active: #242424;
    --c-ink: #111111;
    --c-body: #374151;
    --c-muted: #6b7280;
    --c-muted-soft: #898989;
    --c-hairline: #e5e7eb;
    --c-hairline-soft: #f3f4f6;
    --c-canvas: #ffffff;
    --c-surface-soft: #f8f9fa;
    --c-surface-card: #f5f5f5;
    --c-surface-dark: #101010;
    --c-surface-dark-elev: #1a1a1a;
    --c-on-dark: #ffffff;
    --c-on-dark-soft: #a1a1aa;
    --c-brand-accent: #3b82f6;
    --c-badge-orange: #fb923c;
    --c-badge-pink: #ec4899;
    --c-badge-violet: #8b5cf6;
    --c-badge-emerald: #34d399;

    --r-md: 8px;
    --r-lg: 12px;
    --r-xl: 16px;
    --r-pill: 9999px;

    --s-xs: 8px;
    --s-sm: 12px;
    --s-md: 16px;
    --s-lg: 24px;
    --s-xl: 32px;
    --s-xxl: 48px;
    --s-section: 96px;

    --font-display: 'Cal Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  }

  :global(html) { scroll-behavior: smooth; }
  :global(html, body) { margin: 0; padding: 0; background: var(--c-canvas); color: var(--c-body); }
  :global(body) {
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  :global(*) { box-sizing: border-box; }

  /* === Top nav === */
  .top-nav {
    position: sticky; top: 0; z-index: 100;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: saturate(180%) blur(12px);
    -webkit-backdrop-filter: saturate(180%) blur(12px);
    border-bottom: 1px solid var(--c-hairline-soft);
  }
  .nav-inner {
    max-width: 1200px; margin: 0 auto;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 var(--s-xl); height: 64px;
  }
  .brand {
    font-family: var(--font-display);
    font-weight: 600; letter-spacing: -0.04em; font-size: 20px;
    color: var(--c-ink);
    display: inline-flex; align-items: center; gap: 8px;
    text-decoration: none;
  }
  .brand-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--c-ink);
  }
  .nav-links { display: flex; gap: 28px; align-items: center; }
  .nav-links a {
    color: var(--c-body); text-decoration: none;
    font-size: 14px; font-weight: 500; line-height: 1.4;
    transition: color 0.15s;
  }
  .nav-links a:hover { color: var(--c-ink); }
  .nav-right { display: flex; align-items: center; gap: var(--s-md); }

  /* nav-pill-group: pill-in-pill */
  .nav-pill-group {
    display: inline-flex; padding: 4px;
    background: var(--c-surface-soft);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-pill);
    gap: 2px;
  }
  .pill-tab {
    background: transparent; border: none; cursor: pointer;
    padding: 6px 12px; font-size: 12px; font-weight: 600;
    color: var(--c-muted);
    border-radius: var(--r-pill);
    font-family: inherit;
    transition: color 0.15s, background 0.15s, box-shadow 0.15s;
  }
  .pill-tab:hover { color: var(--c-ink); }
  .pill-tab.active {
    background: var(--c-canvas);
    color: var(--c-ink);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06), 0 1px 1px rgba(0, 0, 0, 0.04);
  }

  /* === Layout === */
  main { max-width: 1200px; margin: 0 auto; padding: 0 var(--s-xl); }

  section { padding: var(--s-section) 0; }
  section + section { border-top: 1px solid var(--c-hairline-soft); }

  .section-head { margin-bottom: var(--s-xxl); text-align: left; max-width: 720px; }

  h2 {
    font-family: var(--font-display);
    font-size: 48px; font-weight: 600; line-height: 1.1;
    letter-spacing: -1.5px;
    margin: 0;
    color: var(--c-ink);
  }
  h3 {
    font-family: var(--font-body);
    font-size: 18px; font-weight: 600; line-height: 1.4;
    margin: 0;
    color: var(--c-ink);
  }

  /* === Hero === */
  .hero { padding: var(--s-section) 0 var(--s-xxl); border-top: none; }
  .hero-grid {
    display: grid;
    grid-template-columns: 7fr 5fr;
    gap: var(--s-xxl);
    align-items: center;
  }
  .eyebrow {
    display: inline-block;
    font-size: 13px; font-weight: 500; letter-spacing: 0;
    color: var(--c-muted);
    padding: 4px 12px;
    background: var(--c-surface-card);
    border-radius: var(--r-pill);
    margin-bottom: var(--s-lg);
  }
  .hero h1 {
    font-family: var(--font-display);
    font-size: clamp(40px, 6.5vw, 64px);
    font-weight: 600; line-height: 1.05;
    letter-spacing: -2px;
    margin: 0 0 var(--s-lg);
    color: var(--c-ink);
  }
  .accent { color: var(--c-ink); }
  .lede {
    font-size: 18px; line-height: 1.55;
    color: var(--c-body);
    max-width: 540px;
    margin: 0 0 var(--s-xl);
  }
  .waitlist {
    display: flex; gap: var(--s-sm);
    max-width: 460px;
  }
  .text-input {
    flex: 1; height: 44px;
    padding: 0 14px;
    background: var(--c-canvas);
    color: var(--c-ink);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-md);
    font-size: 15px;
    font-family: inherit;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .text-input::placeholder { color: var(--c-muted); }
  .text-input:focus {
    outline: none;
    border-color: var(--c-ink);
    box-shadow: 0 0 0 3px rgba(17, 17, 17, 0.08);
  }
  .button-primary {
    display: inline-flex; align-items: center; justify-content: center;
    height: 44px; padding: 0 20px;
    background: var(--c-primary);
    color: var(--c-on-dark);
    border: 1px solid var(--c-primary);
    border-radius: var(--r-md);
    font-size: 14px; font-weight: 600; line-height: 1;
    font-family: inherit;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.15s, transform 0.05s;
  }
  .button-primary:active { background: var(--c-primary-active); transform: translateY(1px); }
  .button-primary:disabled { opacity: 0.7; cursor: progress; }
  .button-primary.on-dark { background: var(--c-canvas); color: var(--c-ink); border-color: var(--c-canvas); }
  .button-primary.on-dark:active { background: #f0f0f0; }
  .button-secondary {
    display: inline-flex; align-items: center; justify-content: center;
    height: 44px; padding: 0 20px;
    background: var(--c-canvas);
    color: var(--c-ink);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-md);
    font-size: 14px; font-weight: 600; line-height: 1;
    font-family: inherit;
    text-decoration: none;
    cursor: pointer;
    transition: border-color 0.15s;
  }
  .button-secondary:hover { border-color: var(--c-ink); }
  .microcopy {
    margin: var(--s-sm) 0 0;
    font-size: 13px;
    color: var(--c-muted-soft);
  }

  /* === Hero mockup card === */
  .hero-mockup { display: flex; justify-content: center; }
  .mockup-card {
    width: 100%;
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-xl);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04), 0 12px 32px rgba(0, 0, 0, 0.06);
    overflow: hidden;
  }
  .mockup-head {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 14px;
    background: var(--c-surface-soft);
    border-bottom: 1px solid var(--c-hairline-soft);
  }
  .mockup-head .dot-r, .mockup-head .dot-y, .mockup-head .dot-g {
    width: 10px; height: 10px; border-radius: 50%;
  }
  .dot-r { background: #ff605c; }
  .dot-y { background: #ffbd44; }
  .dot-g { background: #00ca4e; }
  .mockup-title {
    margin-left: 8px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--c-muted);
  }
  .mockup-body { padding: var(--s-lg); display: flex; flex-direction: column; gap: 10px; }
  .mock-row { font-size: 14px; line-height: 1.4; }
  .mock-h {
    font-family: var(--font-display);
    font-weight: 600; font-size: 18px; letter-spacing: -0.3px;
    color: var(--c-ink);
    margin-bottom: 4px;
  }
  .mock-line {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 0;
    color: var(--c-body);
    border-bottom: 1px solid var(--c-hairline-soft);
  }
  .mock-line:last-of-type { border-bottom: none; }
  .check {
    flex: none;
    width: 16px; height: 16px;
    border: 1.5px solid var(--c-hairline);
    border-radius: 4px;
    background: var(--c-canvas);
    position: relative;
  }
  .check.on {
    background: var(--c-primary);
    border-color: var(--c-primary);
  }
  .check.on::after {
    content: '';
    position: absolute; left: 4px; top: 1px;
    width: 4px; height: 8px;
    border-right: 1.5px solid #fff;
    border-bottom: 1.5px solid #fff;
    transform: rotate(45deg);
  }
  .mock-line.done { color: var(--c-muted); text-decoration: line-through; }
  .mock-link { color: var(--c-brand-accent); }
  .mock-block { display: flex; gap: 6px; margin-top: 6px; }
  .badge {
    display: inline-block;
    padding: 3px 10px;
    font-size: 12px; font-weight: 500;
    border-radius: var(--r-pill);
    color: var(--c-ink);
  }
  .badge-violet { background: rgba(139, 92, 246, 0.15); color: var(--c-badge-violet); }
  .badge-orange { background: rgba(251, 146, 60, 0.15); color: var(--c-badge-orange); }
  .badge-emerald { background: rgba(52, 211, 153, 0.2); color: #059669; }

  /* === Features grid === */
  .features .grid {
    display: grid;
    gap: var(--s-lg);
    grid-template-columns: repeat(3, 1fr);
  }
  .feature-card {
    background: var(--c-surface-card);
    border-radius: var(--r-lg);
    padding: var(--s-xl);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .feature-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }
  .feature-icon {
    display: inline-flex; align-items: center; justify-content: center;
    width: 36px; height: 36px;
    background: var(--c-canvas);
    border-radius: var(--r-md);
    margin-bottom: var(--s-md);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    position: relative;
  }
  .feature-icon::before {
    content: '';
    width: 16px; height: 16px;
    border-radius: 4px;
  }
  .icon-graph::before { background: var(--c-badge-violet); }
  .icon-editor::before { background: var(--c-badge-orange); }
  .icon-db::before { background: var(--c-badge-emerald); }
  .icon-local::before { background: var(--c-badge-pink); }
  .icon-api::before { background: var(--c-primary); }
  .icon-webhooks::before { background: var(--c-brand-accent); }
  .feature-card h3 { margin: 0 0 var(--s-xs); }
  .feature-card p { margin: 0; color: var(--c-body); font-size: 15px; line-height: 1.55; }
  :global(.feature-card code) {
    font-family: var(--font-mono);
    background: var(--c-canvas);
    color: var(--c-ink);
    padding: 1px 6px;
    border-radius: 4px;
    font-size: 13px;
    border: 1px solid var(--c-hairline);
  }

  /* === Pricing === */
  .pricing .tiers {
    display: grid;
    gap: var(--s-lg);
    grid-template-columns: repeat(4, 1fr);
  }
  .pricing-tier-card {
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-lg);
    padding: var(--s-xl);
    display: flex; flex-direction: column;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }
  .pricing-tier-card.featured {
    background: var(--c-surface-dark);
    border-color: var(--c-surface-dark);
    color: var(--c-on-dark);
    position: relative;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.12);
  }
  .featured-badge {
    position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
    background: var(--c-canvas);
    color: var(--c-ink);
    font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
    padding: 4px 12px;
    border-radius: var(--r-pill);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }
  .tier-name {
    font-size: 14px; font-weight: 600;
    color: var(--c-muted);
    letter-spacing: 0;
    text-transform: none;
  }
  .pricing-tier-card.featured .tier-name { color: var(--c-on-dark-soft); }
  .tier-price {
    font-family: var(--font-display);
    font-size: 36px; font-weight: 600; line-height: 1.15;
    letter-spacing: -1px;
    margin: var(--s-xs) 0 var(--s-lg);
    color: var(--c-ink);
  }
  .pricing-tier-card.featured .tier-price { color: var(--c-on-dark); }
  .tier-price span {
    font-family: var(--font-body);
    font-size: 14px; font-weight: 500;
    color: var(--c-muted);
    letter-spacing: 0;
  }
  .pricing-tier-card.featured .tier-price span { color: var(--c-on-dark-soft); }
  .pricing-tier-card ul {
    padding: 0; margin: 0 0 var(--s-lg);
    list-style: none;
    flex: 1;
    display: flex; flex-direction: column; gap: 8px;
  }
  .pricing-tier-card li {
    font-size: 14px; line-height: 1.5;
    color: var(--c-body);
    display: flex; align-items: flex-start; gap: 10px;
  }
  .pricing-tier-card.featured li { color: var(--c-on-dark-soft); }
  .pricing-tier-card li::before {
    content: '';
    flex: none;
    width: 16px; height: 16px;
    margin-top: 2px;
    border-radius: 50%;
    background: var(--c-surface-card) url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path fill='none' stroke='%23111111' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' d='M3.5 8.5l3 3 6-7'/></svg>") center / 12px 12px no-repeat;
  }
  .pricing-tier-card.featured li::before {
    background: var(--c-surface-dark-elev) url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path fill='none' stroke='%23ffffff' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' d='M3.5 8.5l3 3 6-7'/></svg>") center / 12px 12px no-repeat;
  }

  /* === Pre-footer CTA band === */
  .cta-band { border-top: none; padding-top: 0; }
  .cta-card {
    background: var(--c-surface-card);
    border-radius: var(--r-lg);
    padding: var(--s-xxl) var(--s-xl);
    text-align: center;
  }
  .cta-card h2 {
    font-size: 28px;
    letter-spacing: -0.5px;
    line-height: 1.2;
    margin: 0 0 var(--s-sm);
  }
  .cta-card p {
    font-size: 16px;
    color: var(--c-body);
    margin: 0 0 var(--s-lg);
  }

  /* === Footer === */
  .site-footer {
    background: var(--c-surface-dark);
    color: var(--c-on-dark-soft);
    margin-top: var(--s-section);
  }
  .footer-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 64px var(--s-xl) var(--s-xl);
    display: grid;
    grid-template-columns: 1.2fr 2fr;
    gap: var(--s-xxl);
  }
  .footer-brand .brand-light { color: var(--c-on-dark); }
  .footer-brand .brand-dot.light { background: var(--c-on-dark); }
  .footer-tag {
    margin: var(--s-sm) 0 0;
    font-size: 14px;
    color: var(--c-on-dark-soft);
    max-width: 280px;
  }
  .footer-cols {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--s-lg);
  }
  .footer-col h4 {
    font-size: 13px; font-weight: 600;
    color: var(--c-on-dark);
    margin: 0 0 var(--s-md);
    letter-spacing: 0;
  }
  .footer-col a {
    display: block;
    color: var(--c-on-dark-soft);
    text-decoration: none;
    font-size: 14px;
    padding: 4px 0;
    transition: color 0.15s;
  }
  .footer-col a:hover { color: var(--c-on-dark); }
  .footer-bottom {
    border-top: 1px solid var(--c-surface-dark-elev);
    padding: var(--s-lg) var(--s-xl);
    text-align: center;
    font-size: 13px;
    color: var(--c-on-dark-soft);
    max-width: 1200px;
    margin: 0 auto;
  }

  /* === Responsive === */
  @media (max-width: 1024px) {
    .pricing .tiers { grid-template-columns: repeat(2, 1fr); }
    .features .grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 768px) {
    section { padding: 72px 0; }
    .hero { padding: 56px 0; }
    .hero-grid { grid-template-columns: 1fr; gap: var(--s-xl); }
    .hero h1 { font-size: 40px; letter-spacing: -1.2px; }
    h2 { font-size: 32px; letter-spacing: -1px; }
    .nav-links { display: none; }
    .nav-inner { padding: 0 var(--s-md); }
    main { padding: 0 var(--s-md); }
    .features .grid { grid-template-columns: 1fr; }
    .pricing .tiers { grid-template-columns: 1fr; }
    .waitlist { flex-direction: column; }
    .waitlist .button-primary { width: 100%; }
    .footer-inner { grid-template-columns: 1fr; padding: 48px var(--s-md) var(--s-md); }
    .footer-cols { grid-template-columns: repeat(2, 1fr); }
    .trust-grid, .how-steps { grid-template-columns: 1fr !important; }
    .who-section .grid { grid-template-columns: 1fr; }
  }

  /* ===== Hero bullets ===== */
  .hero-bullets {
    list-style: none;
    padding: 0;
    margin: var(--s-md) 0 var(--s-lg);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .hero-bullets li {
    font-size: 15px;
    color: var(--c-body);
    padding-left: 24px;
    position: relative;
  }
  .hero-bullets li::before {
    content: '';
    position: absolute;
    left: 4px;
    top: 8px;
    width: 12px;
    height: 12px;
    background: var(--c-surface-card) url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'><path fill='none' stroke='%23111111' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round' d='M3 8.5l3 3 7-8'/></svg>") center / 12px 12px no-repeat;
    border-radius: 50%;
  }
  .hero-cta-row {
    margin-top: var(--s-md);
    display: flex;
    gap: var(--s-md);
    align-items: center;
  }

  /* ===== Trust band ===== */
  .trust-band {
    padding: var(--s-section) 0 var(--s-xxl);
    border-top: 1px solid var(--c-hairline-soft);
  }
  .trust-head {
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--c-muted);
    text-align: center;
    margin: 0 0 var(--s-xl);
    font-family: var(--font-body);
  }
  .trust-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--s-lg);
  }
  .trust-item {
    display: flex;
    gap: var(--s-md);
    align-items: flex-start;
  }
  .trust-icon {
    flex: none;
    width: 36px; height: 36px;
    display: inline-flex; align-items: center; justify-content: center;
    background: var(--c-surface-card);
    color: var(--c-ink);
    border-radius: var(--r-md);
    font-family: var(--font-mono);
    font-size: 14px;
    font-weight: 600;
  }
  .trust-item h3 {
    margin: 0 0 4px;
    font-size: 15px;
    font-weight: 600;
    color: var(--c-ink);
  }
  .trust-item p {
    margin: 0;
    font-size: 14px;
    color: var(--c-body);
    line-height: 1.5;
  }

  /* ===== Who section ===== */
  .who-section { padding: var(--s-section) 0; border-top: 1px solid var(--c-hairline-soft); }
  .who-section .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--s-lg);
  }
  .who-card {
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-lg);
    padding: var(--s-xl);
    transition: border-color 0.15s, transform 0.15s;
  }
  .who-card:hover {
    border-color: var(--c-ink);
    transform: translateY(-2px);
  }
  .who-tag {
    font: 600 12px/1 var(--font-mono);
    color: var(--c-muted);
    margin-bottom: var(--s-md);
  }
  .who-card h3 {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.3px;
    color: var(--c-ink);
    margin: 0 0 var(--s-xs);
  }
  .who-card p {
    margin: 0;
    color: var(--c-body);
    font-size: 15px;
    line-height: 1.55;
  }

  /* ===== How it works ===== */
  .how-section { padding: var(--s-section) 0; border-top: 1px solid var(--c-hairline-soft); }
  .how-steps {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--s-lg);
    counter-reset: step;
  }
  .how-steps li {
    background: var(--c-surface-card);
    border-radius: var(--r-lg);
    padding: var(--s-xl);
    position: relative;
  }
  .step-num {
    display: inline-flex;
    align-items: center; justify-content: center;
    width: 32px; height: 32px;
    background: var(--c-ink);
    color: var(--c-canvas);
    border-radius: var(--r-pill);
    font: 600 14px/1 var(--font-body);
    margin-bottom: var(--s-md);
  }
  .how-steps h3 {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: 600;
    letter-spacing: -0.3px;
    color: var(--c-ink);
    margin: 0 0 var(--s-xs);
  }
  .how-steps p {
    margin: 0;
    color: var(--c-body);
    font-size: 15px;
    line-height: 1.55;
  }

  /* ===== FAQ ===== */
  .faq-section { padding: var(--s-section) 0 var(--s-xxl); border-top: 1px solid var(--c-hairline-soft); }
  .faq-list {
    max-width: 760px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .faq-item {
    border-bottom: 1px solid var(--c-hairline);
    padding: var(--s-md) 0;
  }
  .faq-item summary {
    cursor: pointer;
    font: 600 17px/1.4 var(--font-body);
    color: var(--c-ink);
    padding: 6px 0;
    list-style: none;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--s-md);
  }
  .faq-item summary::-webkit-details-marker { display: none; }
  .faq-item summary::after {
    content: '+';
    font-family: var(--font-mono);
    font-weight: 400;
    font-size: 22px;
    color: var(--c-muted);
    transition: transform 0.15s;
    flex: none;
  }
  .faq-item[open] summary::after { content: '−'; }
  .faq-item p {
    margin: 8px 0 0;
    color: var(--c-body);
    font-size: 15px;
    line-height: 1.65;
    max-width: 680px;
  }
</style>
