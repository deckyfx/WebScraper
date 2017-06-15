"use strict";
const log4js = require("log4js");
class Logger {
    constructor() {
        log4js.configure({
            appenders: [
                { type: 'console', category: 'console' },
                { type: 'file', filename: 'procces.log', category: 'file' }
            ]
        });
        this.logger = log4js.getLogger("file");
        this.logger.setLevel("INFO");
    }
    setLevel(level) {
        this.logger.setLevel(level);
    }
    trace(message, ...args) {
        this.logger.trace(message, ...args);
    }
    debug(message, ...args) {
        this.logger.debug(message, ...args);
    }
    info(message, ...args) {
        this.logger.info(message, ...args);
    }
    warn(message, ...args) {
        args.unshift(message);
        this.logger.warn(message, ...args);
    }
    error(message, ...args) {
        this.logger.error(message, ...args);
    }
    fatal(message, ...args) {
        args.unshift(message);
        this.logger.fatal(message, ...args);
    }
    log(message, ...args) {
        this.logger.info(message, ...args);
    }
}
module.exports = new Logger();
//# sourceMappingURL=logger.js.map