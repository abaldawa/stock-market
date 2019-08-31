/**
 * User: abhijit.baldawa
 */

const
    logger = require('../logger/logger'),
    {formatPromiseResult} = require('../utils/util'),
    stocksController = require('../controller/stocks.controller'),
    usersController = require('../controller/users.controller');

async function processSoldStocks() {
    let
        err,
        soldStocksArray;

    logger.info(`processSoldStocks: Starting to process...`);

    [err, soldStocksArray] = await formatPromiseResult( stocksController.getAllSoldStocks() );

    if(err) {
        logger.error(`processSoldStocks: Error getting all sold stocks. Halting.... Error: ${err.stack || err}`);
        throw err;
    }

    if( soldStocksArray && soldStocksArray.length ) {
        for(const soldStockObj of soldStocksArray) {
            [err] = await formatPromiseResult(
                            usersController.addBoughtStockToUser({
                                userId: soldStockObj.buyerId,
                                stockObj: {...soldStockObj.toObject()}
                            })
                          );

            if(err) {
                logger.error(`processSoldStocks: Error while completing sold stock order for stock _id: ${soldStockObj._id}. Error: ${err.stack || err}`);
                continue;
            }

            [err] = await formatPromiseResult( stocksController.deleteStockByMongoId(soldStockObj._id) );

            if( err ) {
                logger.error(`processSoldStocks: Error while deleting sold stock _id: ${soldStockObj._id}, Error: ${err.stack || err}`);
                continue;
            }

            if( soldStockObj.sellerId ) {
                [err] = await formatPromiseResult(
                                usersController.updateSoldStockByUser({
                                    userId: soldStockObj.sellerId,
                                    stockObj: {...soldStockObj.toObject()}
                                })
                              );

                if( err ) {
                    logger.error(`processSoldStocks: Error while updating seller stock/credit data for stock _id: ${soldStockObj._id} and seller Id: ${soldStockObj.sellerId}, Error: ${err.stack || err}`);
                    continue;
                }
            }

            logger.info(`processSoldStocks: Successfully processed bought stock _id: ${soldStockObj._id}`);
        }
    } else {
        logger.info(`processSoldStocks: Nothing to process...`);
    }
}

function start() {
    setInterval(processSoldStocks, 10000);
}

module.exports = {
    start
};