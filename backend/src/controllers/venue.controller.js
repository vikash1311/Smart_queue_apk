const pool = require('../config/db');

// GET /api/venues
const getVenues = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, address FROM venues ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getVenues };
