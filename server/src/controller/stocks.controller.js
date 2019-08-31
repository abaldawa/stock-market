/**
 * User: abhijit.baldawa
 */

const
    stocksModel = require('../database/models/stocks.model'),
    usersController = require('./users.controller'),
    logger = require('../logger/logger'),
    {formatPromiseResult} = require('../utils/util'),
    {SOLD} = require('../database/models/stocks.model').getStatusEnum();

async function getAllStocks( req, res ) {
    let
        err,
        availableStocksArr;

    [err, availableStocksArr] = await formatPromiseResult( stocksModel.getAllStocks() );

    if( err ) {
        logger.error(`getAllAvailableStocks: Error while querying available stocks from DB. Error: ${err.stack || err}`);
        res.status(500).send(`Error querying available stocks from the DB. Error: ${err}`);
    }

    res.json(availableStocksArr);
}

async function buyStock( req, res ) {
    const
        {stockDbId, buyerId} = req.body || {};

    let
        err,
        stockObj,
        userObj,
        pendingStocksBoughtByBuyer;

    [err, stockObj] = await formatPromiseResult( stocksModel.getStockByDbId(stockDbId) );

    if( err ) {
        logger.error(`Error querying stock _id: ${stockDbId}. Error: ${err.stack || err}`);
        return res.status(500).send(`Error querying stock _id: ${stockDbId}. ${err}`);
    }

    if( !stockObj ) {
        return res.status(404).send(`Stock db _id: ${stockDbId} not found in DB`);
    }

    [err, userObj] = await formatPromiseResult( usersController.getUserById(buyerId) );

    if( err ) {
        logger.error(`Error querying buyer _id: ${buyerId}. Error: ${err.stack || err}`);
        return res.status(500).send(`Error querying buyer _id: ${buyerId}. ${err}`);
    }

    if( !userObj ) {
        return res.status(404).send(`Buyer db _id: ${buyerId} not found in DB`);
    }

    [err, pendingStocksBoughtByBuyer] = await formatPromiseResult(
                                                stocksModel.getStocks({
                                                    status: SOLD,
                                                    buyerId: userObj._id
                                                })
                                              );

    if( err ) {
        logger.error(`Error querying stocks sold to buyer _id: ${buyerId}. Error: ${err.stack || err}`);
        return res.status(500).send(`Error querying stocks sold to buyer _id: ${buyerId}. ${err}`);
    }

    if( pendingStocksBoughtByBuyer && pendingStocksBoughtByBuyer.length ) {
        let totalBoughtCredits = pendingStocksBoughtByBuyer.reduce((totalCredits, boughtStock) =>{
            totalCredits += boughtStock.price * boughtStock.quantity;
        }, 0);

        if( userObj.credit < (totalBoughtCredits + stockObj.price * stockObj.quantity) ) {
            return res.status(403).send(`Not enough credit to buy this stock.`);
        }
    } else if( userObj.credit < (stockObj.price * stockObj.quantity) ) {
        return res.status(403).send(`Not enough credit to buy this stock.`);
    }

    [err] = await formatPromiseResult(
                    stocksModel.updateStockByDbId( stockObj._id, {
                        buyerId: userObj._id,
                        status: SOLD
                    } )
                  );

    if( err ) {
        logger.error(`Error updating stocks bought by buyer _id: ${buyerId}. Error: ${err.stack || err}`);
        return res.status(500).send(`Error updating stocks bought by buyer _id: ${buyerId}. Error: ${err}`);
    }

    res.send("SUCCESSFULLY BOUGHT");
}

function addStock( stoToAddObj ) {
    return stocksModel.createStock({
        ...stoToAddObj,
        createdAt: new Date()
    });
}

function getAllSoldStocks() {
    return stocksModel.getStocks({ status: SOLD });
}

function deleteStockByMongoId( _id ) {
    return stocksModel.deleteStockByMongoId( _id )
}

module.exports = {
    getAllStocks,
    buyStock,
    addStock,
    getAllSoldStocks,
    deleteStockByMongoId
};