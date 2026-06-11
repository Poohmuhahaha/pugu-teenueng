import { createRequire } from 'node:module';
import bcrypt from 'bcryptjs';
const require = createRequire(import.meta.url);
const { PrismaClient } = require('custom-prisma-client');

const db = new PrismaClient();

async function main() {
  const email = process.env.SEED_EMAIL ?? 'pooh@questpage.app';
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
      name: `${name}'s Dashboard`,
      slug,
      members: { create: { userId: user.id, role: 'owner' } },
    },
  });

  // ── Four RPG demo content types ───────────────────────────────────────
  const types = [
    {
      slug: 'tavern-quests',
      name: 'Dashboard Quests',
      schema: { fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'difficulty', type: 'select', options: ['trivial', 'easy', 'medium', 'hard', 'epic'] },
        { name: 'goldReward', type: 'number' },
        { name: 'xpReward', type: 'number' },
        { name: 'status', type: 'select', options: ['available', 'active', 'completed', 'failed'] },
        { name: 'dueDate', type: 'date' },
        { name: 'questGiver', type: 'text' },
        { name: 'notes', type: 'richtext' },
      ] },
    },
    {
      slug: 'gold-purse',
      name: 'Revenue Tracker',
      schema: { fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'amount', type: 'number', required: true },
        { name: 'type', type: 'select', options: ['loot', 'tribute', 'supply_cost', 'tavern_tab', 'other'] },
        { name: 'transactionDate', type: 'date' },
        { name: 'merchant', type: 'text' },
        { name: 'notes', type: 'richtext' },
      ] },
    },
    {
      slug: 'elixir-rations',
      name: 'Integration & Rations',
      schema: { fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'type', type: 'select', options: ['elixir', 'ration', 'potion', 'herb', 'rest'] },
        { name: 'quality', type: 'select', options: ['poor', 'common', 'fine', 'exquisite', 'masterwork'] },
        { name: 'quantity', type: 'number' },
        { name: 'effects', type: 'text' },
        { name: 'loggedAt', type: 'date' },
        { name: 'notes', type: 'richtext' },
      ] },
    },
    {
      slug: 'spellbook',
      name: 'Documentation',
      schema: { fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'school', type: 'select', options: ['abjuration', 'conjuration', 'divination', 'enchantment', 'evocation', 'illusion', 'necromancy', 'transmutation', 'lore'] },
        { name: 'manaCost', type: 'number' },
        { name: 'source', type: 'text' },
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
  const questsId = typeRows.get('tavern-quests')!.id;
  const goldId = typeRows.get('gold-purse')!.id;
  const elixirId = typeRows.get('elixir-rations')!.id;
  const spellsId = typeRows.get('spellbook')!.id;

  const entries: Array<{ contentTypeId: number; data: Record<string, unknown> }> = [
    // Dashboard Quests
    { contentTypeId: questsId, data: { title: 'Launch Campaign', difficulty: 'hard', goldReward: 50, xpReward: 200, status: 'active', notes: 'Complete the landing page draft. Requires drinking a [[Focus Feature]].' } },
    { contentTypeId: questsId, data: { title: 'Clean the Workspace Hall', difficulty: 'easy', goldReward: 10, xpReward: 50, status: 'available', notes: 'Tidy up the office guild hall desk.' } },
    { contentTypeId: questsId, data: { title: 'Analyze Competitors', difficulty: 'medium', goldReward: 25, xpReward: 100, status: 'completed', notes: 'Finished reading [[The Mythical Man-Month]]. Found some valuable insights.' } },

    // Revenue Tracker
    { contentTypeId: goldId, data: { title: 'Bounty payment for landing page', amount: 150, type: 'loot', notes: 'Paid by the merchant guild.' } },
    { contentTypeId: goldId, data: { title: 'Bought 3 drafts of Dwarven Stout', amount: 12, type: 'tavern_tab', notes: 'At the Prancing Pony. Met an interesting rogue.' } },
    { contentTypeId: goldId, data: { title: 'Purchase Spell Components', amount: 45, type: 'supply_cost', notes: 'Bought premium ink for the [[Documentation]].' } },

    // Integration & Rations
    { contentTypeId: elixirId, data: { title: 'Focus Feature', type: 'potion', quality: 'fine', quantity: 1, effects: '+2 Concentration', notes: 'Helped with the quest [[Launch Campaign]].' } },

    // Documentation
    { contentTypeId: spellsId, data: { title: 'Focus Feature', school: 'transmutation', manaCost: 15, source: 'Alchemist Workspace Guidebook', notes: 'A powerful recipe. Boosts productivity.' } },
    { contentTypeId: spellsId, data: { title: 'The Mythical Man-Month', school: 'lore', source: 'Ancient Library of Brooks', notes: 'Adding more mages to a late project makes it later.' } },
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
  console.log(`  Dashboard:     ${ws.slug} (id=${ws.id})`);
  console.log(`  Types:      ${types.map((t) => t.slug).join(', ')}`);
  console.log(`  Entries:    ${entries.length} across ${types.length} types with cross-type [[wiki-links]]`);
  console.log(`  Password:   ${password}  ← change before sharing this DB`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
