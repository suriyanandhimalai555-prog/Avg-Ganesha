import { query } from '../../shared/db.js';
import { getCachedData, invalidateCache } from '../../shared/redis.js';

const CACHE_KEYS = {
  PLANS: 'plans:all'
};

// Get All Plans (Public)
export const getPlans = async (req, res) => {
  try {
    const plans = await getCachedData(CACHE_KEYS.PLANS, async () => {
      const result = await query('SELECT * FROM membership_plans ORDER BY id ASC');
      return result.rows;
    }, 3600); // 1 hour cache
    
    res.json(plans);
  } catch (err) {
    console.error('Error fetching plans:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update Plan (Superuser Only)
export const updatePlan = async (req, res) => {
  const { id } = req.params;
  const { name, tagline, subtitle, description, price, benefits } = req.body;

  try {
    // Ensure benefits is a valid JSON array string or object
    const benefitsJson = typeof benefits === 'string' ? benefits : JSON.stringify(benefits);

    const updateQuery = `
      UPDATE membership_plans 
      SET name = $1, tagline = $2, subtitle = $3, description = $4, price = $5, benefits = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING *
    `;
    
    const result = await query(updateQuery, [name, tagline, subtitle, description, price, benefitsJson, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    // Invalidate plans cache
    await invalidateCache(CACHE_KEYS.PLANS);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating plan:', err);
    res.status(500).json({ error: 'Update failed' });
  }
};