const { supabaseAdmin } = require('../config/supabase');

/**
 * Log an admin action to the activity_logs table.
 * Fails silently — logging should never break the app.
 */
async function log(action, userId = null, details = {}) {
  const entry = {
    action,
    user_id: userId,
    details,
    created_at: new Date().toISOString()
  };

  // Always print to console
  console.log('[AUDIT]', JSON.stringify(entry));

  // Try to save to Supabase (won't crash if it fails)
  try {
    await supabaseAdmin.from('activity_logs').insert(entry);
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = { log };