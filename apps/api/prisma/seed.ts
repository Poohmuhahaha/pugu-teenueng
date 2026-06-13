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

  // ── Second Brain (PARA) Relational Content Types ──────────────────────
  const types = [
    {
      slug: 'areas',
      name: 'Areas',
      schema: { fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'richtext' },
        { name: 'icon', type: 'text' },
      ] },
    },
    {
      slug: 'projects',
      name: 'Projects',
      schema: { fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'status', type: 'select', options: ['planned', 'in-progress', 'completed', 'paused'] },
        { name: 'dueDate', type: 'date' },
        { name: 'area', type: 'relation', target: 'areas' },
        { name: 'notes', type: 'richtext' },
      ] },
    },
    {
      slug: 'tasks',
      name: 'Tasks',
      schema: { fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'status', type: 'select', options: ['todo', 'doing', 'done'] },
        { name: 'priority', type: 'select', options: ['low', 'medium', 'high', 'urgent'] },
        { name: 'project', type: 'relation', target: 'projects' },
      ] },
    },
    {
      slug: 'resources',
      name: 'Resources',
      schema: { fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'category', type: 'select', options: ['article', 'book', 'video', 'course', 'snippet'] },
        { name: 'url', type: 'text' },
        { name: 'area', type: 'relation', target: 'areas' },
        { name: 'content', type: 'richtext' },
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

  // ── Seed Entries (Second Brain) ──────────────────────────────────────────
  const areasId = typeRows.get('areas')!.id;
  const projectsId = typeRows.get('projects')!.id;
  const tasksId = typeRows.get('tasks')!.id;
  const resourcesId = typeRows.get('resources')!.id;

  // Insert Areas
  const area1 = await db.contentEntry.create({ data: { contentTypeId: areasId, workspaceId: ws.id, createdById: user.id, data: { title: 'Health & Fitness', icon: '💪', description: 'Everything related to my physical and mental wellbeing.' } } });
  const area2 = await db.contentEntry.create({ data: { contentTypeId: areasId, workspaceId: ws.id, createdById: user.id, data: { title: 'Business & Career', icon: '💼', description: 'Professional growth, projects, and ventures.' } } });

  // Insert Projects
  const proj1 = await db.contentEntry.create({ data: { contentTypeId: projectsId, workspaceId: ws.id, createdById: user.id, data: { title: 'Run a Half-Marathon', status: 'in-progress', area: String(area1.id), notes: 'Training plan is set for 12 weeks.' } } });
  const proj2 = await db.contentEntry.create({ data: { contentTypeId: projectsId, workspaceId: ws.id, createdById: user.id, data: { title: 'Launch QuestPage V2', status: 'planned', area: String(area2.id), notes: 'Need to finish the relational database graph first.' } } });

  // Insert Tasks
  await db.contentEntry.create({ data: { contentTypeId: tasksId, workspaceId: ws.id, createdById: user.id, data: { title: 'Buy new running shoes', status: 'done', priority: 'high', project: String(proj1.id) } } });
  await db.contentEntry.create({ data: { contentTypeId: tasksId, workspaceId: ws.id, createdById: user.id, data: { title: 'Run 10km on weekend', status: 'todo', priority: 'medium', project: String(proj1.id) } } });
  await db.contentEntry.create({ data: { contentTypeId: tasksId, workspaceId: ws.id, createdById: user.id, data: { title: 'Design database schema', status: 'doing', priority: 'urgent', project: String(proj2.id) } } });
  await db.contentEntry.create({ data: { contentTypeId: tasksId, workspaceId: ws.id, createdById: user.id, data: { title: 'Implement graph UI', status: 'doing', priority: 'high', project: String(proj2.id) } } });

  // Insert Resources
  await db.contentEntry.create({ data: { contentTypeId: resourcesId, workspaceId: ws.id, createdById: user.id, data: { title: 'Building a Second Brain - Book Notes', category: 'book', area: String(area2.id), content: 'Ideas on how to organize digital information using PARA.' } } });
  await db.contentEntry.create({ data: { contentTypeId: resourcesId, workspaceId: ws.id, createdById: user.id, data: { title: 'Best Running Form Tips', category: 'video', url: 'https://youtube.com/example', area: String(area1.id), content: 'Keep your back straight and land on midfoot.' } } });


  console.log('Seed complete:');
  console.log(`  User:       ${email} (id=${user.id})`);
  console.log(`  Dashboard:     ${ws.slug} (id=${ws.id})`);
  console.log(`  Types:      ${types.map((t) => t.slug).join(', ')}`);
  console.log(`  Entries:    10 across ${types.length} types with Relation links`);
  console.log(`  Password:   ${password}  ← change before sharing this DB`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
