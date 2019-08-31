/**
 * User: abhijit.baldawa
 */

const
    express = require('express'),
    stocksController = require('../controller/stocks.controller'),
    router = express.Router();

router.get('/', [
    stocksController.getAllStocks
]);

router.post('/buy', [
    stocksController.buyStock
]);

module.exports = router;