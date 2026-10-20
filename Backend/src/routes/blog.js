const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');
const { log } = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load blog posts' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Post not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Fetch failed' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, category, content, featured } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const { data, error } = await supabaseAdmin
      .from('blog_posts')
      .insert({
        title: String(title).slice(0, 200),
        category: category ? String(category).slice(0, 50) : null,
        content: content ? String(content).slice(0, 20000) : null,
        featured: !!featured,
        published: false
      })
      .select()
      .single();

    if (error) throw error;

    await log('BLOG_CREATE', req.user.id, { postId: data.id });
    res.json({ success: true, id: data.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const allowed = ['title', 'category', 'content', 'featured', 'published'];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('blog_posts')
      .update(updates)
      .eq('id', req.params.id);

    if (error) throw error;

    await log('BLOG_UPDATE', req.user.id, { postId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('blog_posts')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;

    await log('BLOG_DELETE', req.user.id, { postId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;