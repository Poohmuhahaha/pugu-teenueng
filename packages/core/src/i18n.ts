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
