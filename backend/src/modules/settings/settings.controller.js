import { query } from '../../shared/db.js';
import { getCachedData, invalidateCache } from '../../shared/redis.js';

const CACHE_KEYS = {
  BANK_SETTINGS: 'settings:bank'
};

// GET: Fetch all bank details
export const getBankDetails = async (req, res) => {
  try {
    const settings = await getCachedData(CACHE_KEYS.BANK_SETTINGS, async () => {
      const result = await query("SELECT key, value FROM system_settings WHERE key LIKE 'bank_%'");
      
      // Convert array of rows [{key: 'x', value: 'y'}] into a single object { x: 'y' }
      return result.rows.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {});
    }, 86400); // 24 hours (rarely changes)

    res.json(settings);
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

// PUT: Update bank details (Superuser Only)
export const updateBankDetails = async (req, res) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  // Only bank_* keys are editable here (this is the only cache we invalidate, and other
  // keys such as statue prices must not be changed through this endpoint).
  const updates = Object.fromEntries(
    Object.entries(body)
      .filter(([k]) => /^bank_[a-z_]+$/.test(k))
      .map(([k, v]) => [k, v == null ? '' : String(v).trim()])
  );
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No bank settings provided' });
  }

  try {
    // Loop through each key and update it
    const promises = Object.keys(updates).map(key => {
        return query(
            'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
            [key, updates[key]]
        );
    });

    await Promise.all(promises);

    // Invalidate settings cache
    await invalidateCache(CACHE_KEYS.BANK_SETTINGS);

    res.json({ message: 'Bank details updated successfully' });
  } catch (err) {
    console.error('Error updating settings:', err);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};