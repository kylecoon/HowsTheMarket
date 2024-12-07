const express = require('express');
const csvController = require('../controllers/csvController');

const router = express.Router();

router.get('/:timeframe', csvController.getRecentData);

module.exports = router;