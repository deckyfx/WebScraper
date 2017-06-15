"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events = require("events");
const Logger = require("./logger");
class QueueList extends Array {
    constructor() {
        super(...arguments);
        this.jobSpawnTemp = [];
        this.ev = new events.EventEmitter();
        this.jobID = 0;
    }
    push(queue) {
        const number = super.push(queue);
        this.ev.emit('push', queue);
        return number;
    }
    ;
    shift() {
        const queue = super.shift();
        this.ev.emit('shift', queue);
        if (this.length == 0) {
            this.ev.emit('empty');
        }
        return queue;
    }
    ;
    hasAnyWorkingJob() {
        for (let item of this.entries()) {
            if (item[1].started) {
                return true;
            }
        }
        return false;
    }
    startFirst() {
        if (this.length > 0) {
            const job = this[0];
            job.on('start', (job) => { this.jobStarted(job); });
            job.on('spawn', (job) => { this.jobSpawn(job); });
            job.on('success', (job) => { this.jobSuccess(job); });
            job.on('error', (job, error) => { this.jobError(job, error); });
            job.on('finish', (job) => { this.jobFinish(job); });
            job.start(this.jobID);
        }
    }
    on(eventName, listener) {
        this.ev.addListener(eventName, listener);
    }
    off(eventName, listener) {
        this.ev.removeListener(eventName, listener);
    }
    offAll() {
        this.ev.removeAllListeners();
    }
    jobStarted(job) {
        Logger.log("Job Started #", job.getConfig().id);
        Logger.debug("", job.getConfig());
    }
    jobSpawn(job) {
        Logger.log("Current job spawn new job");
        Logger.debug("", job.getConfig());
        this.jobSpawnTemp.push(job);
    }
    jobSuccess(job) {
        Logger.log("Job Success #", job.getConfig().id);
        Logger.debug("", job.getConfig());
    }
    jobError(job, error) {
        Logger.error("Job Failed:", job.getConfig(), error);
    }
    jobFinish(job) {
        Logger.log("Job Complete #", job.getConfig().id);
        Logger.debug("", job.getConfig());
        if (this.jobSpawnTemp.length > 0) {
            this.jobSpawnTemp.unshift(0);
            this.jobSpawnTemp.unshift(1);
            this.splice.apply(this, this.jobSpawnTemp);
            this.jobSpawnTemp = [];
        }
        this.shift();
        this.jobID++;
        if (this.length > 0) {
            this.startFirst();
        }
    }
}
exports.QueueList = QueueList;
//# sourceMappingURL=queuelist.js.map