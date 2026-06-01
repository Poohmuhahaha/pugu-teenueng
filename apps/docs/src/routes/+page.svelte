<script lang="ts">
  import { base } from '$app/paths';
  import { SECTIONS } from '$lib/sections';
</script>

<svelte:head>
  <title>LifeOS Documentation</title>
</svelte:head>

<div class="home">
  <header class="home-hero">
    <span class="eyebrow">Documentation</span>
    <h1>Build with LifeOS.</h1>
    <p class="lede">
      LifeOS is an open-source headless productivity OS — knowledge graph, block editor,
      structured collections, and a REST API on top. These docs cover everything from
      <code class="doc-code">docker compose up</code> to wiring HMAC-signed webhooks into
      production pipelines.
    </p>
    <div class="cta-row">
      <a class="btn" href={base + '/quickstart'}>Get started in 10 minutes →</a>
      <a class="btn btn-secondary" href="https://github.com/Poohmuhahaha/lifeos" target="_blank" rel="noopener">★ GitHub</a>
    </div>
  </header>

  <section class="home-grid">
    {#each SECTIONS as section (section.id)}
      <article class="home-card">
        <header>
          <h2>{section.title}</h2>
          <p>{section.description}</p>
        </header>
        <ul>
          {#each section.pages as p (p.slug)}
            <li>
              <a href={`${base}/${p.slug}`}>
                <span class="page-title">{p.title}</span>
                <span class="page-desc">{p.description}</span>
              </a>
            </li>
          {/each}
        </ul>
      </article>
    {/each}
  </section>

  <section class="home-foot">
    <h2>Need help?</h2>
    <div class="help-grid">
      <a class="help-card" href="https://github.com/Poohmuhahaha/lifeos/issues" target="_blank" rel="noopener">
        <h3>File an issue</h3>
        <p>Found a bug or want to suggest a feature? Open it on GitHub.</p>
      </a>
      <a class="help-card" href="https://github.com/Poohmuhahaha/lifeos/discussions" target="_blank" rel="noopener">
        <h3>Discussions</h3>
        <p>Architecture questions, recipes, show &amp; tell — talk to the community.</p>
      </a>
      <a class="help-card" href="mailto:support@lifeos.app">
        <h3>Email support</h3>
        <p>Paid plans get a 24h SLA. Free tier is best-effort.</p>
      </a>
    </div>
  </section>
</div>

<style>
  .home {
    max-width: 1000px;
    margin: 0 auto;
    padding-top: var(--s-md);
  }
  .home-hero {
    padding: var(--s-xxl) 0 var(--s-xl);
    border-bottom: 1px solid var(--c-hairline-soft);
    margin-bottom: var(--s-xxl);
  }
  .eyebrow {
    display: inline-block;
    font: 500 13px/1 var(--font-body);
    letter-spacing: 0.02em;
    color: var(--c-muted);
    padding: 4px 12px;
    background: var(--c-surface-card);
    border-radius: var(--r-pill);
    margin-bottom: var(--s-md);
  }
  .home-hero h1 {
    font: 600 56px/1.05 var(--font-display);
    letter-spacing: -2px;
    color: var(--c-ink);
    margin: 0 0 var(--s-md);
  }
  .lede {
    font-size: 18px;
    color: var(--c-body);
    margin: 0 0 var(--s-lg);
    max-width: 720px;
    line-height: 1.6;
  }
  .cta-row { display: flex; gap: var(--s-sm); flex-wrap: wrap; }

  .home-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--s-lg);
    margin-bottom: var(--s-xxl);
  }
  .home-card {
    background: var(--c-canvas);
    border: 1px solid var(--c-hairline);
    border-radius: var(--r-lg);
    padding: var(--s-xl);
    transition: border-color 0.15s;
  }
  .home-card:hover { border-color: var(--c-ink); }
  .home-card h2 {
    font: 600 22px/1.2 var(--font-display);
    letter-spacing: -0.4px;
    color: var(--c-ink);
    margin: 0 0 4px;
  }
  .home-card > header > p {
    font-size: 14px;
    color: var(--c-muted);
    margin: 0 0 var(--s-md);
  }
  .home-card ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 2px; }
  .home-card li a {
    display: flex; flex-direction: column;
    padding: 10px 0;
    border-top: 1px solid var(--c-hairline-soft);
    color: var(--c-ink);
    text-decoration: none;
  }
  .home-card li:first-child a { border-top: 1px solid var(--c-hairline); }
  .home-card .page-title { font: 600 15px/1.4 var(--font-body); color: var(--c-ink); }
  .home-card .page-desc { font-size: 13px; color: var(--c-muted); }
  .home-card li a:hover .page-title { color: var(--c-brand-accent); }

  .home-foot { padding: var(--s-xl) 0 var(--s-xxl); border-top: 1px solid var(--c-hairline-soft); }
  .home-foot h2 {
    font: 600 24px/1.2 var(--font-display);
    letter-spacing: -0.4px;
    color: var(--c-ink);
    margin: 0 0 var(--s-md);
  }
  .help-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--s-md);
  }
  .help-card {
    display: block;
    background: var(--c-surface-card);
    border-radius: var(--r-lg);
    padding: var(--s-lg);
    color: var(--c-ink);
    text-decoration: none;
    transition: transform 0.15s, box-shadow 0.15s;
  }
  .help-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); text-decoration: none; }
  .help-card h3 {
    font: 600 16px/1.4 var(--font-body);
    color: var(--c-ink);
    margin: 0 0 4px;
  }
  .help-card p { font-size: 14px; color: var(--c-body); margin: 0; }

  @media (max-width: 768px) {
    .home-hero h1 { font-size: 40px; letter-spacing: -1.2px; }
    .home-grid { grid-template-columns: 1fr; }
    .help-grid { grid-template-columns: 1fr; }
  }
</style>
