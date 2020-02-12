const router = require('express').Router();

router.get('/series', require('./series'));
router.get('/series/:aggregation_type', require('./aggregated'));

module.exports = router;