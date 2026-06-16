const router = require('express').Router();
const { protect, staffOnly } = require('../middleware/auth');
const {
  joinQueue,
  getMyToken,
  getHistory,
  nextToken,
  getQueueStatus,
} = require('../controllers/token.controller');

router.post('/join', protect, joinQueue);
router.get('/my', protect, getMyToken);
router.get('/history', protect, getHistory);
router.get('/queue-status/:queueId', protect, staffOnly, getQueueStatus);
router.post('/next', protect, staffOnly, nextToken);

module.exports = router;
