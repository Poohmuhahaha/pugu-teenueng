# Privacy Policy for LifeOS

**Effective Date:** May 21, 2026  
**Last Updated:** May 21, 2026  

---

## 1. INTRODUCTION AND SCOPE

Welcome to LifeOS. LifeOS ("we," "our," "us," or the "Company") is committed to protecting the privacy and security of our users ("you," "your," or "User"). 

This Privacy Policy (the "Policy") explains how we collect, use, process, store, disclose, and safeguard your information when you access or use the LifeOS website, desktop or mobile applications, command-line interface (CLI) tools, managed synchronization servers, and cloud infrastructure (collectively, the "Services").

By accessing or using our Services, you acknowledge that you have read, understood, and agree to the collection and use of your information in accordance with this Policy. If you do not agree with any terms herein, you must immediately cease all access and use of our Services.

This Policy applies to:
1. Individual users of the LifeOS client applications.
2. Subscribers of our managed LifeOS Cloud synchronization plans.
3. Visitors to our public landing page and marketing websites.

---

## 2. THE LOCAL-FIRST PARADIGM & DATA OWNERSHIP

LifeOS is architected as a **local-first** application. This core design principle guarantees complete user sovereignty over personal data. 

### 2.1. Local Database Data
By design, all your notes, custom schemas, collections, structured databases, wiki links, and knowledge graphs (collectively, "User Database Data") are compiled, stored, and processed **locally** on your physical device(s). 
* **Storage Mechanisms:** We utilize localized database instances (such as RxDB, IndexedDB, or local SQLite instances) residing completely inside your browser's sandboxed storage or local directory structure.
* **No Server Storage:** We do not upload, ingest, monitor, copy, or monetize your User Database Data. We have zero access to your database entries or knowledge graphs. 

### 2.2. Managed Sync Services (End-to-End Encryption)
If you opt to subscribe to **LifeOS Cloud** or use our managed synchronization servers to keep multiple devices in sync:
* **End-to-End Encryption (E2EE):** All User Database Data is encrypted client-side *before* it leaves your device. 
* **Cryptographic Keys:** The master sync keys and encryption keys are generated locally on your machine and are never transmitted to our servers in plaintext. 
* **Zero-Knowledge Architecture:** Because we do not hold your private cryptographic keys, we are mathematically and technically incapable of decrypting, inspecting, indexing, or viewing your synced database entries. The synchronization servers act strictly as a blind, encrypted relay.

---

## 3. INFORMATION WE COLLECT

Although we cannot access your notes or databases, we do collect certain information required to manage accounts, process payments, and improve general application stability.

### 3.1. Information You Provide Voluntarily
* **Account Information:** To create a LifeOS Cloud account or register for paid tiers, you must provide a valid email address and secure account credentials.
* **Support Interactions:** When you contact us for technical assistance, report a bug, or send email queries, we collect your email address, name, and any text or attachments you choose to send.
* **Feedback and Surveys:** If you participate in product surveys or user feedback programs, we collect the details you provide.

### 3.2. Billing and Financial Information (Processed via Stripe)
All financial transactions are handled securely by our third-party payment processor, **Stripe**. 
* When purchasing a paid subscription (e.g., Personal Pro, Studio), you provide credit card numbers, billing addresses, and other financial details directly to Stripe.
* We do not store, process, or transmit full credit card numbers or sensitive CVV codes on our servers. We receive only transaction identifiers, subscription status updates, and anonymized billing indicators.

### 3.3. Technical, Log, and Usage Information
* **Anonymized Telemetry (Opt-in):** If you opt-in to telemetry, the client application may transmit performance metrics, load times, and system specifications (e.g., operating system version, browser type, application version) to help us resolve crashes and optimize resource consumption.
* **Server Logs:** Our synchronization and web servers automatically log standard network requests. These logs contain IP addresses, request timestamps, request paths, and browser user-agent strings. Server logs are used exclusively for system diagnostics, defense against denial-of-service attacks, and infrastructure security audits.

---

## 4. COOKIES AND LOCAL STORAGE TECHNOLOGIES

LifeOS does not deploy third-party advertising cookies, retargeting scripts, or tracking pixels.

We utilize **Local Storage** and **First-Party Cookies** strictly for functional and operational necessity:
* **Authentication:** To maintain your active login session and verify your identity on our servers.
* **Workspace Preferences:** To store local configurations, such as your selected active workspace, sidebar states, and color theme preferences (light or dark mode).

You can control cookies and local storage through your browser settings, though disabling these technologies may cause session loss or require you to reset your UI preferences upon every visit.

---

## 5. LEGAL BASIS FOR PROCESSING (EEA/UK USERS)

If you reside within the European Economic Area (EEA) or the United Kingdom (UK), our processing of your personal data is governed by the General Data Protection Regulation (GDPR). We process your information under the following legal bases:
1. **Performance of a Contract:** To establish your account, facilitate billing, and deliver the optional LifeOS Cloud synchronization services you subscribe to.
2. **Consent:** For opt-in telemetry and marketing communication, which you may withdraw at any time.
3. **Legitimate Interests:** To protect our services from abuse, secure our network infrastructure, and analyze general performance trends to improve the product.
4. **Legal Compliance:** To satisfy tax, accounting, or regulatory requirements.

---

## 6. DATA RETENTION POLICY

* **Account and Billing Records:** We retain your email, billing logs, and transaction history for as long as your account remains active, and as necessary to fulfill legal, tax, or regulatory obligations (typically up to seven [7] years under relevant jurisdictions).
* **Encrypted Synchronization Buffers:** Encrypted synchronization data held on our relay servers is cached only as long as necessary to synchronize your active devices. If you cancel your sync subscription, all encrypted data blocks associated with your account are permanently purged from our active relay servers within thirty (30) days.
* **System Log Files:** Web and synchronization server logs are automatically rotated and deleted after ninety (90) days, unless flagged for active security investigation.

---

## 7. THIRD-PARTY DATA PROCESSORS (SUB-PROCESSORS)

To deliver our Services, we contract with trusted third-party service providers. These sub-processors are vetted for data security compliance and are legally restricted from using your data for any purpose other than executing our instructions:
* **Stripe, Inc.** (Payment Processing)
* **Amazon Web Services (AWS) / Vercel** (Cloud Hosting and Infrastructure)
* **PostgreSQL / Redis** (Managed Database Hosting for sync relays and account authentication)

---

## 8. SECURITY MEASURES

We employ rigorous, industry-standard administrative, physical, and technical safeguards designed to protect all data within our custody:
* All network communications are encrypted in transit via Secure Sockets Layer/Transport Layer Security (SSL/TLS).
* LifeOS Cloud sync relies on AES-256 client-side encryption.
* We conduct periodic security reviews of our open-source codebase and cloud infrastructure.

**Important Note:** Because your encryption keys are kept locally on your devices, you are solely responsible for protecting those keys. If you lose your master sync keys or reveal them to unauthorized parties, we cannot recover or decrypt your data.

---

## 9. YOUR PRIVACY RIGHTS (GDPR / CCPA / CANADA PIPEDA)

Depending on your geographic location, you may possess specific statutory rights regarding your personal information:
* **Right of Access & Portability:** The right to request copies of your account and billing information in a structured, machine-readable format.
* **Right to Rectification:** The right to request correction of inaccurate account records.
* **Right to Erasure ("Right to be Forgotten"):** The right to request the permanent deletion of your account and sync data.
* **Right to Restrict or Object to Processing:** The right to limit how we process your administrative or telemetry data.

To exercise any of these rights, please submit a formal request to our privacy team at **privacy@lifeos.app**. We will respond to all verified requests within thirty (30) days in compliance with applicable laws.

---

## 10. CHILDREN’S PRIVACY

Our Services are not designed for, directed to, or intended for use by children under the age of thirteen (13). We do not knowingly collect personal information from individuals under thirteen years of age. If we learn that we have inadvertently collected personal data from a child under 13, we will immediately delete that information from our active databases.

---

## 11. CHANGES TO THIS PRIVACY POLICY

We reserve the right to modify or update this Privacy Policy at any time to reflect software changes, security enhancements, or shifting legal requirements. 

* We will notify you of any material changes by posting the updated Policy on our landing page and updating the "Effective Date" at the top of this document.
* If you have registered an account, we may notify you of significant policy revisions via email.
* Your continued use of our Services after the posting of changes constitutes your acceptance of the revised terms.

---

## 12. CONTACT INFORMATION

If you have questions, concerns, or complaints regarding this Privacy Policy or our data handling practices, please contact us:

**LifeOS Privacy Operations**  
**Email:** [privacy@lifeos.app](mailto:privacy@lifeos.app)  
**Website:** [https://lifeos.app/privacy](https://lifeos.app/privacy)
