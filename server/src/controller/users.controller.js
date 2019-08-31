/**
 * User: abhijit.baldawa
 */

const
    usersModel = require('../database/models/users.model'),
    logger = require('../logger/logger'),
    {formatPromiseResult, getRandomInt} = require('../utils/util'),
    {AVAILABLE} = require('../database/models/stocks.model').getStatusEnum();

function getStocksController() {
    return require('./stocks.controller')
}

function getUserById( userId ) {
    return usersModel.getUserById(userId);
}

async function sellStock( req, res ) {
    const
        {stockId, userId} = req.body || {},
        stocksController = getStocksController();

    let
        err,
        stockObj,
        userObj;

    if( !stockId || !userId ) {
        return res.status(400).send(`'stockId' and 'userId' required`);
    }

    [err, userObj] = await formatPromiseResult( getUserById(userId) );

    if(err) {
        res.status(500).send(`todo: Error: ${err}`);
    }

    if( !userObj ) {
        return res.status(404).send(`user _id: ${userId} not found in DB`);
    }

    if( !userObj.stocks || !userObj.stocks.length ) {
        return res.status(403).send(`user name: ${userObj.userName} does not have any stocks to sell`);
    }

    stockObj = userObj.stocks.find( (stockItem) =>{
                    if( stockItem.stockId === stockId ) {
                        return true;
                    }
                } );

    if( !stockObj ) {
        return res.status(404).send(`user name: ${userObj.userName} does not have stock Id: ${stockId}`);
    }

    [err] = await formatPromiseResult(
                    stocksController.addStock({
                        stockName: stockObj.stockName,
                        stockId: stockObj.stockId,
                        price: stockObj.price,
                        currency: stockObj.currency,
                        quantity: stockObj.quantity,
                        sellerId: userObj._id,
                        status: AVAILABLE
                    })
                  );

    if( err ) {
        logger.error(`Error while adding available stock in stocks collection. Error: ${err.stack || err}`);
        return res.status(500).send(`Error while adding available stock in stocks collection. Error: ${err}`);
    }

    res.send("SOLD");
}

async function createUser(req, res) {
    const
        {userName} = req.body || {};

    let
        err,
        createdUser;

    if(!userName) {
        return res.status(400).send(`'userName' missing`);
    }

    [err, createdUser] = await formatPromiseResult(
                                 usersModel.createUser({
                                    userName,
                                    currency: "EUR",
                                    credit: getRandomInt(200, 900)
                                 })
                               );

    if(err) {
        logger.error(`Error while creating user. Error: ${err.stack || err}`);
        return res.status(500).send(`Error creating user. Error message: ${err}`);
    }

    res.send(createdUser);
}

async function getAllUsers( req, res ) {
    let
        err,
        usersArr;

    [err, usersArr] = await formatPromiseResult( usersModel.getAllUsers() );

    if(err) {
        logger.error(`Error querying users. Error: ${err.stack || err}`);
        return res.status(500).send(`Error querying users. Error message: ${err}`)
    }

    res.json(usersArr);
}

function addBoughtStockToUser( args ) {
    return usersModel.addBoughtStockToUser(args);
}

function updateSoldStockByUser( args ) {
    return usersModel.updateSoldStockByUser(args);
}

module.exports = {
    getUserById,
    sellStock,
    createUser,
    getAllUsers,
    addBoughtStockToUser,
    updateSoldStockByUser
};