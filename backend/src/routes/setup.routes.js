const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

// GET /api/setup/seed?key=YOUR_SECRET_KEY
// One-time use to seed demo data on a live database without Shell access.
// DELETE THIS FILE after seeding successfully — it's a security risk to leave it.
router.get('/seed', async (req, res) => {
  const { key } = req.query;

  if (key !== process.env.SEED_SECRET) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  try {
    await pool.query(`
      INSERT INTO venues (name, address) VALUES
        ('City Hospital OPD', 'MG Road, Nagpur'),
        ('State Bank Branch', 'Civil Lines, Nagpur'),
        ('RTO Office', 'Ambazari, Nagpur')
      ON CONFLICT DO NOTHING
    `);

    const venueResult = await pool.query('SELECT id FROM venues ORDER BY id');
    for (const venue of venueResult.rows) {
      await pool.query(`
        INSERT INTO queues (venue_id, name, type) VALUES
          ($1, 'General', 'normal'),
          ($1, 'Priority', 'priority')
        ON CONFLICT DO NOTHING
      `, [venue.id]);
    }

    const customerPass = await bcrypt.hash('password123', 10);
    const staffPass = await bcrypt.hash('password123', 10);

    await pool.query(`
      INSERT INTO users (name, email, password, role) VALUES
        ('Demo Customer', 'customer@demo.com', $1, 'customer'),
        ('Staff Operator', 'staff@demo.com', $2, 'staff')
      ON CONFLICT (email) DO NOTHING
    `, [customerPass, staffPass]);

    res.json({ message: '🎉 Seeding complete! Venues, queues, and demo users created.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Seeding failed', error: err.message });
  }
});

module.exports = router;