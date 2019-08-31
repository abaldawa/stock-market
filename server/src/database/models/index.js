/**
 * User: abhijit.baldawa
 *
 * This module initializes all db models
 */

const
    sampleStocksData = require('../sampleData/stocks'),
    stocksModel = require('./stocks.model'),
    logger = require('../../logger/logger.js'),
    {formatPromiseResult} = require('../../utils/util');

module.exports = async () => {
    let
        err,
        createdStock,
        totalStocks;

    // ------------------------- 1. Get total stocks in DB ----------------------------------------------------
    [err, totalStocks] = await formatPromiseResult( stocksModel.totalStocksCount() );

    if( err ) {
        logger.error(`Error fetching total number stocks in 'stocks' collection. Error: ${err.stack || err}`);
        throw err;
    }
    // -------------------------------------- 1. END ----------------------------------------------------------


    // ----------------- 2. Populate 'stocks' collection with sample data if empty ----------------------------
    if( !totalStocks ) {
        logger.info(`'stocks' collection looks empty. Populating it with sample data from 'stock-market/server/src/database/sampleData/stocks.json'`);

        for( const stockObj of sampleStocksData ) {
            [err, createdStock] = await formatPromiseResult( stocksModel.createStock(stockObj) );

            if( err ) {
                logger.error(`Error inserting stockId: ${stockObj.stockId} in DB. Error: ${err.stack || err}`);
                throw err;
            }
        }

        logger.info(`Successfully populated 'stocks' collection with sample data`);
    }
    // ------------------------------------------ 2. END ------------------------------------------------------
};