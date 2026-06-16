const pool = require('../config/db');
const { getIO } = require('../socket/queue.socket');

const AVG_SERVICE_TIME = 2.5; // minutes per token

const formatToken = (num) => `A-${String(num).padStart(3, '0')}`;

// POST /api/tokens/join
const joinQueue = async (req, res) => {
  const { queue_id } = req.body;
  const user_id = req.user.id;

  if (!queue_id) {
    return res.status(400).json({ message: 'queue_id is required' });
  }

  try {
    // Check if user already has an active token in this queue
    const existing = await pool.query(
      `SELECT id FROM tokens WHERE user_id = $1 AND queue_id = $2 AND status = 'waiting'`,
      [user_id, queue_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'You already have an active token in this queue' });
    }

    // Get the queue
    const queueResult = await pool.query(
      'SELECT * FROM queues WHERE id = $1 AND is_active = TRUE',
      [queue_id]
    );
    if (queueResult.rows.length === 0) {
      return res.status(404).json({ message: 'Queue not found or inactive' });
    }
    const queue = queueResult.rows[0];

    // Get the highest token number in this queue to assign next
    const maxResult = await pool.query(
      'SELECT COALESCE(MAX(token_number), 0) AS max_token FROM tokens WHERE queue_id = $1',
      [queue_id]
    );
    const nextTokenNumber = parseInt(maxResult.rows[0].max_token) + 1;

    // Insert token
    await pool.query(
      'INSERT INTO tokens (queue_id, user_id, token_number, status) VALUES ($1, $2, $3, $4)',
      [queue_id, user_id, nextTokenNumber, 'waiting']
    );

    const tokensAhead = nextTokenNumber - queue.current_token - 1;
    const estimatedMin = Math.max(0, Math.floor(tokensAhead * AVG_SERVICE_TIME));

    res.status(201).json({
      token_number: nextTokenNumber,
      token_label: formatToken(nextTokenNumber),
      queue_id: queue.id,
      queue_name: queue.name,
      queue_type: queue.type,
      current_token: queue.current_token,
      tokens_ahead: Math.max(0, tokensAhead),
      estimated_wait_minutes: estimatedMin,
      estimated_wait_label: `${estimatedMin} – ${estimatedMin + 5} min`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/tokens/my  — active token for the logged-in user
const getMyToken = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT t.id, t.token_number, t.status, t.queue_id, t.created_at,
              q.name AS queue_name, q.type AS queue_type, q.current_token,
              v.name AS venue_name
       FROM tokens t
       JOIN queues q ON q.id = t.queue_id
       JOIN venues v ON v.id = q.venue_id
       WHERE t.user_id = $1 AND t.status = 'waiting'
       ORDER BY t.created_at DESC
       LIMIT 1`,
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No active token found' });
    }

    const token = result.rows[0];
    const tokensAhead = Math.max(0, token.token_number - token.current_token - 1);
    const estimatedMin = Math.floor(tokensAhead * AVG_SERVICE_TIME);

    res.json({
      token_number: token.token_number,
      token_label: formatToken(token.token_number),
      queue_id: token.queue_id,
      queue_name: token.queue_name,
      queue_type: token.queue_type,
      venue_name: token.venue_name,
      current_token: token.current_token,
      current_token_label: formatToken(token.current_token),
      tokens_ahead: tokensAhead,
      estimated_wait_minutes: estimatedMin,
      estimated_wait_label: `${estimatedMin} – ${estimatedMin + 5} min`,
      status: token.status,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/tokens/history
const getHistory = async (req, res) => {
  const user_id = req.user.id;

  try {
    const result = await pool.query(
      `SELECT t.token_number, t.status, t.created_at,
              q.name AS queue_name, q.type AS queue_type,
              v.name AS venue_name
       FROM tokens t
       JOIN queues q ON q.id = t.queue_id
       JOIN venues v ON v.id = q.venue_id
       WHERE t.user_id = $1
       ORDER BY t.created_at DESC
       LIMIT 50`,
      [user_id]
    );

    const history = result.rows.map((t) => ({
      token_label: formatToken(t.token_number),
      queue_name: t.queue_name,
      queue_type: t.queue_type,
      venue_name: t.venue_name,
      status: t.status,
      created_at: t.created_at,
    }));

    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/tokens/next  — staff only
const nextToken = async (req, res) => {
  const { queue_id } = req.body;

  if (!queue_id) {
    return res.status(400).json({ message: 'queue_id is required' });
  }

  try {
    // Advance current_token by 1
    const result = await pool.query(
      `UPDATE queues SET current_token = current_token + 1
       WHERE id = $1 AND is_active = TRUE
       RETURNING id, current_token, name`,
      [queue_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    const queue = result.rows[0];
    const newToken = queue.current_token;

    // Mark the token being served
    await pool.query(
      `UPDATE tokens SET status = 'serving'
       WHERE queue_id = $1 AND token_number = $2 AND status = 'waiting'`,
      [queue_id, newToken]
    );

    // Mark the previously serving token as completed
    await pool.query(
      `UPDATE tokens SET status = 'completed'
       WHERE queue_id = $1 AND token_number = $2 AND status = 'serving'`,
      [queue_id, newToken - 1]
    );

    // Get updated waiting count
    const countResult = await pool.query(
      `SELECT COUNT(*) AS waiting_count FROM tokens WHERE queue_id = $1 AND status = 'waiting'`,
      [queue_id]
    );
    const waitingCount = parseInt(countResult.rows[0].waiting_count);

    // Emit Socket.io event to all users in this queue's room
    const io = getIO();
    io.to(`queue_${queue_id}`).emit('queue_updated', {
      queue_id,
      current_token: newToken,
      current_token_label: formatToken(newToken),
      waiting_count: waitingCount,
    });

    // Find users who are now exactly 3 tokens away and notify them
    const nearResult = await pool.query(
      `SELECT user_id, token_number FROM tokens
       WHERE queue_id = $1 AND status = 'waiting' AND token_number = $2`,
      [queue_id, newToken + 3]
    );
    if (nearResult.rows.length > 0) {
      const nearToken = nearResult.rows[0];
      io.to(`queue_${queue_id}`).emit('your_turn_soon', {
        token_label: formatToken(nearToken.token_number),
        tokens_ahead: 3,
        user_id: nearToken.user_id, // frontend filters by their own user_id
      });
    }

    res.json({
      current_token: newToken,
      token_label: formatToken(newToken),
      waiting_count: waitingCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/tokens/queue-status/:queueId  — for staff panel summary
const getQueueStatus = async (req, res) => {
  const { queueId } = req.params;

  try {
    const result = await pool.query(
      `SELECT q.id, q.name, q.type, q.current_token,
        COUNT(t.id) FILTER (WHERE t.status = 'waiting') AS waiting_count,
        COUNT(t.id) FILTER (WHERE t.status = 'completed') AS completed_count,
        COUNT(t.id) AS total_count
       FROM queues q
       LEFT JOIN tokens t ON t.queue_id = q.id
       WHERE q.id = $1
       GROUP BY q.id`,
      [queueId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Queue not found' });
    }

    const q = result.rows[0];
    res.json({
      ...q,
      current_token_label: formatToken(q.current_token),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { joinQueue, getMyToken, getHistory, nextToken, getQueueStatus };
