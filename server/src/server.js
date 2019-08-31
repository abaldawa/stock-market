/**
 * User: abhijit.baldawa
 *
 * This module initializes all the pre-requisites and then starts the express and socket.io server
 */

const
    express = require('express'),
    http = require('http'),
    path = require('path'),
    stocksRouter = require('./routes/stocks.routes'),
    usersRouter = require('./routes/users.routes'),
    database = require('./database/dbConnection'),
    initDBModels = require('./database/models'),
    logger = require('./logger/logger'),
    socketIOServer = require('./socket_server/socketIOServer'),
    {formatPromiseResult} = require('./utils/util'),
    {getPort, getMongoDbConfig} = require('./config/config'),
    stockUpdaterDaemon = require('./daemon/stockUpdater'),
    app = express(),
    httpServer = require('http').createServer(app);

/**
 * Immediately invoking async method which does all the standard server startup routine.
 */
(async () =>{
    const
        PORT = getPort(),
        mongoDbConfig = getMongoDbConfig();

    let
        err,
        result;

    if( !PORT ) {
        logger.error(`Cannot start server as port information is missing`);
        process.exit(1);
    }

    // --------------------- 1. Add all the required express middleware ---------------------
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static(path.join(__dirname, "..","..", "client")));

    app.use('/stocks', stocksRouter);
    app.use('/users', usersRouter);
    // ---------------------------- 1. END -------------------------------------------------


    // -------------------- 2. initialize database -----------------------------------------
    [err] = await formatPromiseResult( database.createConnection(mongoDbConfig) );

    if( err ) {
        logger.error(`Failed to connect to mongodb. Error: ${err.stack || err}. Stopping server...`);
        process.exit(1);
    }

    logger.info(`Connected to database: ${mongoDbConfig.dbName}`);
    // -------------------- 2. END --------------------------------------------------------


    // -------------------- 3. Initialize DB models  --------------------------------------
    [err] = await formatPromiseResult( initDBModels() );

    if(err) {
        logger.error(`Error initializing DB models. Error: ${err.stack || err}. Stopping the server`);
        process.exit(1);
    }
    // -------------------------------------- 3. END --------------------------------------


    // ----------------------------- 4. Initialise socket IO server ----------------
    socketIOServer.init(httpServer);
    // ------------------------------------------- 4. END --------------------------


    // ------------------------------ 5. Start Http Server -------------------------------------------
    [err] = await formatPromiseResult(
                    new Promise( (resolve, reject) => {
                        httpServer.listen(PORT, () => {
                            resolve();
                        })
                        .on('error', (err) => {
                            reject(err);
                        })
                    } )
                  );

    if( err ) {
        logger.error(`Error while starting server on port = ${PORT}. Error: ${err.stack || err}. Exiting...`);
        process.exit(1);
    }

    logger.info(`Server is listening on port = ${PORT}`);
    // --------------------------------- 5. END -------------------------------------------------------


    // ---------------------- 6. Start sold stocks monitor daemon ------------------
    stockUpdaterDaemon.start();
    // -------------------------------------- 6. END -------------------------------
})();