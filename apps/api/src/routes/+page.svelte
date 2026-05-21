<svelte:head><title>LifeOS API</title></svelte:head>

<main>
  <h1>LifeOS API</h1>
  <p>This is the LifeOS REST API. There's no UI here — see the apps below.</p>
  <ul>
    <li><a href="/api/v1/docs">OpenAPI spec (/api/v1/docs)</a></li>
    <li><a href="/api/health">Health check (/api/health)</a></li>
  </ul>
  <h2>Apps</h2>
  <ul>
    <li><a href="http://localhost:5175">Admin (5175)</a> — content types, entries, billing, sessions</li>
    <li><a href="http://localhost:5176">Web (5176)</a> — user-facing collections + knowledge graph</li>
    <li><a href="http://localhost:5177">Landing (5177)</a> — marketing + waitlist</li>
  </ul>
</main>

<style>
  main { max-width: 640px; margin: 80px auto; padding: 0 24px; font-family: -apple-system, system-ui, sans-serif; color: #111; line-height: 1.6; }
  h1 { font-size: 28px; color: #7c3aed; margin-bottom: 8px; }
  h2 { font-size: 18px; margin-top: 28px; }
  a { color: #7c3aed; }
</style>
