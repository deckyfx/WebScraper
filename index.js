"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ConfigReader = require("config-reader");
const queuelist_1 = require("./libs/queuelist");
const job_1 = require("./libs/job");
const Logger = require("./libs/logger");
const del = require("delete");
const mkdirp = require("mkdirp");
const fs = require("fs");
const path = require("path");
const comander = require("commander");
const url_1 = require("url");
class Scraper {
    constructor() {
        this.queue = new queuelist_1.QueueList();
        this.failed = [];
        const packageJSON = (new ConfigReader()).parseSync("package.json");
        comander.version(packageJSON.version)
            .option('-c, --config [filepath]', 'Configuration file path')
            .option('-o, --output [filepath]', 'Output result file path')
            .option('-u, --url [url]', 'Load an URL, use with -q --query or -x, --xpath and -p --property')
            .option('-q, --query [query]', 'get element with querySelector, use with -u --url and -p --property')
            .option('-x, --xpath [xpath]', 'get element with xpath, use with -u --url and -p --property')
            .option('-p, --property [property]', 'get element property, use with -q --query or -x, --xpath and -u --url')
            .option('-v, --verbose', 'Verbose mode')
            .parse(process.argv);
        if (comander.config) {
            if (fs.existsSync(comander.config)) {
                this.configs = (new ConfigReader()).parseSync(comander.config);
            }
            else {
                Logger.error("Invalid File");
            }
        }
        else if (comander.url || comander.query || comander.xpath || comander.property) {
            if (comander.url && comander.query && comander.property || comander.url && comander.xpath && comander.property) {
                try {
                    let url = (new url_1.URL(comander.url));
                    this.configs = {
                        name: url.hostname,
                        tasks: [{
                                name: "0",
                                load: url.toString(),
                                queries: [{
                                        name: "0",
                                        query: comander.query,
                                        xpath: comander.xpath,
                                        property: comander.property,
                                    }]
                            }]
                    };
                    this.oneTaskMode = true;
                }
                catch (e) {
                    Logger.error("Invalid URL", e);
                }
            }
            else {
                Logger.error("Require url, query, and property or xpath parameter");
            }
        }
        if (!this.configs) {
            Logger.error("Invalid Parameter please see -h --help");
            return;
        }
        this.comander = comander;
        this.queue.on('push', (job) => { this.onAddQueue(job); });
        this.queue.on('shift', (job) => { this.onShiftQueue(job); });
        this.queue.on('empty', () => { this.onEmptyQueue(); });
        Logger.log("Scraper is online");
        this.cacheDir = __dirname + "/cache/" + this.configs.name;
        this.progressFile = this.cacheDir + "/progress.json";
        this.failedFile = this.cacheDir + "/failed.json";
        this.doProcess();
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
        if (this.oneTaskMode) {
            console.log(result['0']['0']);
        }
        else {
            console.log(JSON.stringify(result, null, 0));
        }
    }
}
exports.Scraper = Scraper;
//# sourceMappingURL=index.js.map