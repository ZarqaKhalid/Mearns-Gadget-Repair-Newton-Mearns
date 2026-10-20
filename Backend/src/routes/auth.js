const express = require('express');
const { supabase, supabaseAdmin } = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');
const { log } = require('../utils/logger');

const router = express.Router();

// ===== LOGIN =====
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('role, name')
      .eq('id', data.user.id)
      .single();

    await log('LOGIN', data.user.id, { email });

    res.json({
      idToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresIn: data.session.expires_in,
      email: data.user.email,
      uid: data.user.id,
      role: userData?.role || 'staff',
      name: userData?.name || email.split('@')[0]
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ===== GET CURRENT USER =====
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

// ===== LOGOUT =====
router.post('/logout', verifyToken, async (req, res) => {
  await log('LOGOUT', req.user.id);
  res.json({ success: true });
});

module.exports = router;