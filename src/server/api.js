const router = require('express').Router();
const { rejectUnauthorizedRequests } = require('./utils');

router.use('/data', rejectUnauthorizedRequests, require('./api/data'));

module.exports = router;