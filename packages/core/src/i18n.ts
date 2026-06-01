/**
 * Tiny i18n message catalog shared across apps.
 * - Two-locale (en, th) — extend by adding entries to `messages`.
 * - String interpolation: `t('member.invitedBy', { name: 'Alice' })`.
 * - Falls back to the English key if a translation is missing.
 */

export type Locale = 'en' | 'th';

export const SUPPORTED_LOCALES: Locale[] = ['en', 'th'];

type MessageDict = Record<string, string>;

const messages: Record<Locale, MessageDict> = {
  en: {
    'nav.home': 'Home',
    'nav.collections': 'Collections',
    'nav.graph': 'Graph',
    'nav.signOut': 'Sign out',
    'nav.contentTypes': 'Content Types',
    'nav.entries': 'Browse Entries',
    'nav.apiKeys': 'API Keys',
    'nav.webhooks': 'Webhooks',
    'nav.audit': 'Audit Log',
    'nav.waitlist': 'Waitlist',
    'nav.billing': 'Billing',
    'nav.workspace': 'Workspace',
    'nav.permissions': 'Permissions',
    'nav.invite': 'Invite',
    'nav.features': 'Features',
    'nav.pricing': 'Pricing',
    'nav.github': 'GitHub',
    'nav.backToHome': 'Back to Home',
    'nav.privacy': 'Privacy Policy',
    'nav.terms': 'Terms of Service',

    'auth.signIn': 'Sign in',
    'auth.signUp': 'Create your account',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Name',
    'auth.continueWithGoogle': 'Continue with Google',
    'auth.forgotPassword': 'Reset password',

    'landing.headline.left': 'Your TodoList.',
    'landing.headline.right': 'Yours.',
    'landing.lede': 'Headless productivity OS. Knowledge graph + block editor + REST API. Self-host on your machine or run on our cloud.',
    'landing.cta': 'Join waitlist',
    'landing.cta.sending': 'Sending…',
    'landing.cta.done': 'Thanks! ✓',
    'landing.cta.placeholder': 'you@example.com',
    'landing.microcopy': 'Pre-alpha. AGPL-3.0 core · Cloud waitlist open.',
    'landing.section.features': 'What\'s inside',
    'landing.section.pricing': 'Pricing',

    'landing.feature.graph.title': 'Knowledge graph',
    'landing.feature.graph.desc': 'Bi-directional <code>[[wiki-links]]</code> with hover-preview. The connections behind what you know.',
    'landing.feature.editor.title': 'Block editor',
    'landing.feature.editor.desc': 'TipTap-powered pages. Headings, todos, code, embeds. Same data, multiple views.',
    'landing.feature.db.title': 'Database views',
    'landing.feature.db.desc': 'Table, Kanban, Calendar, Timeline — all reading the same content entries.',
    'landing.feature.local.title': 'Local-first + offline PWA',
    'landing.feature.local.desc': 'RxDB sync engine. Airplane mode editing. True ownership.',
    'landing.feature.api.title': 'Public REST API',
    'landing.feature.api.desc': 'Strapi-style filters, sort, pagination. API keys per workspace. OpenAPI 3.1 spec.',
    'landing.feature.webhooks.title': 'Webhooks',
    'landing.feature.webhooks.desc': 'HMAC-signed events on every create / update / delete. Wire to Slack, Zapier, anything.',

    'landing.pricing.free.name': 'Free',
    'landing.pricing.free.price': '$0',
    'landing.pricing.free.period': '/mo',
    'landing.pricing.free.bullet1': '1 workspace · 1 user',
    'landing.pricing.free.bullet2': '1,000 entries',
    'landing.pricing.free.bullet3': 'Community support',

    'landing.pricing.pro.name': 'Personal Pro',
    'landing.pricing.pro.price': '$5.99',
    'landing.pricing.pro.period': '/mo',
    'landing.pricing.pro.bullet1': 'Unlimited entries',
    'landing.pricing.pro.bullet2': '5 GB files',
    'landing.pricing.pro.bullet3': 'Public API access',
    'landing.pricing.pro.bullet4': 'Priority email',

    'landing.pricing.studio.name': 'Studio',
    'landing.pricing.studio.price': '$29',
    'landing.pricing.studio.period': '/mo',
    'landing.pricing.studio.bullet1': '10 users',
    'landing.pricing.studio.bullet2': '50 GB · SSO · audit log',
    'landing.pricing.studio.bullet3': 'Email SLA 24h',

    'landing.pricing.selfhost.name': 'Self-host',
    'landing.pricing.selfhost.price': '$0',
    'landing.pricing.selfhost.period': '· AGPL-3.0',
    'landing.pricing.selfhost.bullet1': 'Unlimited everything',
    'landing.pricing.selfhost.bullet2': 'Docker + Helm',
    'landing.pricing.selfhost.bullet3': 'Paid customization & support',

    'landing.footer.copyright': '© 2026 LifeOS',
    'landing.footer.quickstart': 'Quickstart',
    'landing.footer.selfhost': 'Self-host',
    'landing.footer.api': 'API docs',
    'landing.footer.webhooks': 'Webhooks',
    'landing.footer.privacy': 'Privacy',
    'landing.footer.terms': 'Terms',

    // Hero eyebrow + secondary CTA
    'landing.eyebrow': 'Open-source · Self-hostable · AGPL-3.0',
    'landing.cta.secondary': 'Star on GitHub',
    'landing.hero.bullet.1': 'Local-first by default — your data stays yours',
    'landing.hero.bullet.2': 'REST API + webhooks — connect anything',
    'landing.hero.bullet.3': 'Self-host or cloud — same engine, your choice',

    // Trust strip
    'landing.section.trust': 'Why teams choose LifeOS',
    'landing.trust.opensource.title': 'Open source',
    'landing.trust.opensource.desc': 'AGPL-3.0 core. Inspect, fork, or self-host every line.',
    'landing.trust.selfhost.title': 'Self-host ready',
    'landing.trust.selfhost.desc': 'Docker Compose or Helm chart. Production-grade out of the box.',
    'landing.trust.e2ee.title': 'Zero-knowledge sync',
    'landing.trust.e2ee.desc': 'Client-side encryption. We see ciphertext, never your notes.',
    'landing.trust.api.title': 'API-first',
    'landing.trust.api.desc': 'OpenAPI 3.1. Webhooks. Workspace-scoped keys. No lock-in.',

    // Who is it for
    'landing.section.who': 'Built for people who want to own their data',
    'landing.who.kw.title': 'Knowledge workers',
    'landing.who.kw.desc': 'Replace Notion + Obsidian. Bring graphs, blocks, and databases under one roof — and keep the file format open.',
    'landing.who.indie.title': 'Indie builders & devs',
    'landing.who.indie.desc': 'A headless CMS for life-data. Hit the REST API from any script, automate with webhooks, ship side projects faster.',
    'landing.who.team.title': 'Small teams',
    'landing.who.team.desc': 'Shared workspaces, fine-grained permissions, SSO and audit logs in Studio. Your team\'s second brain — without surveillance.',

    // How it works
    'landing.section.how': 'How it works',
    'landing.how.step1.title': 'Define a schema',
    'landing.how.step1.desc': 'Spin up collections (Tasks, Notes, Contacts, anything) with typed fields. Validation is built in.',
    'landing.how.step2.title': 'Capture & connect',
    'landing.how.step2.desc': 'Edit blocks, drop in [[wiki-links]], and let the knowledge graph form itself as you write.',
    'landing.how.step3.title': 'Query everywhere',
    'landing.how.step3.desc': 'Read from the REST API, push changes via webhooks, or browse table / kanban / calendar views.',

    // FAQ
    'landing.section.faq': 'Frequently asked',
    'landing.faq.q1': 'How is LifeOS priced?',
    'landing.faq.a1': 'Self-host is free forever under AGPL-3.0. LifeOS Cloud has a free tier, Personal Pro ($5.99/mo), and Studio ($29/mo for teams). All paid plans cancel anytime.',
    'landing.faq.q2': 'Can I really self-host it?',
    'landing.faq.a2': 'Yes — Docker Compose for one box, Helm chart for Kubernetes. Bring your own Postgres or use the bundled one. Full ops guide in docs/self-host.md.',
    'landing.faq.q3': 'How is sync encrypted?',
    'landing.faq.a3': 'On Cloud, all entries are encrypted client-side before they leave your device. Sync servers are blind relays — we cannot read, index, or recover your notes.',
    'landing.faq.q4': 'What happens if you shut down?',
    'landing.faq.a4': 'The code is AGPL-3.0 — anyone can keep running it. Your data exports to JSON anytime. There is no proprietary lock-in by design.',
    'landing.faq.q5': 'When does Cloud launch?',
    'landing.faq.a5': 'Pre-alpha now, public beta in 2026. Waitlist members get founder-tier pricing locked in for life.',
  },
  th: {
    'nav.home': 'หน้าแรก',
    'nav.collections': 'คอลเล็กชัน',
    'nav.graph': 'กราฟ',
    'nav.signOut': 'ออกจากระบบ',
    'nav.contentTypes': 'ประเภทเนื้อหา',
    'nav.entries': 'รายการ',
    'nav.apiKeys': 'API คีย์',
    'nav.webhooks': 'เว็บฮุก',
    'nav.audit': 'บันทึกการใช้งาน',
    'nav.waitlist': 'รายชื่อรอ',
    'nav.billing': 'การชำระเงิน',
    'nav.workspace': 'พื้นที่ทำงาน',
    'nav.permissions': 'สิทธิ์',
    'nav.invite': 'เชิญสมาชิก',
    'nav.features': 'ฟีเจอร์',
    'nav.pricing': 'ราคา',
    'nav.github': 'GitHub',
    'nav.backToHome': 'กลับหน้าแรก',
    'nav.privacy': 'นโยบายความเป็นส่วนตัว',
    'nav.terms': 'ข้อตกลงการใช้งาน',

    'auth.signIn': 'เข้าสู่ระบบ',
    'auth.signUp': 'สมัครใช้งาน',
    'auth.email': 'อีเมล',
    'auth.password': 'รหัสผ่าน',
    'auth.name': 'ชื่อ',
    'auth.continueWithGoogle': 'เข้าสู่ระบบด้วย Google',
    'auth.forgotPassword': 'ลืมรหัสผ่าน',

    'landing.headline.left': 'TodoList ของคุณ',
    'landing.headline.right': 'เป็นของคุณจริง ๆ',
    'landing.lede': 'Headless productivity OS รวม Knowledge graph + block editor + REST API ใช้บนเซิร์ฟเวอร์ตัวเอง หรือบนคลาวด์ของเรา',
    'landing.cta': 'เข้าคิวใช้งาน',
    'landing.cta.sending': 'กำลังส่ง…',
    'landing.cta.done': 'ขอบคุณค่ะ ✓',
    'landing.cta.placeholder': 'คุณ@example.com',
    'landing.microcopy': 'Pre-alpha · Core เปิดเป็น AGPL-3.0 · เปิดรับคิว Cloud แล้ว',
    'landing.section.features': 'สิ่งที่อยู่ข้างใน',
    'landing.section.pricing': 'ราคา',

    'landing.feature.graph.title': 'Knowledge graph',
    'landing.feature.graph.desc': 'ลิงก์หากันสองทิศทาง <code>[[wiki-links]]</code> พร้อมหน้าต่างตัวอย่างเมื่อชี้เมาส์ เชื่อมโยงทุกสิ่งที่คุณรู้',
    'landing.feature.editor.title': 'Block editor',
    'landing.feature.editor.desc': 'หน้าเว็บที่ทำงานด้วย TipTap รองรับหัวข้อ รายการงาน โค้ด และการฝังเนื้อหา ข้อมูลชุดเดียวแสดงผลได้หลายแบบ',
    'landing.feature.db.title': 'แสดงผลแบบฐานข้อมูล',
    'landing.feature.db.desc': 'แสดงผลในรูปแบบ ตาราง, คัมบัง, ปฏิทิน, ไทม์ไลน์ ดึงข้อมูลจากคอลเล็กชันเดียวกัน',
    'landing.feature.local.title': 'Local-first + ทำงานออฟไลน์ PWA',
    'landing.feature.local.desc': 'เครื่องมือซิงก์ข้อมูลด้วย RxDB แก้ไขข้อมูลโหมดเครื่องบินได้อย่างแท้จริง เป็นเจ้าของข้อมูลตัวจริง',
    'landing.feature.api.title': 'REST API แบบสาธารณะ',
    'landing.feature.api.desc': 'ระบบตัวกรอง จัดเรียง แบ่งหน้าแบบ Strapi พร้อม API คีย์แยกตามพื้นที่ทำงาน เอกสาร OpenAPI 3.1',
    'landing.feature.webhooks.title': 'Webhooks',
    'landing.feature.webhooks.desc': 'ส่งสัญญาณเหตุการณ์การสร้าง แก้ไข ลบ พร้อมลายเซ็น HMAC เพื่อเชื่อมกับ Slack, Zapier และบริการอื่น ๆ',

    'landing.pricing.free.name': 'ฟรี',
    'landing.pricing.free.price': '฿0',
    'landing.pricing.free.period': '/เดือน',
    'landing.pricing.free.bullet1': '1 พื้นที่ทำงาน · 1 ผู้ใช้',
    'landing.pricing.free.bullet2': '1,000 รายการข้อมูล',
    'landing.pricing.free.bullet3': 'สนับสนุนโดยคอมมูนิตี้',

    'landing.pricing.pro.name': 'Personal Pro',
    'landing.pricing.pro.price': '฿199',
    'landing.pricing.pro.period': '/เดือน',
    'landing.pricing.pro.bullet1': 'ไม่จำกัดรายการข้อมูล',
    'landing.pricing.pro.bullet2': 'พื้นที่เก็บไฟล์ 5 GB',
    'landing.pricing.pro.bullet3': 'สิทธิ์ใช้งาน API สาธารณะ',
    'landing.pricing.pro.bullet4': 'อีเมลสนับสนุนระดับพิเศษ',

    'landing.pricing.studio.name': 'Studio',
    'landing.pricing.studio.price': '฿999',
    'landing.pricing.studio.period': '/เดือน',
    'landing.pricing.studio.bullet1': 'รองรับ 10 ผู้ใช้',
    'landing.pricing.studio.bullet2': 'พื้นที่ 50 GB · SSO · ล็อกการเข้าถึง',
    'landing.pricing.studio.bullet3': 'การันตีตอบกลับอีเมลใน 24 ชม.',

    'landing.pricing.selfhost.name': 'โฮสต์เอง',
    'landing.pricing.selfhost.price': '฿0',
    'landing.pricing.selfhost.period': '· AGPL-3.0',
    'landing.pricing.selfhost.bullet1': 'ใช้งานทุกอย่างไม่จำกัด',
    'landing.pricing.selfhost.bullet2': 'รันด้วย Docker + Helm',
    'landing.pricing.selfhost.bullet3': 'บริการปรับแต่งและดูแลระบบแบบคิดค่าใช้จ่าย',

    'landing.footer.copyright': '© 2026 LifeOS',
    'landing.footer.quickstart': 'คู่มือเริ่มใช้งาน',
    'landing.footer.selfhost': 'ติดตั้งเอง',
    'landing.footer.api': 'คู่มือ API',
    'landing.footer.webhooks': 'คู่มือ Webhooks',
    'landing.footer.privacy': 'นโยบายความเป็นส่วนตัว',
    'landing.footer.terms': 'ข้อตกลงการใช้งาน',

    'landing.eyebrow': 'โอเพ่นซอร์ส · โฮสต์เองได้ · AGPL-3.0',
    'landing.cta.secondary': 'กดดาวบน GitHub',
    'landing.hero.bullet.1': 'Local-first โดยปริยาย — ข้อมูลเป็นของคุณ',
    'landing.hero.bullet.2': 'REST API + Webhooks — ต่อกับอะไรก็ได้',
    'landing.hero.bullet.3': 'โฮสต์เองหรือใช้คลาวด์ของเรา — เครื่องยนต์เดียวกัน',

    'landing.section.trust': 'ทำไมต้องเลือก LifeOS',
    'landing.trust.opensource.title': 'โอเพ่นซอร์ส',
    'landing.trust.opensource.desc': 'โค้ดส่วนหลักเป็น AGPL-3.0 ตรวจสอบ ฟอร์ก หรือโฮสต์เองได้ทุกบรรทัด',
    'landing.trust.selfhost.title': 'พร้อมโฮสต์เอง',
    'landing.trust.selfhost.desc': 'Docker Compose หรือ Helm chart พร้อมใช้บนระบบจริง',
    'landing.trust.e2ee.title': 'ซิงก์แบบ Zero-knowledge',
    'landing.trust.e2ee.desc': 'เข้ารหัสฝั่งลูกค้า เซิร์ฟเวอร์เห็นเฉพาะข้อมูลที่เข้ารหัสแล้ว',
    'landing.trust.api.title': 'API-first',
    'landing.trust.api.desc': 'OpenAPI 3.1, Webhooks, คีย์แยกตามพื้นที่ทำงาน ไม่มีการล็อกอิน',

    'landing.section.who': 'สำหรับคนที่อยากเป็นเจ้าของข้อมูลตัวเอง',
    'landing.who.kw.title': 'คนทำงานความรู้',
    'landing.who.kw.desc': 'แทนที่ Notion + Obsidian รวมกราฟ บล็อก และฐานข้อมูลไว้ที่เดียว ในรูปแบบไฟล์เปิด',
    'landing.who.indie.title': 'นักพัฒนาอิสระ',
    'landing.who.indie.desc': 'Headless CMS สำหรับข้อมูลส่วนตัว เรียก REST API จากสคริปต์ใดก็ได้ ออโต้เมตด้วย Webhooks',
    'landing.who.team.title': 'ทีมขนาดเล็ก',
    'landing.who.team.desc': 'พื้นที่ทำงานร่วม สิทธิ์ระดับละเอียด SSO และ Audit log ในแพลน Studio',

    'landing.section.how': 'วิธีใช้งาน',
    'landing.how.step1.title': 'กำหนดสคีมา',
    'landing.how.step1.desc': 'สร้างคอลเล็กชัน (งาน บันทึก ผู้ติดต่อ ฯลฯ) พร้อมฟิลด์ที่กำหนดประเภทและการตรวจสอบ',
    'landing.how.step2.title': 'บันทึกและเชื่อมโยง',
    'landing.how.step2.desc': 'แก้ไขเป็นบล็อก ใส่ [[wiki-links]] ระบบสร้างกราฟความรู้ให้อัตโนมัติ',
    'landing.how.step3.title': 'ดึงข้อมูลได้ทุกที่',
    'landing.how.step3.desc': 'เรียกผ่าน REST API ส่งเหตุการณ์ผ่าน Webhooks หรือดูในรูปแบบตาราง คัมบัง ปฏิทิน',

    'landing.section.faq': 'คำถามที่พบบ่อย',
    'landing.faq.q1': 'LifeOS คิดราคาอย่างไร?',
    'landing.faq.a1': 'โฮสต์เองฟรีตลอดภายใต้ AGPL-3.0 ส่วน Cloud มีแพลนฟรี Personal Pro ($5.99/เดือน) และ Studio ($29/เดือนสำหรับทีม) ยกเลิกได้ตลอดเวลา',
    'landing.faq.q2': 'โฮสต์เองได้จริง ๆ หรือ?',
    'landing.faq.a2': 'ได้แน่นอน — มี Docker Compose สำหรับเครื่องเดียว และ Helm chart สำหรับ Kubernetes ใช้ Postgres ของคุณเองหรือใช้ตัวที่มากับระบบก็ได้',
    'landing.faq.q3': 'การซิงก์ปลอดภัยแค่ไหน?',
    'landing.faq.a3': 'ใน Cloud ทุกรายการจะถูกเข้ารหัสฝั่งลูกค้าก่อนออกจากเครื่อง เซิร์ฟเวอร์เห็นเฉพาะข้อมูลที่เข้ารหัสแล้ว',
    'landing.faq.q4': 'ถ้าทีมเลิกทำจะเกิดอะไรขึ้น?',
    'landing.faq.a4': 'โค้ดเป็น AGPL-3.0 — ใครก็รันต่อได้ ส่งออกข้อมูลเป็น JSON ได้ตลอดเวลา ไม่มีการล็อกอินตั้งแต่แรก',
    'landing.faq.q5': 'Cloud จะเปิดเมื่อไร?',
    'landing.faq.a5': 'ตอนนี้อยู่ในช่วง pre-alpha จะเปิดเบต้าสาธารณะใน 2026 สมาชิก waitlist จะได้ราคา founder ตลอดไป',
  },
};

export function detectLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const stored = localStorage.getItem('lifeos.locale');
  if (stored === 'th' || stored === 'en') return stored;
  const lang = navigator.language?.slice(0, 2);
  return lang === 'th' ? 'th' : 'en';
}

export function setLocale(loc: Locale): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('lifeos.locale', loc);
}

export function t(key: string, locale: Locale = 'en', vars?: Record<string, string | number>): string {
  const raw = messages[locale]?.[key] ?? messages.en[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
