"use strict";

import { JobConfig } from "./jobconfig";
import { ConfigCache } from "./configcache";
import Logger = require('./logger');

import fs = require('fs');
import path = require('path');
import events = require('events');

import request = require('request');
import { JSDOM } from 'jsdom';
import { URL } from 'url';
const wgxpath = require('wgxpath');

export class Job {
    private config: ConfigCache;
    private _started: boolean;
    private ev: events.EventEmitter = new events.EventEmitter();
    private _success: boolean;

    constructor(config: JobConfig){
        this.config = new ConfigCache(config);
    }

    get started(): boolean {
        return this._started;
    }

    get success(): boolean {
        return this._success;
    }
    
    set success(flag: boolean) {
        this._success = flag;
    }

    start(id: number): void {
        this.config.setId(id);
        const promise = new Promise<Job>((resolve, reject) => {
            setTimeout(async () => {
                try {                    
                    if (this.config.useRegExp) {                      
                        const cacheFiles: Array<string> = fs.readdirSync(this.config.cacheDir);
                        let limit = this.config.regexpLimit;
                        limit = (limit && limit > 0)? limit:cacheFiles.length;
                        let i = 0;
                        for (let cacheFile of cacheFiles) {
                            const extName = path.extname(cacheFile);
                            const baseName = cacheFile.replace(extName, "");
                            const useRegExp = new RegExp((this.config.useRegExp as string));
                            const validName = useRegExp.test(baseName)
                            if (validName && extName == ".json") {
                                Logger.log("Want to use " + this.config.cacheDir + "/" + baseName + ".html");
                                if (fs.existsSync(this.config.cacheDir + "/" + baseName + ".html")) {
                                    // if we found anyfiles matching with the RegExp 
                                    // terminate this job and create pseudo jobs based on found files
                                    let new_config = this.config.createNewConfigWithUse(baseName);
                                    this.ev.emit('spawn', new Job(new_config));
                                    i++;
                                    if (i >= limit) {
                                        break;
                                    }
                                }
                            }
                        }
                        this.config.writeCache();
                        resolve(this);
                    } else if (this.config.use) {
                        Logger.log("Use Cached Page: ", this.config.use);
                        const cache: JobConfig = this.config.getCacheConfig(this.config.use);
                        const cachePage: JSDOM = this.config.getPageCache(this.config.use);
                        const document = cachePage.window.document;
                        let links: Array<Element | Node> = [];
                        if (this.config.anchor) {                    
                            const elements = document.querySelectorAll(this.config.anchor);
                            for (let i = 0; i < elements.length; i++) {
                                links.push(elements[i])
                            }
                        } else if (this.config.anchorXpath) {
                            let nodesSnapshot = document.evaluate(this.config.anchorXpath, document, null, wgxpath.XPathResultType.ORDERED_NODE_SNAPSHOT_TYPE, null );
                            for ( let i=0 ; i < nodesSnapshot.snapshotLength; i++ ){
                                links.push( nodesSnapshot.snapshotItem(i) );
                            }
                        }
                        if (links.length > 1) {
                            // if we found more than 1 url in the result, 
                            // terminate this job and create pseudo jobs based on found links
                            let limit = links.length;
                            if (this.config.anchorLimit) {
                                if (this.config.anchorLimit > 0 && this.config.anchorLimit > links.length) {
                                    limit = this.config.anchorLimit;
                                }
                            }
                            for (let i = 0; i < limit; i++) {
                                const anchor = links[i] as HTMLAnchorElement;
                                let new_config = this.config.createNewConfigWithURL(this.getURL(anchor, cache.load));
                                this.ev.emit('spawn', new Job(new_config));
                            }
                            this.config.writeCache();
                            resolve(this);
                        } else if (links.length == 1) {
                            const url = this.getURL(links[0] as HTMLAnchorElement, cache.load);
                            this.config.resolveAnchor(url);
                            resolve(await this.download(url));
                        } else {
                            Logger.warn("Anchor Query resulting zero element, using: ", this.config.use, ", query: ",this.config.load);
                            resolve(this);
                        }           
                    } else {
                        resolve(await this.download(this.config.load));
                    }    
                } catch (error) {
                    reject(error);
                }                  
            }, this.config.delay);
        });

        this._started = true;
        this.ev.emit('start', this);
        promise.then(() => {
            this.success = true;
            this.ev.emit('success', this);
            this.ev.emit('finish', this);
            this._started = false;
        }).catch(( error ) => { 
            Logger.error("", error);
            this.success = false;
            this.ev.emit('error', this, error);
            this.ev.emit('finish', this);
            this._started = false;
        })
    }

    private async download(url: string) : Promise<Job> {
        Logger.log("Loading page ", url);
        return new Promise<Job>((resolve, reject) => {
            request({ uri: url }, async (error, response, body) => {
                if (!response) {
                    reject(new Error("Empty Response"));
                } else if (error && response.statusCode !== 200) {
                    reject(error);
                } else {
                    try {
                        Logger.log("Load page done");
                        this.config.resolvePage(body);
                        this.config.parseQueries();
                        this.config.writeCache();
                        resolve(this);
                    } catch (error) {
                        reject(error);
                    }
                }
            });
        });
    } 

    private getURL(anchor: HTMLAnchorElement, baseURL: string): string {
        let url: string = "";
        if (this.testValidHref(anchor.href)) {
            url = anchor.href
        } else {
            const bUrl = new URL(baseURL); 
            // use loaded URL + path, or use orgin url + path?
            //url = usedCache.loadedURL.replace(/\/?$/, '') + "/" + link.href.replace(/^\/?/, '');
            url = bUrl.origin.replace(/\/?$/, '') + "/" + anchor.href.replace(/^\/?/, '');
        }
        return url;
    }

    private testValidHref(href: string): boolean {
        try {
            new URL(href).href;
            return true;
        } catch (e) {
            return false;
        } 
    }

    getConfig(): JobConfig {
        return this.config.getConfig();
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
}
