const router = require('express').Router();
const { getQueuesByVenue } = require('../controllers/queue.controller');

router.get('/:venueId', getQueuesByVenue);

module.exports = router;
