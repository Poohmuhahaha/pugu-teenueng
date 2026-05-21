import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL ?? 'pooh@lifeos.dev';
  const password = process.env.SEED_PASSWORD ?? 'changeme123';
  const name = process.env.SEED_NAME ?? 'Pooh';

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, name, passwordHash },
  });

  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${user.id}`;
  const ws = await db.workspace.upsert({
    where: { slug },
    update: {},
    create: {
      name: `${name}'s Workspace`,
      slug,
      members: { create: { userId: user.id, role: 'owner' } },
    },
  });

  // ── Three demo content types ───────────────────────────────────────
  const types = [
    {
      slug: 'personal-crm',
      name: 'Personal CRM',
      schema: { fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'email', type: 'text' },
        { name: 'company', type: 'text' },
        { name: 'relationship', type: 'select', options: ['family', 'friend', 'colleague', 'client', 'other'] },
        { name: 'lastContacted', type: 'date' },
        { name: 'notes', type: 'richtext' },
      ] },
    },
    {
      slug: 'reading-log',
      name: 'Reading Log',
      schema: { fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'author', type: 'text' },
        { name: 'type', type: 'select', options: ['book', 'article', 'podcast', 'video', 'other'] },
        { name: 'status', type: 'select', options: ['queue', 'reading', 'done', 'abandoned'] },
        { name: 'rating', type: 'number' },
        { name: 'notes', type: 'richtext' },
      ] },
    },
    {
      slug: 'projects',
      name: 'Projects',
      schema: { fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'status', type: 'select', options: ['idea', 'active', 'shipped', 'paused', 'killed'] },
        { name: 'dueDate', type: 'date' },
        { name: 'priority', type: 'select', options: ['low', 'med', 'high'] },
        { name: 'notes', type: 'richtext' },
      ] },
    },
  ];

  const typeRows = new Map<string, { id: number }>();
  for (const ct of types) {
    const row = await db.contentType.upsert({
      where: { workspaceId_slug: { workspaceId: ws.id, slug: ct.slug } },
      update: { schema: ct.schema, name: ct.name },
      create: { workspaceId: ws.id, slug: ct.slug, name: ct.name, schema: ct.schema },
    });
    typeRows.set(ct.slug, row);
  }

  // Free subscription stub
  await db.subscription.upsert({
    where: { workspaceId: ws.id },
    update: {},
    create: { workspaceId: ws.id, plan: 'free', status: 'active' },
  });

  // ── Entries with cross-content-type [[wiki-links]] ─────────────────
  const crmId = typeRows.get('personal-crm')!.id;
  const readId = typeRows.get('reading-log')!.id;
  const projId = typeRows.get('projects')!.id;

  const entries: Array<{ contentTypeId: number; data: Record<string, unknown> }> = [
    // Personal CRM
    { contentTypeId: crmId, data: { title: 'Alice', email: 'alice@example.com', company: 'Acme', relationship: 'colleague', notes: 'Met at the meetup. Could pair on [[LifeOS Launch]].' } },
    { contentTypeId: crmId, data: { title: 'Bob', email: 'bob@example.com', company: 'Indie', relationship: 'mentor', notes: 'Long-time mentor. Introduced me to [[Alice]] originally.' } },
    { contentTypeId: crmId, data: { title: 'Carol', email: 'carol@example.com', relationship: 'friend', notes: 'Recommended [[Atomic Habits]] — definitely worth the read.' } },
    { contentTypeId: crmId, data: { title: 'Dan', email: 'dan@example.com', company: 'Studio', relationship: 'client', notes: 'Signed off on the [[Brand Refresh]] mockups last week.' } },
    { contentTypeId: crmId, data: { title: 'Eve', email: 'eve@example.com', relationship: 'family', notes: 'Mom\'s sister.' } },

    // Reading log
    { contentTypeId: readId, data: { title: 'Atomic Habits', author: 'James Clear', type: 'book', status: 'done', rating: 4, notes: 'The 1% improvement framing is the keeper.' } },
    { contentTypeId: readId, data: { title: 'Show Your Work', author: 'Austin Kleon', type: 'book', status: 'reading', rating: 5, notes: 'Triggered the launch plan for [[LifeOS Launch]].' } },
    { contentTypeId: readId, data: { title: 'The Mom Test', author: 'Rob Fitzpatrick', type: 'book', status: 'queue', rating: 0, notes: 'For [[Brand Refresh]] user interviews.' } },
    { contentTypeId: readId, data: { title: 'Lenny\'s Newsletter — PMM playbook', author: 'Lenny Rachitsky', type: 'article', status: 'done', rating: 4, notes: '' } },
    { contentTypeId: readId, data: { title: 'How I Built This — Stripe', author: 'Guy Raz', type: 'podcast', status: 'done', rating: 5, notes: '' } },

    // Projects
    { contentTypeId: projId, data: { title: 'LifeOS Launch', status: 'active', priority: 'high', notes: 'OSS release + landing → ProductHunt. Need [[Bob]] for the launch tweet quote.' } },
    { contentTypeId: projId, data: { title: 'Brand Refresh', status: 'active', priority: 'med', notes: 'Working with [[Dan]]\'s team. Inspired by [[The Mom Test]] for the research phase.' } },
    { contentTypeId: projId, data: { title: 'Newsletter MVP', status: 'idea', priority: 'low', notes: 'Weekly digest of LifeOS templates.' } },
    { contentTypeId: projId, data: { title: 'Cohort onboarding', status: 'paused', priority: 'med', notes: 'Park until [[LifeOS Launch]] ships.' } },
    { contentTypeId: projId, data: { title: 'Stripe payment retry experiment', status: 'shipped', priority: 'low', notes: 'Reduced failed-charge churn by ~12%.' } },
  ];

  for (const e of entries) {
    // Avoid id collisions by checking title + contentType
    const existing = await db.contentEntry.findFirst({
      where: { contentTypeId: e.contentTypeId, data: { path: ['title'], equals: (e.data as { title?: string }).title } },
    });
    if (existing) continue;
    await db.contentEntry.create({
      data: {
        contentTypeId: e.contentTypeId,
        workspaceId: ws.id,
        createdById: user.id,
        data: e.data,
      },
    });
  }

  console.log('Seed complete:');
  console.log(`  User:       ${email} (id=${user.id})`);
  console.log(`  Workspace:  ${ws.slug} (id=${ws.id})`);
  console.log(`  Types:      ${types.map((t) => t.slug).join(', ')}`);
  console.log(`  Entries:    ${entries.length} across ${types.length} types with cross-type [[wiki-links]]`);
  console.log(`  Password:   ${password}  ← change before sharing this DB`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
