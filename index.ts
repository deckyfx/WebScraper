"use strict";

import ConfigReader = require("config-reader");
import { QueueList } from "./libs/queuelist";
import { Job } from "./libs/job";
import { QueueConfig } from "./libs/queueconfig";
import { JobConfig } from "./libs/jobconfig";
import Logger = require('./libs/logger');

import del = require('delete');
import mkdirp = require('mkdirp');
import fs = require('fs');
import path = require('path');
import comander = require('commander');
import { URL } from 'url';

export class Scraper {
    private oneTaskMode: boolean;
    private comander: any;
    private progressFile: string;
    private failedFile: string;
    private configs: QueueConfig;
    private cacheDir: string;
    private queue: QueueList = new QueueList();
    private failed: Array<JobConfig> = [];

    constructor() {
        const packageJSON = (new ConfigReader()).parseSync("package.json");
        comander.version(packageJSON.version)
            .option('-c, --config [filepath]', 'Configuration file path')
            .option('-o, --output [filepath]', 'Output result file path')
            .option('-u, --url [url]', 'Load an URL, use with -q --query or -x, --xpath and -p --property or -a --attr')
            .option('-q, --query [query]', 'get element with querySelector, use with -u --url and -p --property or -a --attr')
            .option('-x, --xpath [xpath]', 'get element with xpath, use with -u --url and -p --property or -a --attr')
            .option('-p, --property [property]', 'get element property, use with -q --query or -x, --xpath and -u --url')
            .option('-a, --attr [attr]', 'get element attr, use with -q --query or -x, --xpath and -u --url')
            .option('-v, --verbose', 'Verbose mode')
            .parse(process.argv);
        
        if (comander.config) {
            if (fs.existsSync(comander.config)) {
                 this.configs = (new ConfigReader()).parseSync(comander.config) as QueueConfig;
            } else {
                Logger.error("Invalid File");
            }           
        } else if (comander.url || comander.query || comander.xpath || comander.property || comander.attr) {
            if (comander.url && (comander.query || comander.xpath) && (comander.property || comander.attr)) {
                try {
                    let url = (new URL(comander.url));
                    let query = {
                        name: "0",
                        query: comander.query,
                        xpath: comander.xpath
                    };
                    if (comander.property) {
                        query['property'] = comander.property;
                    } else if (comander.attr) {
                        query['attr'] = comander.attr;
                    }
                    let task = {
                        name: "0",
                        load: url.toString(),
                        queries: [query]
                    };
                    this.configs = {
                        name: url.hostname,
                        tasks: [task]
                    };
                    this.oneTaskMode = true;
                } catch (e) {
                    Logger.error("Invalid URL", e);
                }                
            } else {
                Logger.error("Require url, query, and property or xpath parameter");
            }
        }
        if (!this.configs) {
            Logger.error("Invalid Parameter please see -h --help");
            return;
        }

        this.comander = comander;
        this.queue.on('push', (job) => { this.onAddQueue(job) });
        this.queue.on('shift', (job) => { this.onShiftQueue(job) });
        this.queue.on('empty', () => { this.onEmptyQueue() });
        Logger.log("Scraper is online");

        this.cacheDir = __dirname + "/cache/" + this.configs.name;
        this.progressFile = this.cacheDir + "/progress.json";
        this.failedFile = this.cacheDir + "/failed.json";

        this.doProcess();
    }

    doProcess(): void {
        try {
            let queue:Array<JobConfig> = [];
            if (fs.existsSync(this.progressFile)) {
                queue = (new ConfigReader()).parseSync(this.progressFile) as Array<JobConfig>;
            }
            if (fs.existsSync(this.failedFile)) {
                const failed = (new ConfigReader()).parseSync(this.failedFile) as Array<JobConfig>;
                failed.forEach(config => {
                    queue.unshift(config);
                });
            }                
            if (queue.length > 0) {
                Logger.log("Continue last progress");
                queue.forEach(config => {
                    const job:Job = new Job(config);
                    this.queue.push(job);
                });
                this.start();
            } else {
                Logger.log("Init new scraper");
                Logger.log("Remove Cache Directory ", this.cacheDir);
                try {
                    // remove cache directory
                    del.sync([this.cacheDir]);                
                } catch(err) {
                    Logger.error("", err);
                }
                Logger.log("Create Cache Directory");
                mkdirp(this.cacheDir, (err) => {
                    if (err) {
                        Logger.error(err);
                    } else {
                        this.configs.tasks.forEach(config => {
                            config.projectName = this.configs.name;
                            config.cacheDir = this.cacheDir;
                            const job:Job = new Job(config);
                            this.queue.push(job);
                        });
                        this.start();
                    }
                });
            }
        } catch (error) {
            Logger.log("Malformated queue JSON: ", error);
        }       
    }

    start(): void {
        Logger.log("Start Job Queue");
        this.failed = [];
        fs.writeFileSync(this.failedFile, JSON.stringify(this.failed, null, 4));
        this.queue.hasAnyWorkingJob()? void(0):this.queue.startFirst();
    }

    onAddQueue(queue: Job): void {
        Logger.log("A Job is added to end of Queue list");
    }

    onShiftQueue(queue: Job): void {
        Logger.log("A Job removed from start of list");
        let jobqueue: Array<JobConfig> = [];
        this.queue.forEach(function(job: Job){
            jobqueue.push(job.getConfig());
        });
        fs.writeFileSync(this.progressFile, JSON.stringify(jobqueue, null, 4));
        if (!queue.success) {
            this.failed.push(queue.getConfig());
            fs.writeFileSync(this.failedFile, JSON.stringify(this.failed, null, 4));            
        }
        Logger.log("Saving state");
    }

    onEmptyQueue(): void {
        Logger.log("Queue list is empty");
        if (this.failed.length > 0) {
            Logger.warn(`Failed task: ${this.failed.length}`);
        }
        // finalizing
        const caches: Array<string> = fs.readdirSync(this.cacheDir);
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
        } else {
            console.log(JSON.stringify(result, null, 0));
        }        
    }
}
