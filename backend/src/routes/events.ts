import { Router } from 'express';
import sqlite3 from 'sqlite3';
import path from 'path';
import { authenticateToken } from '../middleware/auth';

const router = Router();

const dbPath = path.join(__dirname, '..', 'db', 'mydb.sdb');
const db = new sqlite3.Database(dbPath);

router.get('/', (req, res) => {
  const { search, location, date, date_until, confirmed, category, sort } = req.query;

  let query = 'SELECT e.*, u.username as creator_username FROM events e JOIN users u ON e.creator_id = u.id WHERE e.status = ?';
  let params: any[] = ['active'];

  if (search) {
    query += ' AND e.title LIKE ?';
    params.push(`%${search}%`);
  }

  if (location) {
    query += ' AND (e.city = ? OR e.venue = ?)';
    params.push(location, location);
  }

  if (date) {
    query += ' AND e.event_date >= ?';
    params.push(date);
  }

  if (date_until) {
    query += ' AND e.event_date <= ?';
    params.push(date_until);
  }

  if (confirmed !== undefined) {
    query += ' AND e.confirmed = ?';
    params.push(confirmed === 'true' ? 1 : 0);
  }

  if (category) {
    query += ' AND e.category = ?';
    params.push(category);
  }

  if (sort === 'soonest') {
    query += ' ORDER BY e.event_date ASC';
  } else if (sort === 'latest') {
    query += ' ORDER BY e.event_date DESC';
  } else {
    query += ' ORDER BY e.event_date DESC';
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

router.get('/my-events', authenticateToken, (req, res) => {
  const userId = req.user!.id;

  db.all(
    'SELECT * FROM events WHERE creator_id = ? ORDER BY event_date DESC',
    [userId],
    (err, events) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(events);
    }
  );
});

router.get('/filters', (req, res) => {
  const queries = [
    'SELECT DISTINCT city as location FROM events WHERE city IS NOT NULL AND city != "" UNION SELECT DISTINCT venue as location FROM events WHERE venue IS NOT NULL AND venue != ""',
    'SELECT DISTINCT category FROM events WHERE category IS NOT NULL AND category != ""',
  ];

  Promise.all(queries.map(q => new Promise((resolve, reject) => {
    db.all(q, [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows.map((r: any) => Object.values(r)[0]));
    });
  }))).then(([locations, categories]) => {
    res.json({ locations, categories });
  }).catch(err => {
    res.status(500).json({ error: 'Database error' });
  });
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

router.get('/:id/ticket-types', (req, res) => {
  const eventId = Number(req.params.id);

  if (Number.isNaN(eventId)) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  db.all(
    'SELECT * FROM ticket_types WHERE event_id = ?',
    [eventId],
    (err, ticketTypes) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(ticketTypes ?? []);
    }
  );
});


router.post('/:id/buy', authenticateToken, (req, res) => {
  const eventId = Number(req.params.id);
  const { ticketTypeId, quantity, payment } = req.body;
  const userId = req.user!.id;

  if (Number.isNaN(eventId) || !ticketTypeId || !quantity || quantity < 1) {
    return res.status(400).json({ error: 'Invalid input' });
  }

  db.get(
    'SELECT * FROM ticket_types WHERE id = ? AND event_id = ?',
    [ticketTypeId, eventId],
    (err, ticketType: any) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!ticketType) {
        return res.status(404).json({ error: 'Ticket type not found' });
      }
      if (ticketType.quantity_sold + quantity > ticketType.quantity_available) {
        return res.status(400).json({ error: 'Not enough tickets available' });
      }

      const totalAmount = ticketType.price * quantity;
      const orderNumber = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

      db.run(
        'INSERT INTO orders (user_id, event_id, order_number, total_amount, status, payment_method) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, eventId, orderNumber, totalAmount, 'paid', 'credit_card'],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create order' });
          }
          const orderId = this.lastID;

          db.run(
            'INSERT INTO order_items (order_id, ticket_type_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
            [orderId, ticketTypeId, quantity, ticketType.price, totalAmount],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to create order item' });
              }

              db.run(
                'UPDATE ticket_types SET quantity_sold = quantity_sold + ? WHERE id = ?',
                [quantity, ticketTypeId],
                function(err) {
                  if (err) {
                    return res.status(500).json({ error: 'Failed to update ticket sales' });
                  }

                  const tickets = [];
                  for (let i = 0; i < quantity; i++) {
                    const ticketCode = 'TKT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                    tickets.push([orderId, ticketTypeId, userId, eventId, ticketCode]);
                  }

                  const placeholders = tickets.map(() => '(?, ?, ?, ?, ?)').join(', ');
                  const values = tickets.flat();

                  db.run(
                    `INSERT INTO tickets (order_id, ticket_type_id, user_id, event_id, ticket_code) VALUES ${placeholders}`,
                    values,
                    function(err) {
                      if (err) {
                        return res.status(500).json({ error: 'Failed to generate tickets' });
                      }
                      res.json({ message: 'Purchase successful', orderNumber });
                    }
                  );
                }
              );
            }
          );
        }
      );
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
    'INSERT INTO events (creator_id, title, description, venue, address, city, country, event_date, event_end_date, category, image_url, status, confirmed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [creator_id, title, description, venue, address, city, country, event_date, event_end_date, category, image_url, 'active', 0],
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

router.put('/:id/confirmed', authenticateToken, (req, res) => {
  const eventId = Number(req.params.id);
  const { confirmed } = req.body;
  const userRole = req.user!.role;

  console.log('User role:', userRole, 'User ID:', req.user!.id);

  if (Number.isNaN(eventId)) {
    return res.status(400).json({ error: 'Invalid event id' });
  }

  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Only admins can update confirmed status' });
  }

  db.run(
    'UPDATE events SET confirmed = ? WHERE id = ?',
    [confirmed ? 1 : 0, eventId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Event not found' });
      }
      res.json({ message: 'Confirmed status updated' });
    }
  );
});

router.put('/:id', (req, res) => {
    const { id } = req.params;
    const {
        title,
        description,
        venue,
        address,
        city,
        country,
        event_date,
        event_end_date,
        category,
        image_url,
        status,
        confirmed
    } = req.body;

    db.run(
        `UPDATE events 
     SET title = ?, description = ?, venue = ?, address = ?, city = ?, country = ?, 
         event_date = ?, event_end_date = ?, category = ?, image_url = ?, status = ?, confirmed = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
        [
            title,
            description,
            venue,
            address,
            city,
            country,
            event_date,
            event_end_date,
            category,
            image_url,
            status,
            confirmed ? 1 : 0,
            id
        ],
        function (err) {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (this.changes === 0) return res.status(404).json({ error: 'Event not found' });
            res.json({ message: 'Event updated successfully', confirmed: confirmed ? 1 : 0 });
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
