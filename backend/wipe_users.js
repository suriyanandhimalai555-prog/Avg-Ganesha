
import { query } from './src/shared/db.js';
import { connectRedis, invalidateCache } from './src/shared/redis.js';
import redisClient from './src/shared/redis.js';

async function wipeUsers() {
  const confirm = process.argv.includes('--force');

  if (!confirm) {
    console.log('⚠️  WARNING: This will DELETE ALL USERS (except ADMIN accounts) from the database.');
    console.log('To proceed, run: node wipe_users.js --force');
    process.exit(0);
  }

  try {
    console.log('Deleting all non-admin users...');

    // Get all non-admin user IDs first (to flush their auth caches from Redis)
    const usersResult = await query(`SELECT id FROM users WHERE role != 'ADMIN'`);
    const userIds = usersResult.rows.map(r => r.id);
    console.log(`Found ${userIds.length} non-admin user(s) to delete.`);

    // Delete all non-admin users (cascades to user_avg_coins)
    const deleteResult = await query(`DELETE FROM users WHERE role != 'ADMIN'`);
    console.log(`✅ ${deleteResult.rowCount} user(s) deleted.`);

    // Also reset the users ID sequence for a clean slate
    await query(`ALTER SEQUENCE users_id_seq RESTART WITH 1`);
    console.log('✅ User ID sequence reset to 1.');

    // Flush their auth caches from Redis
    if (userIds.length > 0) {
      await connectRedis();
      for (const id of userIds) {
        await invalidateCache(`auth:user:${id}`);
      }
      console.log(`✅ Auth caches cleared for ${userIds.length} user(s).`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ User wipe failed:', err.message);
    process.exit(1);
  }
}

wipeUsers();
