const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');
const { publicFormLimiter } = require('../middleware/rateLimit');
const { log } = require('../utils/logger');

const router = express.Router();

// ===== PUBLIC: Create booking (from website form) =====
router.post('/', publicFormLimiter, async (req, res) => {
  try {
    const { name, phone, email, device, issue, details } = req.body;

    if (!name || !phone || !device) {
      return res.status(400).json({ error: 'Name, phone, and device are required' });
    }

    const ticketId = 'MGR-' + Math.floor(1000 + Math.random() * 9000);

    const { data, error } = await supabaseAdmin
      .from('bookings')
      .insert({
        ticket_id: ticketId,
        name: String(name).slice(0, 100),
        phone: String(phone).slice(0, 20),
        email: email ? String(email).slice(0, 100) : null,
        device: String(device).slice(0, 50),
        issue: String(issue || details || 'New booking').slice(0, 1000),
        status: 'Pending'
      })
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, id: data.id, ticketId });
  } catch (err) {
    console.error('Booking create error:', err);
    res.status(500).json({ error: 'Booking failed' });
  }
});

// ===== PROTECTED: List bookings =====
router.get('/', verifyToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    let query = supabaseAdmin
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load bookings' });
  }
});

// ===== PROTECTED: Get single booking =====
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('bookings')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Booking not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' });
  }
});

// ===== PROTECTED: Update booking (status, notes, etc.) =====
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const allowed = ['status', 'issue', 'device', 'notes'];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('bookings')
      .update(updates)
      .eq('id', req.params.id);

    if (error) throw error;

    await log('BOOKING_UPDATE', req.user.id, { bookingId: req.params.id, updates });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ===== PROTECTED (admin only): Delete booking =====
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('bookings')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    await log('BOOKING_DELETE', req.user.id, { bookingId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;