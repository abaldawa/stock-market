/**
 * User: abhijit.baldawa
 *
 * This module exposes 'init' method to connect mongoose client to mongodb server
 */

const
    mongoose = require('mongoose');

/**
 * @private
 *
 * This method accepts a config object and returns a mongodb connection URL string as per mongodb guideline
 *
 * @param {object} config This object has all the necessary details to connect to mongodb server as configured by user
 * @returns {string} a URL connection string as per mongodb guideline
 */
function getMongoUrlFromConfig( config ) {
    let
        adminAuthSource,
        URL = "mongodb://";

    if(config.dbUser && config.dbPassword && config.authSource) {
        URL = `${URL}${config.dbUser}:${config.dbPassword}@`;
        adminAuthSource = `?authSource=${config.authSource}`;
    }

    URL = `${URL}${config.dbHost}:${config.dbPort}/${config.dbName}`;

    if(adminAuthSource) {
        URL = `${URL}${adminAuthSource}`;
    }
    return URL;
}

/**
 * @public
 *
 * This method connects mongoose to mongoDB server
 *
 * @param {object} dbConfig
 * @returns {Promise<Object>} If successful then resolves to undefined or rejects with error
 */
function createConnection( dbConfig ){
    const
        URL = getMongoUrlFromConfig(dbConfig);

    mongoose.connect(URL, { useNewUrlParser: true });

    return new Promise((resolve, reject) => {
                mongoose.connection
                    .on('error', reject)
                    .once('open', resolve);
           });
}

module.exports = {
    createConnection
};