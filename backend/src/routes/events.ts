import { Router } from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';

const router = Router();

const dbPath = path.join(__dirname, '..', 'db', 'mydb.sdb');
const db = new sqlite3.Database(dbPath);

router.get('/', (req, res) => {
  db.all(
    'SELECT e.*, u.username as creator_username FROM events e JOIN users u ON e.creator_id = u.id WHERE e.status = ? ORDER BY e.event_date DESC',
    ['active'],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(rows);
    }
  );
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.get(
    'SELECT e.*, u.username as creator_username FROM events e JOIN users u ON e.creator_id = u.id WHERE e.id = ?',
    [id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Event not found' });
      }

      db.all(
        'SELECT * FROM ticket_types WHERE event_id = ?',
        [id],
        (err, ticketTypes) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          res.json({ ...row, ticket_types: ticketTypes });
        }
      );
    }
  );
});

router.get('/:id/stats', (req, res) => {
  const eventId = Number(req.params.id);

  if (Number.isNaN(eventId)) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  db.all(
    `SELECT
      tt.id,
      tt.name,
      tt.price,
      tt.quantity_available,
      tt.quantity_sold
     FROM ticket_types tt
     WHERE tt.event_id = ?`,
    [eventId],
    (err, stats) => {
      if (err) {
        console.error('STATS QUERY ERROR:', err);
        return res.status(500).json({ error: err.message });
      }

      res.json(stats ?? []);
    }
  );
});

router.post('/', (req, res) => {
  const { creator_id, title, description, venue, address, city, country, event_date, event_end_date, category, image_url, ticket_types } = req.body;

  if (!creator_id || !title || !venue || !event_date) {
    return res.status(400).json({ error: 'Creator ID, title, venue, and event date are required' });
  }

  if (!ticket_types || ticket_types.length === 0) {
    return res.status(400).json({ error: 'At least one ticket type is required' });
  }

  db.run(
    'INSERT INTO events (creator_id, title, description, venue, address, city, country, event_date, event_end_date, category, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [creator_id, title, description, venue, address, city, country, event_date, event_end_date, category, image_url, 'active'],
    function(err) {
      if (err) {
        console.error('Event creation error:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      const eventId = this.lastID;

      const ticketPromises = ticket_types.map((ticket: any) => {
        return new Promise((resolve, reject) => {
          db.run(
            'INSERT INTO ticket_types (event_id, name, price, quantity_available, quantity_sold) VALUES (?, ?, ?, ?, ?)',
            [eventId, ticket.name, ticket.price, ticket.quantity, 0],
            (err) => {
              if (err) {
                console.error('Ticket type creation error:', err);
                reject(err);
              }
              else resolve(true);
            }
          );
        });
      });

      Promise.all(ticketPromises)
        .then(() => {
          res.status(201).json({
            message: 'Event created successfully',
            eventId: eventId
          });
        })
        .catch((err) => {
          console.error('Ticket types promise error:', err);
          res.status(500).json({ error: 'Failed to create ticket types', details: err.message });
        });
    }
  );
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, venue, address, city, country, event_date, event_end_date, category, image_url, status } = req.body;

  db.run(
    'UPDATE events SET title = ?, description = ?, venue = ?, address = ?, city = ?, country = ?, event_date = ?, event_end_date = ?, category = ?, image_url = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [title, description, venue, address, city, country, event_date, event_end_date, category, image_url, status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json({ message: 'Event updated successfully' });
    }
  );
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM events WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    res.json({ message: 'Event deleted successfully' });
  });
});

export { router };
