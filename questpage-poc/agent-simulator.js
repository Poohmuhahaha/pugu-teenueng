import http from 'http';

const WEBHOOK_PORT = 8080;
const API_URL = 'http://localhost:3000/api/prospects';

// Sample data to simulate AI Agent finding leads
const leads = [
  { name: 'John Doe', email: 'john@example.com', phone: '081-111-1111' },
  { name: 'Jane Smith', email: 'jane@example.com', phone: '082-222-2222' },
  { name: 'Alice Wong', email: 'alice@example.com', phone: '083-333-3333' },
  { name: 'Bob Marley', email: 'bob@example.com', phone: '084-444-4444' },
  { name: 'Charlie Puth', email: 'charlie@example.com', phone: '085-555-5555' }
];

// 1. Webhook Listener
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const payload = JSON.parse(body);
      console.log(`\n[Agent] Approved: ${payload.id} พร้อมดำเนินการขั้นต่อไป`);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(WEBHOOK_PORT, () => {
  console.log(`🤖 Agent Simulator listening for webhooks at http://localhost:${WEBHOOK_PORT}/webhook`);
});

// 2. Loop sending POST requests
function getRandomLead() {
  const base = leads[Math.floor(Math.random() * leads.length)];
  const randomStr = Math.random().toString(36).substring(7);
  return {
    ...base,
    id: `lead-${randomStr}`,
    email: `random-${randomStr}@example.com`,
    phone: `089-${Math.floor(1000000 + Math.random() * 9000000)}`
  };
}

async function sendLead() {
  const lead = getRandomLead();
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(lead)
    });
    
    if (response.ok) {
      console.log(`[Agent] Sent new lead: ${lead.name} (${lead.id})`);
    } else {
      console.log(`[Agent] Failed to send lead: ${response.status}`);
    }
  } catch (error) {
    console.log(`[Agent] Error sending lead (Is server.js running?): ${error.message}`);
  }
}

// Send a lead every 5 seconds
setInterval(sendLead, 5000);
// Send one immediately
sendLead();
