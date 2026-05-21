<script lang="ts">
</script>

<svelte:head>
  <title>Privacy Policy · LifeOS</title>
</svelte:head>

<header>
  <a href="/" class="brand">LifeOS</a>
  <nav>
    <a href="/">Back to Home</a>
  </nav>
</header>

<main>
  <article class="doc">
    <h1>Privacy Policy</h1>
    <p class="updated">Effective Date: May 21, 2026 | Last updated: May 21, 2026</p>
    
    <section>
      <h2>1. Introduction and Scope</h2>
      <p>
        Welcome to LifeOS. LifeOS ("we," "our," "us," or the "Company") is committed to protecting the privacy and security of our users ("you," "your," or "User").
      </p>
      <p>
        This Privacy Policy (the "Policy") explains how we collect, use, process, store, disclose, and safeguard your information when you access or use the LifeOS website, desktop or mobile applications, command-line interface (CLI) tools, managed synchronization servers, and cloud infrastructure (collectively, the "Services").
      </p>
      <p>
        By accessing or using our Services, you acknowledge that you have read, understood, and agree to the collection and use of your information in accordance with this Policy. If you do not agree with any terms herein, you must immediately cease all access and use of our Services.
      </p>
    </section>

    <section>
      <h2>2. The Local-First Paradigm & Data Ownership</h2>
      <p>
        LifeOS is architected as a <strong>local-first</strong> application. This core design principle guarantees complete user sovereignty over personal data.
      </p>
      <h3>2.1. Local Database Data</h3>
      <p>
        By design, all your notes, custom schemas, collections, structured databases, wiki links, and knowledge graphs (collectively, "User Database Data") are compiled, stored, and processed <strong>locally</strong> on your physical device(s) inside your browser's sandboxed storage or local directory structure. We do not upload, ingest, monitor, copy, or monetize your User Database Data. We have zero access to your database entries or knowledge graphs.
      </p>
      <h3>2.2. Managed Sync Services (End-to-End Encryption)</h3>
      <p>
        If you opt to subscribe to <strong>LifeOS Cloud</strong> or use our managed synchronization servers to keep multiple devices in sync:
      </p>
      <ul>
        <li><strong>End-to-End Encryption (E2EE):</strong> All User Database Data is encrypted client-side <em>before</em> it leaves your device.</li>
        <li><strong>Cryptographic Keys:</strong> The master sync keys and encryption keys are generated locally on your machine and are never transmitted to our servers in plaintext.</li>
        <li><strong>Zero-Knowledge Architecture:</strong> Because we do not hold your private cryptographic keys, we are mathematically and technically incapable of decrypting, inspecting, indexing, or viewing your synced database entries. The synchronization servers act strictly as a blind, encrypted relay.</li>
      </ul>
    </section>

    <section>
      <h2>3. Information We Collect</h2>
      <p>
        Although we cannot access your notes or databases, we do collect certain information required to manage accounts, process payments, and improve general application stability.
      </p>
      <h3>3.1. Information You Provide Voluntarily</h3>
      <ul>
        <li><strong>Account Information:</strong> To create a LifeOS Cloud account or register for paid tiers, you must provide a valid email address and secure account credentials.</li>
        <li><strong>Support Interactions:</strong> When you contact us for technical assistance, report a bug, or send email queries, we collect your email address, name, and any text or attachments you choose to send.</li>
        <li><strong>Feedback and Surveys:</strong> If you participate in product surveys or user feedback programs, we collect the details you provide.</li>
      </ul>
      <h3>3.2. Billing and Financial Information (Processed via Stripe)</h3>
      <p>
        All financial transactions are handled securely by our third-party payment processor, <strong>Stripe</strong>. When purchasing a paid subscription, you provide credit card numbers, billing addresses, and other financial details directly to Stripe. We do not store, process, or transmit full credit card numbers or sensitive CVV codes on our servers.
      </p>
      <h3>3.3. Technical, Log, and Usage Information</h3>
      <ul>
        <li><strong>Anonymized Telemetry (Opt-in):</strong> If you opt-in to telemetry, the client application may transmit performance metrics, load times, and system specifications to help us resolve crashes and optimize resource consumption. No personal notes or database content are ever included.</li>
        <li><strong>Server Logs:</strong> Our synchronization and web servers automatically log standard network requests. These logs contain IP addresses, request timestamps, request paths, and browser user-agent strings. Server logs are used exclusively for system diagnostics and defense.</li>
      </ul>
    </section>

    <section>
      <h2>4. Cookies and Local Storage Technologies</h2>
      <p>
        LifeOS does not deploy third-party advertising cookies, retargeting scripts, or tracking pixels. We utilize Local Storage and First-Party Cookies strictly for functional and operational necessity, such as maintaining your active login session and storing your theme preferences (light or dark mode).
      </p>
    </section>

    <section>
      <h2>5. Legal Basis for Processing (EEA/UK Users)</h2>
      <p>
        If you reside within the European Economic Area (EEA) or the United Kingdom (UK), our processing of your personal data is governed by the General Data Protection Regulation (GDPR). We process your information under the performance of a contract (delivering sync services), consent (telemetry), legitimate interests (security and product improvement), and legal compliance (tax regulations).
      </p>
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
      <p>
        We employ rigorous, industry-standard administrative, physical, and technical safeguards designed to protect all data within our custody. All network communications are encrypted in transit via SSL/TLS, and LifeOS Cloud sync relies on AES-256 client-side encryption.
      </p>
      <p>
        <strong>Important Note:</strong> Because your encryption keys are kept locally on your devices, you are solely responsible for protecting those keys. If you lose your master sync keys or reveal them to unauthorized parties, we cannot recover or decrypt your data.
      </p>
    </section>

    <section>
      <h2>8. Contact Us</h2>
      <p>
        If you have any questions, concerns, or complaints regarding this Privacy Policy or our data handling practices, please contact us at <a href="mailto:privacy@lifeos.app">privacy@lifeos.app</a>.
      </p>
    </section>
  </article>
</main>

<footer>
  <span>© 2026 LifeOS · <a href="/">Home</a> · <a href="/terms">Terms of Service</a></span>
</footer>

<style>
  :global(html, body) { margin: 0; padding: 0; background: #000000; color: #d7e5f0; }
  :global(body) {
    font-family: 'Plus Jakarta Sans', -apple-system, system-ui, sans-serif;
    line-height: 1.6;
    background: radial-gradient(circle at 50% -10%, rgba(201, 173, 147, 0.1) 0%, rgba(0, 0, 0, 0) 50%), #000000;
  }
  header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 32px; max-width: 800px; margin: 0 auto;
    border-bottom: 1px solid rgba(115, 120, 124, 0.15);
  }
  .brand {
    font-weight: 800; letter-spacing: -0.03em; font-size: 20px;
    color: #c9ad93; text-decoration: none;
    display: flex; align-items: center; gap: 8px;
  }
  .brand::before {
    content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%;
    background: #c9ad93; box-shadow: 0 0 8px #c9ad93;
  }
  nav a { color: #c5c6c7; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; }
  nav a:hover { color: #c9ad93; }

  main { max-width: 800px; margin: 0 auto; padding: 40px 32px 80px; }
  .doc h1 { font-size: 40px; font-weight: 800; letter-spacing: -0.04em; color: #ffffff; margin-bottom: 8px; }
  .updated { font-size: 13px; color: #73787c; margin-bottom: 40px; }
  
  section { margin-bottom: 40px; }
  h2 { font-size: 22px; font-weight: 700; color: #c9ad93; margin-top: 32px; margin-bottom: 16px; border-bottom: 1px solid rgba(115, 120, 124, 0.15); padding-bottom: 8px; }
  h3 { font-size: 17px; font-weight: 600; color: #ffffff; margin-top: 24px; margin-bottom: 12px; }
  p { font-size: 15px; color: #c5c6c7; margin: 0 0 16px; text-align: justify; }
  ul { padding-left: 20px; margin-bottom: 24px; }
  li { font-size: 15px; color: #c5c6c7; margin-bottom: 8px; }
  a { color: #c9ad93; text-decoration: none; transition: opacity 0.2s; }
  a:hover { opacity: 0.8; }

  footer { text-align: center; padding: 48px; font-size: 13px; color: #73787c; border-top: 1px solid rgba(115, 120, 124, 0.15); max-width: 800px; margin: 0 auto; }
  footer a { color: #c5c6c7; text-decoration: none; transition: color 0.2s; }
  footer a:hover { color: #c9ad93; }
</style>
