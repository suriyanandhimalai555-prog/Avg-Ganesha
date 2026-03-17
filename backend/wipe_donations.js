
import { query } from './src/shared/db.js';

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

    process.exit(0);
  } catch (err) {
    console.error('❌ Wipe failed:', err.message);
    process.exit(1);
  }
}

clearAndReset();
