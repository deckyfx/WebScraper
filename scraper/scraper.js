"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ConfigReader = require("config-reader");
const queuelist_1 = require("./libs/queuelist");
const job_1 = require("./libs/job");
const firebase_1 = require("./libs/firebase");
const Logger = require("./libs/logger");
const del = require("delete");
const mkdirp = require("mkdirp");
const fs = require("fs");
const path = require("path");
class Scraper {
    constructor() {
        this.queue = new queuelist_1.QueueList();
        this.failed = [];
        this.queue.on('push', (job) => { this.onAddQueue(job); });
        this.queue.on('shift', (job) => { this.onShiftQueue(job); });
        this.queue.on('empty', () => { this.onEmptyQueue(); });
        Logger.log("Scraper is online");
        this.configs = (new ConfigReader()).parseSync(__dirname + "/queue/wynnlasvegas.json");
        this.cacheDir = __dirname + "/cache/" + this.configs.name;
        this.progressFile = this.cacheDir + "/progress.json";
        this.failedFile = this.cacheDir + "/failed.json";
        new firebase_1.FireBaseIntegrator((new ConfigReader()).parseSync(this.cacheDir + "/result.json"));
    }
    doProcess() {
        try {
            let queue = [];
            if (fs.existsSync(this.progressFile)) {
                queue = (new ConfigReader()).parseSync(this.progressFile);
            }
            if (fs.existsSync(this.failedFile)) {
                const failed = (new ConfigReader()).parseSync(this.failedFile);
                failed.forEach(config => {
                    queue.unshift(config);
                });
            }
            if (queue.length > 0) {
                Logger.log("Continue last progress");
                queue.forEach(config => {
                    const job = new job_1.Job(config);
                    this.queue.push(job);
                });
                this.start();
            }
            else {
                Logger.log("Init new scraper");
                Logger.log("Remove Cache Directory ", this.cacheDir);
                try {
                    del.sync([this.cacheDir]);
                }
                catch (err) {
                    Logger.error("", err);
                }
                Logger.log("Create Cache Directory");
                mkdirp(this.cacheDir, (err) => {
                    if (err) {
                        Logger.error(err);
                    }
                    else {
                        this.configs.tasks.forEach(config => {
                            config.projectName = this.configs.name;
                            config.cacheDir = this.cacheDir;
                            const job = new job_1.Job(config);
                            this.queue.push(job);
                        });
                        this.start();
                    }
                });
            }
        }
        catch (error) {
            Logger.log("Malformated queue JSON: ", error);
        }
    }
    start() {
        Logger.log("Start Job Queue");
        this.failed = [];
        fs.writeFileSync(this.failedFile, JSON.stringify(this.failed, null, 4));
        this.queue.hasAnyWorkingJob() ? void (0) : this.queue.startFirst();
    }
    onAddQueue(queue) {
        Logger.log("A Job is added to end of Queue list");
    }
    onShiftQueue(queue) {
        Logger.log("A Job removed from start of list");
        let jobqueue = [];
        this.queue.forEach(function (job) {
            jobqueue.push(job.getConfig());
        });
        fs.writeFileSync(this.progressFile, JSON.stringify(jobqueue, null, 4));
        if (!queue.success) {
            this.failed.push(queue.getConfig());
            fs.writeFileSync(this.failedFile, JSON.stringify(this.failed, null, 4));
        }
        Logger.log("Saving state");
    }
    onEmptyQueue() {
        Logger.log("Queue list is empty");
        if (this.failed.length > 0) {
            Logger.warn(`Failed task: ${this.failed.length}`);
        }
        const caches = fs.readdirSync(this.cacheDir);
        var result = {};
        for (let cache of caches) {
            if (path.extname(cache) == ".result") {
                const rs = (new ConfigReader()).parseSync(this.cacheDir + "/" + cache);
                const baseName = path.basename(cache).replace(path.extname(cache), "");
                result[baseName] = rs;
            }
        }
        fs.writeFileSync(this.cacheDir + "/result.json", JSON.stringify(result, null, 4));
        Logger.debug("Final Result: ", result);
    }
}
exports.Scraper = Scraper;
//# sourceMappingURL=scraper.js.map