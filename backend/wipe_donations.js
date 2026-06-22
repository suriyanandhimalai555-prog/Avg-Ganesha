
import { query } from './src/shared/db.js';
import { connectRedis, invalidateCache } from './src/shared/redis.js';

async function clearAndReset() {
  const confirm = process.argv.includes('--force');
  
  if (!confirm) {
    console.log('⚠️  WARNING: This will DELETE ALL DONATIONS from the database and reset the statue numbering to 1.');
    console.log('To proceed, run: node wipe_donations.js --force');
    process.exit(0);
  }

  try {
    console.log('Cleaning up database...');

    // 1. Delete all donations
    await query('DELETE FROM donations');
    console.log('✅ All donations deleted.');

    // 2. Reset the statue numbering sequence
    await query("ALTER SEQUENCE statue_number_seq RESTART WITH 1");
    console.log('✅ Statue numbering sequence reset to 1.');

    // 3. Reset the ID primary key sequence (optional but good for clean slate)
    await query("ALTER SEQUENCE donations_id_seq RESTART WITH 1");
    console.log('✅ Donation IDs reset to 1.');

    // 4. Invalidate cached counts so the dashboard/admin reflect the wipe
    //    immediately instead of serving the pre-wipe statue count until TTL.
    //    Keys mirror donations.controller.js (GLOBAL_STATUE_COUNT, ADMIN_STATS).
    await connectRedis(); // ensure connection is open; invalidateCache no-ops if closed
    await invalidateCache('donations:global_statue_count');
    await invalidateCache('admin:stats');
    console.log('✅ Caches invalidated (statue count + admin stats).');

    process.exit(0);
  } catch (err) {
    console.error('❌ Wipe failed:', err.message);
    process.exit(1);
  }
}

clearAndReset();
