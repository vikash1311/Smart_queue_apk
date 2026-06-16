const pool = require('../config/db');

// GET /api/queues/:venueId
const getQueuesByVenue = async (req, res) => {
  const { venueId } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        q.id, q.name, q.type, q.current_token, q.is_active,
        COUNT(t.id) FILTER (WHERE t.status = 'waiting') AS waiting_count
       FROM queues q
       LEFT JOIN tokens t ON t.queue_id = q.id
       WHERE q.venue_id = $1 AND q.is_active = TRUE
       GROUP BY q.id
       ORDER BY q.type DESC`,
      [venueId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getQueuesByVenue };
