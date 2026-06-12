import { z } from 'zod';

export const RoleSchema = z.enum(['owner', 'admin', 'editor', 'viewer', 'member']);
export type Role = z.infer<typeof RoleSchema>;

export const FieldType = z.enum(['text', 'richtext', 'number', 'date', 'select', 'relation', 'file', 'checkbox']);
export type FieldType = z.infer<typeof FieldType>;

export const ContentTypeFieldSchema = z.object({
  name: z.string().min(1),
  type: FieldType,
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  target: z.string().optional(), // for relation: target collection slug
  multiple: z.boolean().optional(), // for file/relation
});

export const ContentTypeSchemaJson = z.object({
  fields: z.array(ContentTypeFieldSchema),
});

export const ContentTypeCreate = z.object({
  slug: z.string().min(1).max(60).regex(/^[a-z][a-z0-9-]*$/, 'lowercase letters, digits, hyphen only'),
  name: z.string().min(1).max(120),
  schema: ContentTypeSchemaJson,
});

export const ContentEntryCreate = z.object({
  contentTypeId: z.number().int().positive(),
  data: z.record(z.unknown()),
});

export const ContentEntryPatch = z.object({
  data: z.record(z.unknown()),
});

export const WorkspaceCreate = z.object({
  name: z.string().min(1).max(60),
});

export const InviteMember = z.object({
  email: z.string().email(),
  role: RoleSchema,
});

export const WebhookCreate = z.object({
  url: z.string().url(),
  events: z.array(z.enum(['afterCreate', 'afterUpdate', 'afterDelete', 'beforeDelete', 'prospect.approved'])),
  contentTypeSlug: z.string().optional(), // omit for all
});

export type ContentTypeField = z.infer<typeof ContentTypeFieldSchema>;
export type ContentTypeSchema = z.infer<typeof ContentTypeSchemaJson>;

// ── Backlinks ────────────────────────────────────────────────
const WIKI_LINK_RE = /\[\[([^\[\]\|]+?)(?:\|([^\[\]]+?))?\]\]/g;

export interface ParsedWikiLink {
  target: string;
  alias?: string;
  offset: number;
}

export function parseWikiLinks(text: string): ParsedWikiLink[] {
  if (!text) return [];
  const out: ParsedWikiLink[] = [];
  let m: RegExpExecArray | null;
  WIKI_LINK_RE.lastIndex = 0;
  while ((m = WIKI_LINK_RE.exec(text)) !== null) {
    out.push({ target: m[1].trim(), alias: m[2]?.trim(), offset: m.index });
  }
  return out;
}

export function renderWikiLinks(text: string, render: (target: string, alias: string | undefined) => string): string {
  if (!text) return '';
  return text.replace(WIKI_LINK_RE, (_, target: string, alias: string | undefined) =>
    render(target.trim(), alias?.trim())
  );
}

// ── Block model (TipTap-compatible) ──────────────────────────
export const BlockSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['heading', 'paragraph', 'todo', 'bulletList', 'orderedList', 'codeBlock', 'image', 'embed', 'callout', 'divider']),
  content: z.unknown(),
  attrs: z.record(z.unknown()).optional(),
});
export type Block = z.infer<typeof BlockSchema>;
export const PageBlocksSchema = z.array(BlockSchema);

// ── i18n ─────────────────────────────────────────────
export { t, detectLocale, setLocale, SUPPORTED_LOCALES } from './i18n';
export type { Locale } from './i18n';
