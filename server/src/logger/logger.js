/**
 * User: abhijit.baldawa
 *
 * Standard logger module using winston
 */

const
    chalk = require('chalk'),
    { createLogger, format, transports: {Console} } = require('winston'),
    { combine, timestamp, printf } = format;

module.exports = createLogger({
    level: 'info',
    format: combine(
        timestamp(),
        printf(logObj => {
            const
                log = `${logObj.timestamp} ${logObj.level}: ${logObj.message}`;

            if( logObj.level === "warn" ) {
                return chalk.yellow(log);
            } else if( logObj.level === "error" ) {
                return chalk.red(log);
            } else {
                return log;
            }
        })
    ),
    transports: [new Console()]
});