/**
 * User: abhijit.baldawa
 *
 * This module exposes methods to perform CRUD operations on users collection.
 */

const
    mongoose = require('mongoose'),
    {formatPromiseResult} = require('../../utils/util'),
    logger = require('../../logger/logger'),
    usersSchema = new mongoose.Schema({
        userName: String,
        credit: Number,
        currency: String,
        stocks: [{
            stockName: String,
            stockId: String,
            price: Number,
            quantity: Number,
            purchaseDate: Date,
            currency: String
        }]
    }),
    UserModel = mongoose.model('user', usersSchema);

function createUser( userObj ) {
    return new UserModel(userObj).save();
}

function getUserById( _id ) {
    return UserModel.findOne({_id});
}

function updateUserById( _id, updatedUserObj ) {
    return UserModel.updateOne({_id}, {$set: updatedUserObj});
}

function getAllUsers() {
    return UserModel.find({});
}

async function addBoughtStockToUser( args = {} ) {
    const
        { stockObj, userId } = args;

    let
        err,
        userObj,
        updatedUserObj = {},
        totalStockPrice;

    if( !stockObj || !userId ) {
        throw new Error(`'stockObj' and 'userId' required in input object`);
    }

    // --------------------------- 1. Get the user by mongo _id ------------------------------------------------------------
    [err, userObj] = await formatPromiseResult( getUserById(userId) );

    if( err ) {
        logger.error(`addBoughtStockToUser: Error querying user _id = '${userId}' from the DB. Error: ${err.stack || err}`);
        throw err;
    }

    if( !userObj ) {
        throw new Erro(`user _id: ${userId} not found in the DB`);
    }
    // ---------------------------------------- 1. END ---------------------------------------------------------------------


    // ---------------------------------- 2. Update user with bought stock --------------------------------------------------
    totalStockPrice = stockObj.price * stockObj.quantity;

    if( userObj.credit < totalStockPrice ) {
        throw new Error(`Not enough credits to buy. Credits required: ${totalStockPrice} ${stockObj.currency} but available: ${userObj.credit} ${userObj.currency}`);
    }

    if( userObj.stocks ) {
        updatedUserObj.stocks = [...userObj.stocks, {...stockObj, purchaseDate: new Date()}];
    } else {
        updatedUserObj.stocks = [{...stockObj, purchaseDate: new Date()}];
    }

    updatedUserObj.credit = userObj.credit - totalStockPrice;

    [err] = await formatPromiseResult( updateUserById(userId, updatedUserObj) );

    if(err) {
        logger.error(`Error while adding bought stock to user _id: ${userId}. Error: ${err.stack || err}`);
        throw err;
    }
    // -------------------------------------------------- 2. END ----------------------------------------------------------
}

async function updateSoldStockByUser( args = {} ) {
    const
        {userId, stockObj} = args;

    let
        err,
        userObj,
        updatedUserObj = {stocks: []},
        totalStockPrice;

    if( !userId || !stockObj ) {
        throw new Error(`'userId' and 'stockObj' are required in input object`);
    }

    // --------------------------- 1. Get the user by mongo _id ------------------------------------------------------------
    [err, userObj] = await formatPromiseResult( getUserById(userId) );

    if( err ) {
        logger.error(`updateSoldStockByUser: Error querying user _id = '${userId}' from the DB. Error: ${err.stack || err}`);
        throw err;
    }
    // ---------------------------------------- 1. END ---------------------------------------------------------------------


    // ----------- 2. Remove/update sold 'stockObj' form user stocks array and also add credits to the user ----------------
    for(let dbStockObj of userObj.stocks) {
        if( dbStockObj.stockId === stockObj.stockId ) {
            if( stockObj.quantity !== dbStockObj.quantity ) {
                updatedUserObj.stocks.push({...dbStockObj, quantity: dbStockObj.quantity - stockObj.quantity});
            }

            updatedUserObj.credit = userObj.credit + (stockObj.price * stockObj.quantity);
        } else {
            updatedUserObj.push(dbStockObj);
        }
    }

    [err] = await formatPromiseResult( updateUserById(userId, updatedUserObj) );

    if(err) {
        logger.error(`Error while updating sold stock information for user _id: ${userId}. Error: ${err.stack || err}`);
        throw err;
    }
    // ----------------------------------------------- 2. END --------------------------------------------------------------
}

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    addBoughtStockToUser,
    updateSoldStockByUser
};