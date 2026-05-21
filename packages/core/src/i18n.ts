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
    'landing.microcopy': 'Pre-alpha. AGPL-3.0 core · Cloud waitlist open.',
    'landing.section.features': 'What\'s inside',
    'landing.section.pricing': 'Pricing',
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
    'landing.microcopy': 'Pre-alpha · Core เปิดเป็น AGPL-3.0 · เปิดรับคิว Cloud แล้ว',
    'landing.section.features': 'สิ่งที่อยู่ข้างใน',
    'landing.section.pricing': 'ราคา',
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
