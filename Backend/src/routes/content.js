const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');
const { log } = require('../utils/logger');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .eq('key', 'content')
      .single();

    if (error || !data) return res.json({});
    res.json(data.value || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load content' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({
        key: 'content',
        value: req.body,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    await log('CONTENT_UPDATE', req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save content' });
  }
});

module.exports = router;