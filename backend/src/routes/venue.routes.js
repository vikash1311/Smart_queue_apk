const router = require('express').Router();
const { getVenues } = require('../controllers/venue.controller');

router.get('/', getVenues);

module.exports = router;
