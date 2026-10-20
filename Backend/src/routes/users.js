const express = require('express');
const { supabaseAdmin } = require('../config/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');
const { log } = require('../utils/logger');

const router = express.Router();

// ===== LIST ALL USERS (admin only) =====
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// ===== CREATE USER (admin only) =====
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

    if (authError) throw authError;

    // Save user profile in users table
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name: name || email.split('@')[0],
        role: role || 'staff'
      });

    if (profileError) throw profileError;

    await log('USER_CREATE', req.user.id, { newUserId: authData.user.id, email });
    res.json({ success: true, uid: authData.user.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to create user' });
  }
});

// ===== UPDATE USER ROLE (admin only) =====
router.patch('/:uid', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const allowed = ['role', 'name'];
    const updates = {};

    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', req.params.uid);

    if (error) throw error;

    await log('USER_UPDATE', req.user.id, { targetUid: req.params.uid });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// ===== DELETE USER (admin only) =====
router.delete('/:uid', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    // Prevent self-deletion
    if (req.params.uid === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    // Delete from Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(
      req.params.uid
    );
    if (authError) throw authError;

    // Delete from users table
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', req.params.uid);

    if (dbError) throw dbError;

    await log('USER_DELETE', req.user.id, { targetUid: req.params.uid });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;