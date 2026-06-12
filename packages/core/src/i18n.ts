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
    'nav.collections': 'Quest Boards',
    'nav.graph': 'Quest Map',
    'nav.signOut': 'Sign out',
    'nav.contentTypes': 'Quest Types',
    'nav.entries': 'Browse Entries',
    'nav.apiKeys': 'Workspace Seals',
    'nav.webhooks': 'Messenger Birds',
    'nav.audit': 'Dashboard Chronicles',
    'nav.waitlist': 'Waitlist',
    'nav.billing': 'Dashboard Tab',
    'nav.workspace': 'Dashboard',
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

    'landing.headline.left': 'Every goal is a quest.',
    'landing.headline.right': 'Every day is an adventure.',
    'landing.lede': 'An AI-powered secretary that turns your daily life, work, and finances into a fantasy tavern quest board. Self-host or run on our cloud.',
    'landing.cta': 'Join waitlist',
    'landing.cta.sending': 'Sending…',
    'landing.cta.done': 'Thanks! ✓',
    'landing.cta.placeholder': 'you@example.com',
    'landing.microcopy': 'Pre-alpha. AGPL-3.0 core · Cloud waitlist open.',
    'landing.section.features': 'What\'s inside the Dashboard',
    'landing.section.pricing': 'Workspace Contribution (Pricing)',

    'landing.feature.graph.title': 'Quest Map',
    'landing.feature.graph.desc': 'Bi-directional <code>[[wiki-links]]</code> with hover-preview. Discover the hidden connections on your journey.',
    'landing.feature.editor.title': 'Documentation editor',
    'landing.feature.editor.desc': 'TipTap-powered scrolls. Headings, todos, code, embeds. Same data, multiple RPG views.',
    'landing.feature.db.title': 'Board views',
    'landing.feature.db.desc': 'Table, Kanban, Calendar, Timeline — all reading the same Quest Board entries.',
    'landing.feature.local.title': 'Local-first + offline PWA',
    'landing.feature.local.desc': 'RxDB sync engine. Offline journaling at camp. True ownership.',
    'landing.feature.api.title': 'Workspace Seal API',
    'landing.feature.api.desc': 'Strapi-style filters, sort, pagination. Workspace seals per tavern. OpenAPI 3.1 spec.',
    'landing.feature.webhooks.title': 'Messenger Birds',
    'landing.feature.webhooks.desc': 'HMAC-signed events sent via messenger birds on every change. Wire to external guilds.',

    'landing.pricing.free.name': 'Free',
    'landing.pricing.free.price': '$0',
    'landing.pricing.free.period': '/mo',
    'landing.pricing.free.bullet1': '1 Dashboard · 1 Adventurer',
    'landing.pricing.free.bullet2': '1,000 Entries',
    'landing.pricing.free.bullet3': 'Community Support',

    'landing.pricing.pro.name': 'Adventurer Pro',
    'landing.pricing.pro.price': '$5.99',
    'landing.pricing.pro.period': '/mo',
    'landing.pricing.pro.bullet1': 'Unlimited Entries',
    'landing.pricing.pro.bullet2': '5 GB Storage',
    'landing.pricing.pro.bullet3': 'Workspace Seal API Access',
    'landing.pricing.pro.bullet4': 'Priority Support',

    'landing.pricing.studio.name': 'Admin',
    'landing.pricing.studio.price': '$29',
    'landing.pricing.studio.period': '/mo',
    'landing.pricing.studio.bullet1': '10 Adventurers',
    'landing.pricing.studio.bullet2': '50 GB · SSO · Dashboard Chronicles',
    'landing.pricing.studio.bullet3': 'Fast Support Response',

    'landing.pricing.selfhost.name': 'Self-host',
    'landing.pricing.selfhost.price': '$0',
    'landing.pricing.selfhost.period': '· AGPL-3.0',
    'landing.pricing.selfhost.bullet1': 'Unlimited everything',
    'landing.pricing.selfhost.bullet2': 'Docker + Helm',
    'landing.pricing.selfhost.bullet3': 'Paid customization & support',

    'landing.footer.copyright': '© 2026 QuestPage',
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
    'landing.section.trust': 'Why adventurers choose QuestPage',
    'landing.trust.opensource.title': 'Open source',
    'landing.trust.opensource.desc': 'AGPL-3.0 core. Inspect, fork, or self-host every line.',
    'landing.trust.selfhost.title': 'Self-host ready',
    'landing.trust.selfhost.desc': 'Docker Compose or Helm chart. Production-grade out of the box.',
    'landing.trust.e2ee.title': 'Zero-knowledge sync',
    'landing.trust.e2ee.desc': 'Client-side encryption. We see ciphertext, never your notes.',
    'landing.trust.api.title': 'API-first',
    'landing.trust.api.desc': 'OpenAPI 3.1. Webhooks. Workspace-scoped keys. No lock-in.',

    // Who is it for
    'landing.section.who': 'Built for adventurers who want to own their data',
    'landing.who.kw.title': 'Scholars & Scribes',
    'landing.who.kw.desc': 'Replace standard SaaS editors. Bring maps, scrolls, and quest boards under one roof — and keep your spellbooks open.',
    'landing.who.indie.title': 'Dashboard Keepers & Mages',
    'landing.who.indie.desc': 'A headless engine for life-data. Hit the Workspace API from any script, automate with Messenger Birds, and craft spells faster.',
    'landing.who.team.title': 'Adventuring Parties',
    'landing.who.team.desc': 'Shared taverns, fine-grained guild ranks, SSO and Dashboard Chronicles. Your party\'s second brain — without corporate surveillance.',

    // How it works
    'landing.section.how': 'How it works',
    'landing.how.step1.title': 'Define a Quest Type',
    'landing.how.step1.desc': 'Spin up Quest Boards (Quests, Gold, Integrations, Spells) with typed scroll fields. Validation is built in.',
    'landing.how.step2.title': 'Capture & Connect',
    'landing.how.step2.desc': 'Write your chronicle, drop in [[wiki-links]], and watch your Quest Map weave itself.',
    'landing.how.step3.title': 'Dispatch Everywhere',
    'landing.how.step3.desc': 'Query the Workspace API, send Messenger Birds, or view your logs in board, kanban, or map views.',

    // FAQ
    'landing.section.faq': 'Frequently asked',
    'landing.faq.q1': 'How is QuestPage priced?',
    'landing.faq.a1': 'Self-host is free forever under AGPL-3.0. QuestPage Cloud has a free tier, Personal Pro ($5.99/mo), and Studio ($29/mo for teams). All paid plans cancel anytime.',
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
    'nav.collections': 'บอร์ดเควส',
    'nav.graph': 'แผนที่เควส',
    'nav.signOut': 'ออกจากระบบ',
    'nav.contentTypes': 'ประเภทเควส',
    'nav.entries': 'รายการ',
    'nav.apiKeys': 'ตราประทับกิลด์',
    'nav.webhooks': 'นกส่งสาร',
    'nav.audit': 'พงศาวดารร้านเหล้า',
    'nav.waitlist': 'รายชื่อรอ',
    'nav.billing': 'ค่าบำรุงกิลด์',
    'nav.workspace': 'ร้านเหล้า',
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

    'landing.headline.left': 'ทุกเป้าหมายคือเควส',
    'landing.headline.right': 'ทุกวันคือผจญภัย',
    'landing.lede': 'ผู้ช่วย AI อัจฉริยะที่จะช่วยจัดการชีวิต การงาน และการเงินของคุณ โดยเปลี่ยนทุกอย่างให้เป็นเควสในร้านเหล้าแฟนตาซี โฮสต์เองได้ ข้อมูลเป็นของคุณ 100%',
    'landing.cta': 'เข้าคิวใช้งาน',
    'landing.cta.sending': 'กำลังส่ง…',
    'landing.cta.done': 'ขอบคุณค่ะ ✓',
    'landing.cta.placeholder': 'คุณ@example.com',
    'landing.microcopy': 'Pre-alpha · Core เปิดเป็น AGPL-3.0 · เปิดรับคิว Cloud แล้ว',
    'landing.section.features': 'กระดานเควสในร้านเหล้า',
    'landing.section.pricing': 'ค่าบำรุงกิลด์ (ราคา)',

    'landing.feature.graph.title': 'แผนที่เควส',
    'landing.feature.graph.desc': 'ลิงก์หากันสองทิศทาง <code>[[wiki-links]]</code> ค้นพบความเชื่อมโยงที่ซ่อนอยู่ในการเดินทางของคุณ',
    'landing.feature.editor.title': 'สมุดเวทมนตร์',
    'landing.feature.editor.desc': 'บันทึกตำราด้วยสมุดเวทมนตร์ TipTap รองรับหัวข้อ รายการงาน คาถา และการฝังข้อมูล RPG',
    'landing.feature.db.title': 'มุมมองกระดานเควส',
    'landing.feature.db.desc': 'แสดงผลในรูปแบบ ตาราง, คัมบัง, ปฏิทิน, ไทม์ไลน์ ดึงข้อมูลจากบอร์ดเควสเดียวกัน',
    'landing.feature.local.title': 'Local-first + ทำงานออฟไลน์ PWA',
    'landing.feature.local.desc': 'บันทึกประวัติการผจญภัยที่ค่ายพักผ่อนได้แม้ออฟไลน์ด้วยระบบซิงก์ข้อมูล RxDB ข้อมูลเป็นของคุณอย่างแท้จริง',
    'landing.feature.api.title': 'API ตราประทับกิลด์',
    'landing.feature.api.desc': 'ระบบตัวกรอง จัดเรียง แบ่งหน้าแบบ Strapi พร้อมตราประทับกิลด์แยกตามร้านเหล้า เอกสาร OpenAPI 3.1',
    'landing.feature.webhooks.title': 'นกส่งสาร',
    'landing.feature.webhooks.desc': 'ส่งสัญญาณเหตุการณ์เมื่อเกิดความเปลี่ยนแปลงผ่านนกส่งสารพร้อมลายเซ็น HMAC เพื่อเชื่อมกับกิลด์ภายนอก',

    'landing.pricing.free.name': 'ฟรี',
    'landing.pricing.free.price': '฿0',
    'landing.pricing.free.period': '/เดือน',
    'landing.pricing.free.bullet1': '1 ร้านเหล้า · 1 นักผจญภัย',
    'landing.pricing.free.bullet2': '1,000 รายการข้อมูล',
    'landing.pricing.free.bullet3': 'สนับสนุนโดยคอมมูนิตี้',

    'landing.pricing.pro.name': 'นักผจญภัย Pro',
    'landing.pricing.pro.price': '฿199',
    'landing.pricing.pro.period': '/เดือน',
    'landing.pricing.pro.bullet1': 'ไม่จำกัดรายการข้อมูล',
    'landing.pricing.pro.bullet2': 'พื้นที่เก็บไฟล์ 5 GB',
    'landing.pricing.pro.bullet3': 'สิทธิ์ใช้งาน API ตราประทับกิลด์',
    'landing.pricing.pro.bullet4': 'สนับสนุนระดับพิเศษ',

    'landing.pricing.studio.name': 'กิลด์มาสเตอร์',
    'landing.pricing.studio.price': '฿999',
    'landing.pricing.studio.period': '/เดือน',
    'landing.pricing.studio.bullet1': 'รองรับ 10 นักผจญภัย',
    'landing.pricing.studio.bullet2': 'พื้นที่ 50 GB · SSO · พงศาวดารร้านเหล้า',
    'landing.pricing.studio.bullet3': 'การันตีการตอบกลับด่วนพิเศษ',

    'landing.pricing.selfhost.name': 'โฮสต์เอง',
    'landing.pricing.selfhost.price': '฿0',
    'landing.pricing.selfhost.period': '· AGPL-3.0',
    'landing.pricing.selfhost.bullet1': 'ใช้งานทุกอย่างไม่จำกัด',
    'landing.pricing.selfhost.bullet2': 'รันด้วย Docker + Helm',
    'landing.pricing.selfhost.bullet3': 'บริการปรับแต่งและดูแลระบบแบบคิดค่าใช้จ่าย',

    'landing.footer.copyright': '© 2026 QuestPage',
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

    'landing.section.trust': 'ทำไมต้องเลือก QuestPage',
    'landing.trust.opensource.title': 'โอเพ่นซอร์ส',
    'landing.trust.opensource.desc': 'โค้ดส่วนหลักเป็น AGPL-3.0 ตรวจสอบ ฟอร์ก หรือโฮสต์เองได้ทุกบรรทัด',
    'landing.trust.selfhost.title': 'พร้อมโฮสต์เอง',
    'landing.trust.selfhost.desc': 'Docker Compose หรือ Helm chart พร้อมใช้บนระบบจริง',
    'landing.trust.e2ee.title': 'ซิงก์แบบ Zero-knowledge',
    'landing.trust.e2ee.desc': 'เข้ารหัสฝั่งลูกค้า เซิร์ฟเวอร์เห็นเฉพาะข้อมูลที่เข้ารหัสแล้ว',
    'landing.trust.api.title': 'API-first',
    'landing.trust.api.desc': 'OpenAPI 3.1, Webhooks, คีย์แยกตามพื้นที่ทำงาน ไม่มีการล็อกอิน',
    'landing.section.who': 'สำหรับนักผจญภัยที่อยากเป็นเจ้าของข้อมูลตัวเอง',
    'landing.who.kw.title': 'นักปราชญ์และอาลักษณ์',
    'landing.who.kw.desc': 'แทนที่ระบบบันทึกแบบเก่า รวมแผนที่เควส สมุดเวทมนตร์ และบอร์ดเควสไว้ในที่เดียวในรูปแบบไฟล์เปิด',
    'landing.who.indie.title': 'คนเฝ้าร้านเหล้าและผู้วิเศษ',
    'landing.who.indie.desc': 'ระบบหลังบ้านสำหรับชีวิตคนรัก RPG เรียกใช้งาน API ตราประทับกิลด์จากสคริปต์ใดก็ได้ ออโต้เมตด้วยนกส่งสาร',
    'landing.who.team.title': 'ปาร์ตี้นักผจญภัย',
    'landing.who.team.desc': 'ร้านเหล้าที่ใช้ร่วมกัน สิทธิ์สมาชิกกิลด์ SSO และพงศาวดารร้านเหล้าในแพลนกิลด์มาสเตอร์',

    // วิธีใช้งาน
    'landing.section.how': 'วิธีใช้งาน',
    'landing.how.step1.title': 'กำหนดประเภทเควส',
    'landing.how.step1.desc': 'สร้างบอร์ดเควส (เควส, ทอง, น้ำยาเวทมนตร์, คาถา) พร้อมฟิลด์ในม้วนคัมภีร์และการตรวจสอบข้อมูล',
    'landing.how.step2.title': 'บันทึกและเชื่อมโยง',
    'landing.how.step2.desc': 'จดบันทึกการเดินทาง ใส่ [[wiki-links]] แล้วให้ระบบเชื่อมโยงแผนที่เควสให้อัตโนมัติ',
    'landing.how.step3.title': 'ส่งข่าวด่วนทุกที่',
    'landing.how.step3.desc': 'เรียกใช้งานผ่าน API ตราประทับกิลด์ ส่งเหตุการณ์ผ่านนกส่งสาร หรือดูบอร์ดเควส คัมบัง ปฏิทิน',

    'landing.section.faq': 'คำถามที่พบบ่อย',
    'landing.faq.q1': 'QuestPage คิดราคาอย่างไร?',
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
  const stored = localStorage.getItem('questpage.locale');
  if (stored === 'th' || stored === 'en') return stored;
  const lang = navigator.language?.slice(0, 2);
  return lang === 'th' ? 'th' : 'en';
}

export function setLocale(loc: Locale): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('questpage.locale', loc);
}

export function t(key: string, locale: Locale = 'en', vars?: Record<string, string | number>): string {
  const raw = messages[locale]?.[key] ?? messages.en[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
