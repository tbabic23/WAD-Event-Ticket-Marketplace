"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const qrcode_1 = __importDefault(require("qrcode"));
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.router = router;
const dbPath = path_1.default.join(__dirname, '..', 'db', 'mydb.sdb');
const db = new sqlite3_1.default.Database(dbPath);
router.get('/my-tickets', auth_1.authenticateToken, (req, res) => {
    const userId = req.user.id;
    db.all(`SELECT
      t.*,
      e.title as event_title,
      e.event_date,
      e.venue,
      e.city,
      tt.name as ticket_type_name,
      tt.price
    FROM tickets t
    JOIN events e ON t.event_id = e.id
    JOIN ticket_types tt ON t.ticket_type_id = tt.id
    WHERE t.user_id = ?
    ORDER BY e.event_date DESC`, [userId], (err, tickets) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(tickets);
    });
});
router.get('/my-orders', auth_1.authenticateToken, (req, res) => {
    const userId = req.user.id;
    db.all(`SELECT
      o.*,
      e.title as event_title,
      e.event_date,
      e.venue
    FROM orders o
    JOIN events e ON o.event_id = e.id
    WHERE o.user_id = ?
    ORDER BY o.created_at DESC`, [userId], (err, orders) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(orders);
    });
});
router.get('/:ticketId/qr', auth_1.authenticateToken, (req, res) => {
    const ticketId = Number(req.params.ticketId);
    const userId = req.user.id;
    if (Number.isNaN(ticketId)) {
        return res.status(400).json({ error: 'Invalid ticket id' });
    }
    db.get('SELECT * FROM tickets WHERE id = ? AND user_id = ?', [ticketId, userId], async (err, ticket) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!ticket) {
            return res.status(404).json({ error: 'Ticket not found' });
        }
        try {
            const qrData = `http://localhost:4200/scan?code=${ticket.ticket_code}&event=${ticket.event_id}`;
            const qrCodeDataURL = await qrcode_1.default.toDataURL(qrData, {
                errorCorrectionLevel: 'H',
                width: 300,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            db.run('UPDATE tickets SET qr_code_data = ? WHERE id = ?', [qrData, ticketId], (err) => {
                if (err)
                    console.error('Failed to save QR data:', err);
            });
            res.json({
                qrCode: qrCodeDataURL,
                ticketCode: ticket.ticket_code,
                eventId: ticket.event_id
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to generate QR code' });
        }
    });
});
router.post('/scan', auth_1.authenticateToken, (req, res) => {
    const { ticketCode, eventId } = req.body;
    const scannedBy = req.user.id;
    const userRole = req.user.role;
    if (!ticketCode || !eventId) {
        return res.status(400).json({ error: 'Ticket code and event ID are required' });
    }
    db.get('SELECT creator_id FROM events WHERE id = ?', [eventId], (err, event) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (userRole !== 'admin' && event.creator_id !== scannedBy) {
            return res.status(403).json({ error: 'You do not have permission to scan tickets for this event' });
        }
        db.get('SELECT * FROM tickets WHERE ticket_code = ? AND event_id = ?', [ticketCode, eventId], (err, ticket) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (!ticket) {
                db.run('INSERT INTO ticket_scan_log (ticket_id, scanned_by, scan_result, scanned_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)', [null, scannedBy, 'invalid'], () => { });
                return res.status(404).json({ error: 'Ticket not found', scanResult: 'invalid' });
            }
            let scanResult = 'success';
            let message = 'Ticket is valid';
            if (ticket.status !== 'valid') {
                scanResult = ticket.status === 'used' ? 'already_used' : 'invalid';
                message = ticket.status === 'used' ? 'Ticket already used' : 'Ticket is not valid';
            }
            db.run('INSERT INTO ticket_scan_log (ticket_id, scanned_by, scan_result, scanned_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)', [ticket.id, scannedBy, scanResult], (err) => {
                if (err)
                    console.error('Failed to log scan:', err);
            });
            if (scanResult === 'success') {
                db.run('UPDATE tickets SET status = ?, checked_in_at = CURRENT_TIMESTAMP, checked_in_by = ? WHERE id = ?', ['used', scannedBy, ticket.id], (err) => {
                    if (err) {
                        return res.status(500).json({ error: 'Failed to update ticket status' });
                    }
                    res.json({
                        success: true,
                        scanResult,
                        message,
                        ticket: {
                            id: ticket.id,
                            ticketCode: ticket.ticket_code,
                            checkedInAt: new Date().toISOString()
                        }
                    });
                });
            }
            else {
                res.json({
                    success: false,
                    scanResult,
                    message,
                    ticket: {
                        id: ticket.id,
                        ticketCode: ticket.ticket_code,
                        status: ticket.status
                    }
                });
            }
        });
    });
});
router.get('/all', auth_1.authenticateToken, (req, res) => {
    const userRole = req.user.role;
    if (userRole !== 'admin') {
        return res.status(403).json({ error: 'Only admins can view all tickets' });
    }
    db.all(`SELECT
      t.*,
      u.username,
      u.email,
      e.title as event_title,
      e.event_date,
      e.venue,
      tt.name as ticket_type_name,
      tt.price
    FROM tickets t
    JOIN users u ON t.user_id = u.id
    JOIN events e ON t.event_id = e.id
    JOIN ticket_types tt ON t.ticket_type_id = tt.id
    ORDER BY t.created_at DESC`, [], (err, tickets) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(tickets);
    });
});
router.get('/event/:eventId', auth_1.authenticateToken, (req, res) => {
    const eventId = Number(req.params.eventId);
    const userId = req.user.id;
    const userRole = req.user.role;
    if (Number.isNaN(eventId)) {
        return res.status(400).json({ error: 'Invalid event id' });
    }
    db.get('SELECT creator_id FROM events WHERE id = ?', [eventId], (err, event) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (userRole !== 'admin' && event.creator_id !== userId) {
            return res.status(403).json({ error: 'You do not have permission to view tickets for this event' });
        }
        db.all(`SELECT
          t.*,
          u.username,
          u.email,
          tt.name as ticket_type_name,
          tt.price
        FROM tickets t
        JOIN users u ON t.user_id = u.id
        JOIN ticket_types tt ON t.ticket_type_id = tt.id
        WHERE t.event_id = ?
        ORDER BY t.created_at DESC`, [eventId], (err, tickets) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json(tickets);
        });
    });
});
