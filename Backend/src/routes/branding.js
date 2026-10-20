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
      .eq('key', 'branding')
      .single();

    if (error || !data) return res.json({});
    res.json(data.value || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load branding' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({
        key: 'branding',
        value: req.body,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    await log('BRANDING_UPDATE', req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save branding' });
  }
});

module.exports = router;