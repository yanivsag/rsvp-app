const express = require('express');
const Database = require('better-sqlite3');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database
const db = new Database(path.join(dataDir, 'rsvp.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    phone TEXT,
    attending INTEGER NOT NULL DEFAULT 0,
    guest_count INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
  )
`);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'יותר מדי בקשות, נסו שוב מאוחר יותר' }
});
app.use('/api/', apiLimiter);

// API: Submit RSVP
app.post('/api/rsvp', (req, res) => {
  const { full_name, phone, attending, guest_count, notes } = req.body;

  if (!full_name || typeof full_name !== 'string' || full_name.trim().length === 0) {
    return res.status(400).json({ error: 'שם מלא הוא שדה חובה' });
  }

  if (typeof attending !== 'boolean' && typeof attending !== 'number') {
    return res.status(400).json({ error: 'יש לציין האם מגיעים או לא' });
  }

  const isAttending = attending ? 1 : 0;
  const guests = isAttending ? Math.max(0, Math.min(parseInt(guest_count) || 0, 50)) : 0;
  const sanitizedName = full_name.trim().substring(0, 200);
  const sanitizedPhone = phone ? String(phone).trim().substring(0, 20) : null;
  const sanitizedNotes = notes ? String(notes).trim().substring(0, 500) : null;

  try {
    const stmt = db.prepare(`
      INSERT INTO rsvps (full_name, phone, attending, guest_count, notes)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(sanitizedName, sanitizedPhone, isAttending, guests, sanitizedNotes);

    res.status(201).json({
      message: isAttending ? 'תודה! נרשמת בהצלחה' : 'תודה על העדכון',
      id: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error saving RSVP:', err);
    res.status(500).json({ error: 'אירעה שגיאה בשמירת הנתונים' });
  }
});

// API: Get all RSVPs (admin)
app.get('/api/rsvps', (req, res) => {
  try {
    const rsvps = db.prepare('SELECT * FROM rsvps ORDER BY created_at DESC').all();
    const totalAttending = db.prepare(
      'SELECT COALESCE(SUM(guest_count), 0) as total FROM rsvps WHERE attending = 1'
    ).get();
    const totalResponses = rsvps.length;
    const attendingCount = rsvps.filter(r => r.attending === 1).length;
    const notAttendingCount = rsvps.filter(r => r.attending === 0).length;

    res.json({
      rsvps,
      summary: {
        totalResponses,
        attendingCount,
        notAttendingCount,
        totalGuests: totalAttending.total
      }
    });
  } catch (err) {
    console.error('Error fetching RSVPs:', err);
    res.status(500).json({ error: 'אירעה שגיאה בטעינת הנתונים' });
  }
});

// Serve the main page for all non-API routes
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`RSVP server running on http://localhost:${PORT}`);
  });
}

module.exports = app;
