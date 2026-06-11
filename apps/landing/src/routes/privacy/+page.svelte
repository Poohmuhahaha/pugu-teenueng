<svelte:head>
  <title>Privacy Policy · QuestPage</title>
  <meta name="description" content="QuestPage Privacy Policy — local-first data ownership, zero-knowledge encrypted sync, no third-party tracking." />
  <link rel="canonical" href="https://questpage.app/privacy" />
  <meta property="og:title" content="QuestPage Privacy Policy" />
  <meta property="og:description" content="How QuestPage handles your data — local-first, zero-knowledge sync, GDPR compliant." />
  <meta property="og:url" content="https://questpage.app/privacy" />
  <meta name="twitter:card" content="summary" />
</svelte:head>

<header class="top-nav">
  <div class="top-nav-inner">
    <a class="brand" href="/">
      <span class="brand-dot"></span>
      QuestPage
    </a>
    <nav class="nav-links">
      <a href="/">Home</a>
      <a href="/terms">Terms</a>
    </nav>
  </div>
</header>

<main>
  <article class="doc">
    <header class="doc-head">
      <h1>Privacy Policy</h1>
      <p class="updated">Effective Date: May 21, 2026 · Last updated: May 21, 2026</p>
    </header>

    <section>
      <h2>1. Introduction and Scope</h2>
      <p>Welcome to QuestPage. QuestPage ("we," "our," "us," or the "Company") is committed to protecting the privacy and security of our users ("you," "your," or "User").</p>
      <p>This Privacy Policy (the "Policy") explains how we collect, use, process, store, disclose, and safeguard your information when you access or use the QuestPage website, desktop or mobile applications, command-line interface (CLI) tools, managed synchronization servers, and cloud infrastructure (collectively, the "Services").</p>
      <p>By accessing or using our Services, you acknowledge that you have read, understood, and agree to the quest board and use of your information in accordance with this Policy. If you do not agree with any terms herein, you must immediately cease all access and use of our Services.</p>
    </section>

    <section>
      <h2>2. The Local-First Paradigm & Data Ownership</h2>
      <p>QuestPage is architected as a <strong>local-first</strong> application. This core design principle guarantees complete user sovereignty over personal data.</p>
      <h3>2.1. Local Database Data</h3>
      <p>By design, all your notes, custom schemas, quest boards, structured databases, wiki links, and knowledge graphs (collectively, "User Database Data") are compiled, stored, and processed <strong>locally</strong> on your physical device(s) inside your browser's sandboxed storage or local directory structure. We do not upload, ingest, monitor, copy, or monetize your User Database Data. We have zero access to your database entries or knowledge graphs.</p>
      <h3>2.2. Managed Sync Services (End-to-End Encryption)</h3>
      <p>If you opt to subscribe to <strong>QuestPage Cloud</strong> or use our managed synchronization servers to keep multiple devices in sync:</p>
      <ul>
        <li><strong>End-to-End Encryption (E2EE):</strong> All User Database Data is encrypted client-side <em>before</em> it leaves your device.</li>
        <li><strong>Cryptographic Keys:</strong> The master sync keys and encryption keys are generated locally on your machine and are never transmitted to our servers in plaintext.</li>
        <li><strong>Zero-Knowledge Architecture:</strong> Because we do not hold your private cryptographic keys, we are mathematically and technically incapable of decrypting, inspecting, indexing, or viewing your synced database entries. The synchronization servers act strictly as a blind, encrypted relay.</li>
      </ul>
    </section>

    <section>
      <h2>3. Information We Collect</h2>
      <p>Although we cannot access your notes or databases, we do collect certain information required to manage accounts, process payments, and improve general application stability.</p>
      <h3>3.1. Information You Provide Voluntarily</h3>
      <ul>
        <li><strong>Account Information:</strong> To create a QuestPage Cloud account or register for paid tiers, you must provide a valid email address and secure account credentials.</li>
        <li><strong>Support Interactions:</strong> When you contact us for technical assistance, report a bug, or send email queries, we collect your email address, name, and any text or attachments you choose to send.</li>
        <li><strong>Feedback and Surveys:</strong> If you participate in product surveys or user feedback programs, we collect the details you provide.</li>
      </ul>
      <h3>3.2. Billing and Financial Information (Processed via Stripe)</h3>
      <p>All financial transactions are handled securely by our third-party payment processor, <strong>Stripe</strong>. When purchasing a paid subscription, you provide credit card numbers, billing addresses, and other financial details directly to Stripe. We do not store, process, or transmit full credit card numbers or sensitive CVV codes on our servers.</p>
      <h3>3.3. Technical, Log, and Usage Information</h3>
      <ul>
        <li><strong>Anonymized Telemetry (Opt-in):</strong> If you opt-in to telemetry, the client application may transmit performance metrics, load times, and system specifications to help us resolve crashes and optimize resource consumption. No personal notes or database content are ever included.</li>
        <li><strong>Server Logs:</strong> Our synchronization and web servers automatically log standard network requests. These logs contain IP addresses, request timestamps, request paths, and browser user-agent strings. Server logs are used exclusively for system diagnostics and defense.</li>
      </ul>
    </section>

    <section>
      <h2>4. Cookies and Local Storage Technologies</h2>
      <p>QuestPage does not deploy third-party advertising cookies, retargeting scripts, or tracking pixels. We utilize Local Storage and First-Party Cookies strictly for functional and operational necessity, such as maintaining your active login session and storing your theme preferences (light or dark mode).</p>
    </section>

    <section>
      <h2>5. Legal Basis for Processing (EEA/UK Users)</h2>
      <p>If you reside within the European Economic Area (EEA) or the United Kingdom (UK), our processing of your personal data is governed by the General Data Protection Regulation (GDPR). We process your information under the performance of a contract (delivering sync services), consent (telemetry), legitimate interests (security and product improvement), and legal compliance (tax regulations).</p>
    </section>

    <section>
      <h2>6. Data Retention Policy</h2>
      <ul>
        <li><strong>Account and Billing Records:</strong> We retain your email, billing logs, and transaction history for as long as your account remains active, and as necessary to fulfill legal, tax, or regulatory obligations (typically up to 7 years).</li>
        <li><strong>Encrypted Synchronization Buffers:</strong> Encrypted synchronization data held on our relay servers is cached only as long as necessary to synchronize your active devices. If you cancel your sync subscription, all encrypted data blocks associated with your account are permanently purged within thirty (30) days.</li>
        <li><strong>System Log Files:</strong> Web and synchronization server logs are automatically rotated and deleted after ninety (90) days.</li>
      </ul>
    </section>

    <section>
      <h2>7. Security Measures</h2>
      <p>We employ rigorous, industry-standard administrative, physical, and technical safeguards designed to protect all data within our custody. All network communications are encrypted in transit via SSL/TLS, and QuestPage Cloud sync relies on AES-256 client-side encryption.</p>
      <p><strong>Important Note:</strong> Because your encryption keys are kept locally on your devices, you are solely responsible for protecting those keys. If you lose your master sync keys or reveal them to unauthorized parties, we cannot recover or decrypt your data.</p>
    </section>

    <section>
      <h2>8. Contact Us</h2>
      <p>If you have any questions, concerns, or complaints regarding this Privacy Policy or our data handling practices, please contact us at <a href="mailto:privacy@questpage.app">privacy@questpage.app</a>.</p>
    </section>
  </article>
</main>

<footer class="site-footer">
  <div class="site-footer-inner">
    <div>
      <a class="brand" href="/">
        <span class="brand-dot"></span>
        QuestPage
      </a>
      <p class="footer-tag">QuestPage AI Lead Generation Dashboard · Self-host or cloud.</p>
    </div>
    <div class="footer-cols">
      <div class="footer-col">
        <h4>Product</h4>
        <a href="/#features">Features</a>
        <a href="/#pricing">Pricing</a>
      </div>
      <div class="footer-col">
        <h4>Legal</h4>
        <a href="/privacy">Privacy</a>
        <a href="/terms">Terms</a>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <a href="mailto:privacy@questpage.app">Contact</a>
        <a href="https://github.com/Poohmuhahaha/questpage">GitHub</a>
      </div>
    </div>
  </div>
  <div class="site-footer-bottom">© 2026 QuestPage · All rights reserved</div>
</footer>

<style>
  main { max-width: 800px; margin: 0 auto; padding: 64px var(--s-xl); }
  .doc-head { margin-bottom: var(--s-xxl); padding-bottom: var(--s-lg); border-bottom: 1px solid var(--c-hairline-soft); }
  .doc h1 { font-family: var(--font-display); font-size: 48px; font-weight: 600; letter-spacing: -1.5px; line-height: 1.1; color: var(--c-ink); }
  .updated { margin-top: var(--s-sm); color: var(--c-muted-soft); font-size: 14px; }
  .doc section { margin-bottom: var(--s-xxl); }
  .doc h2 { font-family: var(--font-display); font-size: 24px; font-weight: 600; letter-spacing: -0.5px; color: var(--c-ink); margin-bottom: var(--s-md); padding-top: var(--s-md); }
  .doc h3 { font-family: var(--font-body); font-size: 17px; font-weight: 600; color: var(--c-ink); margin-top: var(--s-lg); margin-bottom: var(--s-xs); }
  .doc p { font-size: 16px; line-height: 1.65; color: var(--c-body); margin-bottom: var(--s-md); }
  .doc ul { padding-left: 20px; margin: 0 0 var(--s-md); }
  .doc li { font-size: 16px; line-height: 1.65; color: var(--c-body); margin-bottom: var(--s-xs); }
  .doc a { color: var(--c-brand-accent); text-decoration: none; }
  .doc a:hover { text-decoration: underline; }
  .doc strong { color: var(--c-ink); }

  @media (max-width: 768px) {
    main { padding: 40px var(--s-md); }
    .doc h1 { font-size: 36px; letter-spacing: -1px; }
    .doc h2 { font-size: 22px; }
  }
</style>
