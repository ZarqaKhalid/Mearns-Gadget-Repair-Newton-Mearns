const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');
const { publicFormLimiter } = require('../middleware/rateLimit');
const { log } = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});

router.post('/', publicFormLimiter, async (req, res) => {
  try {
    const { author, rating, comment, device } = req.body;

    if (!author || !rating) {
      return res.status(400).json({ error: 'Author and rating are required' });
    }

    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({
        author: String(author).slice(0, 100),
        rating: parseInt(rating) || 5,
        comment: comment ? String(comment).slice(0, 1000) : null,
        device: device ? String(device).slice(0, 50) : null,
        approved: false
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ success: true, id: data.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const allowed = ['approved', 'author', 'rating', 'comment', 'device'];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('reviews')
      .update(updates)
      .eq('id', req.params.id);

    if (error) throw error;

    await log('REVIEW_UPDATE', req.user.id, { reviewId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('reviews')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    await log('REVIEW_DELETE', req.user.id, { reviewId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;