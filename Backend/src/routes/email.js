const express = require('express');
const nodemailer = require('nodemailer');
const { supabaseAdmin } = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');
const { log } = require('../utils/logger');

const router = express.Router();

// ===== GET EMAIL CONFIG (password masked) =====
router.get('/config', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('settings')
      .select('*')
      .eq('key', 'email')
      .single();

    if (error || !data) return res.json({});
    const cfg = { ...(data.value || {}) };
    if (cfg.password) cfg.password = '••••••••';
    res.json(cfg);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load email config' });
  }
});

// ===== SAVE EMAIL CONFIG =====
router.post('/config', verifyToken, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.password === '••••••••') delete updates.password;

    const { error } = await supabaseAdmin
      .from('settings')
      .upsert({
        key: 'email',
        value: updates,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    await log('EMAIL_CONFIG_UPDATE', req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save email config' });
  }
});

// ===== SEND TEST EMAIL =====
router.post('/test', verifyToken, async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ error: 'Recipient required' });

    const { data: settingsData } = await supabaseAdmin
      .from('settings')
      .select('value')
      .eq('key', 'email')
      .single();

    const cfg = settingsData?.value;
    if (!cfg || !cfg.host || !cfg.username || !cfg.password) {
      return res.status(400).json({ error: 'Configure SMTP first' });
    }

    const transporter = nodemailer.createTransport({
      host: cfg.host,
      port: parseInt(cfg.port) || 465,
      secure: cfg.ssl !== false,
      auth: {
        user: cfg.username,
        pass: cfg.password
      }
    });

    await transporter.sendMail({
      from: cfg.senderEmail || cfg.username,
      to,
      subject: 'Test email from Mearns Gadget Repair',
      text: 'If you received this, SMTP is configured correctly ✅'
    });

    await supabaseAdmin.from('email_logs').insert({
      to,
      subject: 'Test email',
      status: 'sent'
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Test email failed:', err.message);

    await supabaseAdmin.from('email_logs').insert({
      to: req.body.to,
      subject: 'Test email',
      status: 'failed',
      error_message: err.message
    });

    res.status(500).json({ error: err.message });
  }
});

// ===== LIST EMAIL LOGS =====
router.get('/logs', verifyToken, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load logs' });
  }
});

module.exports = router;