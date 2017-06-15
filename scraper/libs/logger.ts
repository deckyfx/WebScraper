"use strict";

import * as log4js from 'log4js';

class Logger {
    logger: log4js.Logger;
    constructor() {
        log4js.configure({
            appenders: [
                { type: 'console', category: 'console' },
                { type: 'file', filename: 'logs/procces.log', category: 'file' }
            ]
        });
        this.logger = log4js.getLogger("console");
        this.logger.setLevel("INFO");
    }

    setLevel(level: string): void {
        this.logger.setLevel(level);
    }

    trace(message: string, ...args: any[]): void {
        this.logger.trace(message, ...args);
    }

    debug(message: string, ...args: any[]): void {
        this.logger.debug(message, ...args);
    }

    info(message: string, ...args: any[]): void {
        this.logger.info(message, ...args);
    }

    warn(message: string, ...args: any[]): void {
        args.unshift(message);
        this.logger.warn(message, ...args);
    }

    error(message: string, ...args: any[]): void {
        this.logger.error(message, ...args);
    }

    fatal(message: string, ...args: any[]): void {
        args.unshift(message);
        this.logger.fatal(message, ...args);
    }

    log(message: string, ...args: any[]): void {
        this.logger.info(message, ...args);
    }
}

export = new Logger();