
import { query } from './src/shared/db.js';
import { connectRedis, invalidateCache } from './src/shared/redis.js';

async function deleteUserByEmail() {
  const email = process.argv[2];

  if (!email) {
    console.log('Usage: node delete_user_by_email.js <email>');
    console.log('Example: node delete_user_by_email.js user@example.com');
    process.exit(0);
  }

  try {
    // Look up the user
    const result = await query(
      `SELECT id, full_name, email, role FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rowCount === 0) {
      console.error(`❌ No user found with email: ${email}`);
      process.exit(1);
    }

    const user = result.rows[0];

    // Protect admin accounts
    if (user.role === 'ADMIN') {
      console.error(`❌ Cannot delete ADMIN account: ${user.email}`);
      console.error('   Remove their ADMIN role first if you really want to delete them.');
      process.exit(1);
    }

    console.log(`Found user: [${user.id}] ${user.full_name} <${user.email}> (${user.role})`);

    // Delete the user (cascades to user_avg_coins, donations via FK)
    await query(`DELETE FROM users WHERE id = $1`, [user.id]);
    console.log(`✅ User deleted: ${user.email}`);

    // Invalidate their auth cache in Redis
    await connectRedis();
    await invalidateCache(`auth:user:${user.id}`);
    console.log(`✅ Auth cache cleared for user ${user.id}.`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Delete failed:', err.message);
    process.exit(1);
  }
}

deleteUserByEmail();
