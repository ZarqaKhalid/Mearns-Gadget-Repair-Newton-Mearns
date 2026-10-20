const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');
const { log } = require('../utils/logger');

const router = express.Router();

// ===== GET MAIN SETTINGS =====
router.get('/', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .eq('key', 'main')
      .single();

    if (error || !data) return res.json({});
    res.json(data.value || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// ===== SAVE MAIN SETTINGS =====
router.post('/', verifyToken, async (req, res) => {
  try {
    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({
        key: 'main',
        value: req.body,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    await log('SETTINGS_UPDATE', req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

module.exports = router;