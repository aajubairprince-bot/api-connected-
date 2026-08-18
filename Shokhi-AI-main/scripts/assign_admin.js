/**
 * 👑 Shokhi AI — CLI Script to Assign / Revoke Admin Role
 * Usage:
 *   node scripts/assign_admin.js <email> [true|false]
 * Example:
 *   node scripts/assign_admin.js doctor.ayesha@example.com
 *   node scripts/assign_admin.js user@example.com false
 */

import { localDb, getSupabaseConfig, getSupabaseAdminClient } from '../lib/supabase.js';

const targetEmail = (process.argv[2] || '').trim().toLowerCase();
const shouldBeAdmin = process.argv[3] !== 'false';

if (!targetEmail) {
  console.log(`
======================================================================
👑 SHOKHI AI — ADMIN ROLE ASSIGNMENT TOOL
======================================================================
Usage:
  node scripts/assign_admin.js <user_email> [true|false]

Examples:
  node scripts/assign_admin.js admin@shokhiai.org
  node scripts/assign_admin.js nusrat.jahan@example.com true
  node scripts/assign_admin.js nusrat.jahan@example.com false
======================================================================
`);
  process.exit(1);
}

console.log(`\n👑 Setting Admin Role for: "${targetEmail}" -> ${shouldBeAdmin ? 'ADMIN (true)' : 'REGULAR USER (false)'}...`);

// 1. Update in local in-memory store
let localUser = localDb.users.find(u => u.email && u.email.toLowerCase() === targetEmail);
if (localUser) {
  localUser.is_admin = shouldBeAdmin;
  localUser.updated_at = Date.now() / 1000;
  console.log(`  ✅ Local database user #${localUser.id} (${localUser.name}) updated: is_admin = ${shouldBeAdmin}`);
} else {
  localUser = {
    id: localDb.generateId(),
    email: targetEmail,
    name: targetEmail.split('@')[0],
    pregnancy_week: 1,
    is_admin: shouldBeAdmin,
    created_at: Date.now() / 1000,
    updated_at: Date.now() / 1000
  };
  localDb.users.push(localUser);
  console.log(`  ✅ Created new user entry in local database: #${localUser.id} (${localUser.email}), is_admin = ${shouldBeAdmin}`);
}

// 2. Update in Supabase if configured
const config = getSupabaseConfig();
if (config.is_configured) {
  console.log(`  🔄 Syncing to Supabase PostgreSQL database...`);
  const supabase = getSupabaseAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ is_admin: shouldBeAdmin, updated_at: new Date().toISOString() })
        .eq('email', targetEmail)
        .select();

      if (error) {
        console.warn(`  ⚠️ Supabase update notice:`, error.message);
      } else {
        console.log(`  ✅ Supabase profiles synchronized successfully! (Updated rows: ${data?.length || 1})`);
      }
    } catch (err) {
      console.warn(`  ⚠️ Supabase sync exception:`, err.message);
    }
  }
}

console.log(`\n🎉 SUCCESS: ${targetEmail} is now ${shouldBeAdmin ? 'an ADMINISTRATOR' : 'a REGULAR USER'}!`);
process.exit(0);
