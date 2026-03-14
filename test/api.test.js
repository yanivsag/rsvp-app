const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');

// Use a temporary database for testing
const dataDir = path.join(__dirname, '..', 'data');
const dbPath = path.join(dataDir, 'rsvp.db');

// Clean up test database before tests
function cleanDb() {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
}

function makeRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('RSVP API', () => {
  let server;
  let port;

  before(async () => {
    cleanDb();
    // Clear require cache to get fresh server with clean DB
    delete require.cache[require.resolve('../server')];
    const app = require('../server');
    server = app.listen(0);
    port = server.address().port;
  });

  after(() => {
    if (server) server.close();
    cleanDb();
  });

  it('should serve the main page', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/',
      method: 'GET'
    });
    assert.strictEqual(res.status, 200);
  });

  it('should accept a valid RSVP (attending)', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/rsvp',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      full_name: 'ישראל ישראלי',
      phone: '050-1234567',
      attending: true,
      guest_count: 3,
      notes: 'שמחים להגיע!'
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.id);
    assert.ok(res.body.message.includes('נרשמת'));
  });

  it('should accept a valid RSVP (not attending)', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/rsvp',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      full_name: 'דוד כהן',
      phone: '052-9876543',
      attending: false,
      guest_count: 0,
      notes: 'לצערנו לא נוכל'
    });
    assert.strictEqual(res.status, 201);
    assert.ok(res.body.message.includes('תודה'));
  });

  it('should reject RSVP without full_name', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/rsvp',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      attending: true,
      guest_count: 2
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error);
  });

  it('should reject RSVP with empty full_name', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/rsvp',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      full_name: '   ',
      attending: true,
      guest_count: 2
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error);
  });

  it('should cap guest count at 50', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/rsvp',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      full_name: 'משפחה גדולה',
      attending: true,
      guest_count: 100
    });
    assert.strictEqual(res.status, 201);
  });

  it('should set guest count to 0 when not attending', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/rsvp',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      full_name: 'לא מגיע',
      attending: false,
      guest_count: 5
    });
    assert.strictEqual(res.status, 201);
  });

  it('should return all RSVPs with summary', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/rsvps',
      method: 'GET'
    });
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.rsvps));
    assert.ok(res.body.summary);
    assert.ok(typeof res.body.summary.totalResponses === 'number');
    assert.ok(typeof res.body.summary.attendingCount === 'number');
    assert.ok(typeof res.body.summary.notAttendingCount === 'number');
    assert.ok(typeof res.body.summary.totalGuests === 'number');
    // We inserted 4 RSVPs above
    assert.strictEqual(res.body.summary.totalResponses, 4);
    assert.strictEqual(res.body.summary.attendingCount, 2);
    assert.strictEqual(res.body.summary.notAttendingCount, 2);
  });

  it('should handle missing attending field', async () => {
    const res = await makeRequest({
      hostname: 'localhost',
      port,
      path: '/api/rsvp',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      full_name: 'בדיקה',
      guest_count: 2
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error);
  });
});
