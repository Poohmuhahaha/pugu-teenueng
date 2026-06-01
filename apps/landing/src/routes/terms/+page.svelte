<svelte:head>
  <title>Terms of Service · LifeOS</title>
  <meta name="description" content="LifeOS Terms of Service — open-source AGPL-3.0 core, cloud subscription terms, account responsibilities, and data rights." />
  <link rel="canonical" href="https://lifeos.app/terms" />
  <meta property="og:title" content="LifeOS Terms of Service" />
  <meta property="og:description" content="Subscription, self-hosting, and account terms for LifeOS." />
  <meta property="og:url" content="https://lifeos.app/terms" />
  <meta name="twitter:card" content="summary" />
</svelte:head>

<header class="top-nav">
  <div class="top-nav-inner">
    <a class="brand" href="/">
      <span class="brand-dot"></span>
      LifeOS
    </a>
    <nav class="nav-links">
      <a href="/">Home</a>
      <a href="/privacy">Privacy</a>
    </nav>
  </div>
</header>

<main>
  <article class="doc">
    <header class="doc-head">
      <h1>Terms of Service</h1>
      <p class="updated">Effective Date: May 21, 2026 · Last updated: May 21, 2026</p>
    </header>

    <section>
      <h2>1. Agreement to Terms</h2>
      <p>These Terms of Service (these "Terms") constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you," "your," or "User"), and LifeOS ("we," "our," "us," or the "Company"), concerning your access to and use of the LifeOS website, desktop or mobile applications, command-line interface (CLI) tools, managed synchronization servers, and cloud platform (collectively, the "Services").</p>
      <p>Please read these Terms carefully before accessing or using our Services. By installing the software, registering an account, subscribing to paid plans, or browsing our website, you agree to be bound by all of these Terms. <strong>IF YOU DO NOT AGREE WITH ALL OF THESE TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND MUST DISCONTINUE USE IMMEDIATELY.</strong></p>
    </section>

    <section>
      <h2>2. Eligibility and Account Registration</h2>
      <h3>2.1. Age Requirements</h3>
      <p>By using the Services, you represent and warrant that you are at least thirteen (13) years of age. If you are under 18, you may only use the Services under the supervision of a parent or legal guardian who agrees to be bound by these Terms.</p>
      <h3>2.2. Account Security</h3>
      <p>To access certain features, including our managed synchronization services (LifeOS Cloud), you must register an account by providing a valid email address and credentials.</p>
      <ul>
        <li>You represent that all registration information is truthful and accurate.</li>
        <li>You are solely responsible for preserving the confidentiality of your account credentials.</li>
        <li>You are fully responsible for all activities that occur under your account. You agree to notify us immediately at <a href="mailto:support@lifeos.app">support@lifeos.app</a> upon discovering any unauthorized use or security breach of your account.</li>
      </ul>
    </section>

    <section>
      <h2>3. Software Licensing & Open-Source Citation</h2>
      <h3>3.1. Open-Source Core</h3>
      <p>The core source code of the LifeOS software is open-source software and is licensed under the <strong>GNU Affero General Public License version 3 (AGPL-3.0)</strong>. You are permitted to inspect, self-host, copy, modify, and redistribute the core software in accordance with the terms of the AGPL-3.0 license.</p>
      <p><strong>Network Deployment Condition:</strong> In compliance with Section 13 of the AGPL-3.0, if you modify the LifeOS software and run it on a server to make it available to other users over a network, you MUST make the modified source code available to those users under the terms of the AGPL-3.0.</p>
      <h3>3.2. Proprietary Assets and Trademarks</h3>
      <p>While the core software is open-source, the LifeOS brand name, logo, custom cloud synchronization interfaces, commercial infrastructure, design assets, and marketing materials (collectively, the "Company IP") are proprietary property of the Company. These Terms do not grant you any license or right to use the Company IP for commercial branding, marketing, or trademarked distribution without our prior, written authorization.</p>
    </section>

    <section>
      <h2>4. Local-First Design & Zero-Knowledge Disclaimer</h2>
      <h3>4.1. Local Storage Sovereignty</h3>
      <p>LifeOS operates on a local-first architectural model. Your databases, structured schemas, wiki records, and knowledge graphs are compiled, processed, and stored directly on your physical hardware. We do not inspect, collect, or store your database contents, nor do we possess any recovery tools to restore local data lost due to device failure, storage corruption, browser cache purges, or hardware theft. <strong>YOU ARE SOLELY RESPONSIBLE FOR CREATING REGULAR MANUAL BACKUPS OF YOUR LOCAL DATA.</strong></p>
      <h3>4.2. Zero-Knowledge Cloud Sync</h3>
      <p>If you purchase a LifeOS Cloud synchronization subscription:</p>
      <ul>
        <li><strong>Client-Side Encryption:</strong> The software encrypts all synced databases client-side using robust encryption standards. The encryption and decryption keys are held exclusively on your local devices.</li>
        <li><strong>No Access to Data:</strong> We operate purely as an encrypted synchronization conduit. We do not have access to your encryption keys.</li>
        <li><strong>Loss of Cryptographic Keys:</strong> If you lose, delete, or forget your master sync keys or encryption keys, we cannot recover them, nor can we decrypt your synchronized database. We bear zero liability for permanent data loss resulting from your failure to safeguard your cryptographic sync keys.</li>
      </ul>
    </section>

    <section>
      <h2>5. Subscriptions, Billing, and Refund Policy</h2>
      <h3>5.1. Payment and Processing (Stripe)</h3>
      <p>All payments are processed through <strong>Stripe, Inc.</strong> and its affiliates. By subscribing, you authorize Stripe to charge your designated credit card or payment method for the recurring subscription fees, taxes, and transaction charges associated with your plan. You must keep your payment information accurate and up to date.</p>
      <h3>5.2. Automatic Renewal</h3>
      <p>Paid subscriptions operate on a continuous, recurring cycle (monthly or annual, as chosen during checkout). <strong>YOUR SUBSCRIPTION WILL AUTOMATICALLY RENEW AT THE END OF EACH BILLING CYCLE UNLESS YOU CANCEL IT PRIOR TO THE RENEWAL DATE.</strong> You can cancel your subscription at any time via your account settings dashboard.</p>
      <h3>5.3. Refund Policy</h3>
      <ul>
        <li><strong>14-Day Satisfaction Guarantee:</strong> New subscribers are eligible to request a full refund within fourteen (14) days of their initial purchase if they are unsatisfied with the cloud service.</li>
        <li><strong>Subsequent Renewals:</strong> Except as required by local consumer protection laws, all recurring fees billed after the initial 14-day window are strictly non-refundable and non-prorated upon early cancellation.</li>
      </ul>
    </section>

    <section>
      <h2>6. Acceptable Use & Conduct Policy</h2>
      <p>When utilizing our managed cloud sync servers, APIs, or website, you agree not to violate any laws, disrupt server infrastructure, transmit malicious malware or software, perform denial-of-service (DoS) or distributed denial-of-service (DDoS) attacks, or attempt to bypass storage quotas or user seat restrictions established by your subscription level.</p>
      <p><strong>We reserve the right to suspend or terminate accounts found to be in material breach of this section, without prior notice or refund liability.</strong></p>
    </section>

    <section>
      <h2>7. Disclaimer of Warranties</h2>
      <p class="caps">THE SERVICES ARE PROVIDED ON AN "AS-IS" AND "AS-AVAILABLE" BASIS. TO THE MAXIMUM EXTENT PERMITTED BY LAW, LIFEOS DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING, WITHOUT LIMITATION, THE IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.</p>
      <p class="caps">WE MAKE NO REPRESENTATIONS OR WARRANTIES THAT THE SERVICES WILL BE UNINTERRUPTED, SECURE, TIMELY, OR ERROR-FREE; OR THAT THE SYNC SYSTEM WILL PREVENT DATA LOSS, TRANSMISSION CONFLICTS, OR STORAGE CORRUPTION WITH 100% RELIABILITY.</p>
    </section>

    <section>
      <h2>8. Limitation of Liability</h2>
      <p class="caps">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL LIFEOS, ITS DIRECTORS, EMPLOYEES, PARTNERS, OR AGENTS BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION, LOSS OF PROFITS, LOSS OF DATA, LOSS OF USE, LOSS OF GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF OR INABILITY TO USE THE SERVICES.</p>
      <p class="caps">IN NO EVENT SHALL THE AGGREGATE LIABILITY OF THE COMPANY EXCEED THE GREATER OF ONE HUNDRED UNITED STATES DOLLARS ($100.00 USD) OR THE TOTAL AMOUNT PAID BY YOU TO THE COMPANY FOR THE SPECIFIC SERVICE IN QUESTION DURING THE TWELVE (12) MONTHS IMMEDIATELY PRECEDING THE INITIATION OF THE CLAIM.</p>
    </section>

    <section>
      <h2>9. Support and Contact</h2>
      <p>For questions, customer service inquiries, billing disputes, or notifications of unauthorized account use, please contact us at <a href="mailto:support@lifeos.app">support@lifeos.app</a>.</p>
    </section>
  </article>
</main>

<footer class="site-footer">
  <div class="site-footer-inner">
    <div>
      <a class="brand" href="/">
        <span class="brand-dot"></span>
        LifeOS
      </a>
      <p class="footer-tag">Headless productivity OS. Self-host or cloud.</p>
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
        <a href="mailto:support@lifeos.app">Contact</a>
        <a href="https://github.com/Poohmuhahaha/lifeos">GitHub</a>
      </div>
    </div>
  </div>
  <div class="site-footer-bottom">© 2026 LifeOS · All rights reserved</div>
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
  .doc p.caps { font-size: 13px; letter-spacing: 0.02em; line-height: 1.7; color: var(--c-body); }
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
