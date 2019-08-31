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

    // -------------------------------- 1. Get all the sold stock from the DB --------------------------------------
    [err, soldStocksArray] = await formatPromiseResult( stocksController.getAllSoldStocks() );

    if(err) {
        logger.error(`processSoldStocks: Error getting all sold stocks. Halting.... Error: ${err.stack || err}`);
        return;
    }
    // ------------------------------------------------ 1. END -----------------------------------------------------


    // --- 2. For each sold stock, add the bought stock to the appropriate user document and delete the stock record ---
    if( soldStocksArray && soldStocksArray.length ) {
        for(const soldStockObj of soldStocksArray) {

            // ------------------ 2a. Add bough stock to the buyer's user record in 'users' collection --------------
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
            // ------------------------------------------------ 2a. END --------------------------------------------


            // ---------------- 2b. Delete the sold stock from 'stocks' collection --------------------------------
            [err] = await formatPromiseResult( stocksController.deleteStockByMongoId(soldStockObj._id) );

            if( err ) {
                logger.error(`processSoldStocks: Error while deleting sold stock _id: ${soldStockObj._id}, Error: ${err.stack || err}`);
                continue;
            }
            // ------------------------------------------ 2b. END ------------------------------------------------


            /**
             * ---- 2c. If the sold stock has a seller info the remove the stock information from the seller as well
             * and also add the credits of the sold stocks in the sellers 'users' collection -------------------------------
             */
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
            // ---------------------------------------------- 2c. END ------------------------------------------------------

            logger.info(`processSoldStocks: Successfully processed bought stock _id: ${soldStockObj._id}`);
        }
    } else {
        logger.info(`processSoldStocks: Nothing to process...`);
    }
    // ---------------------------------------------------- 2. END ------------------------------------------------------------
}

function start() {
    setInterval(processSoldStocks, 10000);
}

module.exports = {
    start
};