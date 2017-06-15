"use strict";

import { Job } from "./job";
import events = require('events');
import Logger = require('./logger');

export class QueueList extends Array<Job> {
    private jobSpawnTemp: Array<number | Job> = [];
    private ev: events.EventEmitter = new events.EventEmitter();
    private jobID: number = 0;

    push(queue: Job): number {
        const number: number = super.push(queue);
        this.ev.emit('push', queue);
        return number;
    };

    shift(): Job {
        const queue: Job = super.shift();
        this.ev.emit('shift', queue);
        if (this.length == 0) {
            this.ev.emit('empty');
        }
        return queue;
    };

    hasAnyWorkingJob(): boolean {
        for (let item of this.entries()) {
            if (item[1].started) {
                return true;
            }
        }
        return false;
    }

    startFirst(): void {
        if (this.length > 0) {
            const job: Job = this[0];
            job.on('start', (job) => { this.jobStarted(job) });
            job.on('spawn', (job) => { this.jobSpawn(job) });
            job.on('success', (job) => { this.jobSuccess(job) });
            job.on('error', (job, error) => { this.jobError(job, error) });
            job.on('finish', (job) => { this.jobFinish(job) });
            job.start(this.jobID);
        }
    }

    on(eventName: string, listener:(job: Job, ...args) => any): void {
        this.ev.addListener(eventName, listener);
    }

    off(eventName: string, listener:(job: Job, ...args) => any): void {
        this.ev.removeListener(eventName, listener);
    }

    offAll(): void {
        this.ev.removeAllListeners();
    }

    jobStarted(job: Job): void {
        Logger.log("Job Started #", job.getConfig().id);
        Logger.debug("", job.getConfig());
    }

    jobSpawn(job: Job) {
        Logger.log("Current job spawn new job");
        Logger.debug("", job.getConfig());
        this.jobSpawnTemp.push(job);
    }

    jobSuccess(job: Job): void {
        Logger.log("Job Success #", job.getConfig().id);
        Logger.debug("", job.getConfig());
    }

    jobError(job: Job, error): void {
        Logger.error("Job Failed:", job.getConfig(), error);
    }

    jobFinish(job: Job): void {
        Logger.log("Job Complete #", job.getConfig().id);
        Logger.debug("", job.getConfig());
        if (this.jobSpawnTemp.length > 0) {
            // if there is spawned job, add them to the queue
            // and reset the list
            this.jobSpawnTemp.unshift(0);
            this.jobSpawnTemp.unshift(1);
            this.splice.apply(this, this.jobSpawnTemp);
            this.jobSpawnTemp = [];
        }
        // remove the first element
        this.shift();
        // start next job
        this.jobID++;
        if (this.length > 0) {
            this.startFirst();
        }
    }
}