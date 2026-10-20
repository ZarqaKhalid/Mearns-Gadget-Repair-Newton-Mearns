const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');
const { log } = require('../utils/logger');

const router = express.Router();

// ===== PUBLIC: List all enabled services =====
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('services')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load services' });
  }
});

// ===== PROTECTED: Create a new service =====
router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, category, price, turnaround, popular } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category required' });
    }

    const { data, error } = await supabaseAdmin
      .from('services')
      .insert({
        name: String(name).slice(0, 100),
        category: String(category).slice(0, 50),
        price: price ? String(price).slice(0, 50) : null,
        turnaround: turnaround ? String(turnaround).slice(0, 50) : null,
        popular: !!popular,
        enabled: true
      })
      .select()
      .single();

    if (error) throw error;

    await log('SERVICE_CREATE', req.user.id, { serviceId: data.id });
    res.json({ success: true, id: data.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// ===== PROTECTED: Update service =====
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const allowed = ['name', 'category', 'price', 'turnaround', 'popular', 'enabled'];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('services')
      .update(updates)
      .eq('id', req.params.id);

    if (error) throw error;

    await log('SERVICE_UPDATE', req.user.id, { serviceId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ===== PROTECTED (admin only): Delete service =====
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    await log('SERVICE_DELETE', req.user.id, { serviceId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;