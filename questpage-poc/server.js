import express from 'express';
import { JSONFilePreset } from 'lowdb/node';
import crypto from 'crypto';

const defaultData = { prospects: [] };
const db = await JSONFilePreset('db.json', defaultData);

const app = express();
const port = 3000;

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/favicon.ico', (req, res) => res.status(204).end());

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:8080/webhook';

app.post('/api/prospects', async (req, res) => {
  const { id, name, email, ...rest } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  const prospectId = id || crypto.randomUUID();

  if (id) {
    const existing = db.data.prospects.find(p => p.id === id);
    if (existing) {
      return res.status(409).json({ error: 'ID already exists' });
    }
  }

  const newProspect = {
    id: prospectId,
    name,
    email,
    status: 'pending',
    ...rest,
  };

  db.data.prospects.push(newProspect);
  await db.write();

  res.status(201).json(newProspect);
});

app.get('/api/prospects', (req, res) => {
  res.status(200).json(db.data.prospects);
});

app.patch('/api/prospects/:id', async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const prospectIndex = db.data.prospects.findIndex(p => p.id === id);
  if (prospectIndex === -1) {
    return res.status(404).json({ error: 'Prospect not found' });
  }

  const prospect = db.data.prospects[prospectIndex];
  const updatedProspect = { ...prospect, ...updates };
  db.data.prospects[prospectIndex] = updatedProspect;
  await db.write();

  if (updates.status === 'approved') {
    try {
      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': 'secret-agent-key'
        },
        body: JSON.stringify({
          id: updatedProspect.id,
          status: updatedProspect.status,
          data: updatedProspect
        })
      });
      console.log(`Webhook triggered for ID: ${updatedProspect.id}`);
    } catch (err) {
      console.error('Webhook failed:', err.message);
    }
  }

  res.json(updatedProspect);
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
