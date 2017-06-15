"use strict";

import { JobConfig } from "./jobconfig";
import Logger = require('./logger');

import crypto = require("crypto");
import ConfigReader = require("config-reader");
import { JSDOM } from 'jsdom';
import fs = require('fs');
import _ = require('lodash');

export class ConfigCache {
    body: string;
    dom: JSDOM;
    queryResult: any;

    constructor(private config: JobConfig) {
        this.config.delay = this.config.delay? this.config.delay:0;
        this.config.name = this.config.name? this.config.name:crypto.randomBytes(16).toString("hex");
    }

    setId(id: number): void {
        this.config.id = id;
    }

    get delay(): number {
        return this.config.delay;
    }

    get use(): string | number {
        return this.config.use;
    }

    get useRegExp(): string | number {
        return this.config.useRegExp;
    }

    get anchor(): string {
        return this.config.anchor;
    }

    get load(): string {
        return this.config.load;
    }

    get cacheDir(): string {
        return this.config.cacheDir;
    }

    get regexpLimit(): number {
        return this.config.regexpLimit;
    }

    get anchorLimit(): number {
        return this.config.anchorLimit;
    }

    resolvePage(body: string): JSDOM {
        this.body = body;
        this.dom = new JSDOM(body, { 
            includeNodeLocations: true 
        });
        this.config.pageResolved = true;
        return this.dom;
    }

    parseQueries(): void{
        for (let i = 0; i < this.config.queries.length; i++) {
            var config = this.config.queries[i];
            if (config.value != null && config.name) {
                this.queryResult = this.queryResult? this.queryResult:{};
                this.queryResult[config.name] = config.value;
            } else {
                const document = this.dom.window.document;
                const elements = document.querySelectorAll(config.query);
                let result: string | Array<string> = [];
                for (let el of elements) {
                    let rs = el[config.property];
                    if (rs) {
                        result.push(rs.trim());
                    }                    
                }
                if (result.length > 0) {
                    if (result.length == 1) {
                        result = result[0];
                    } else {      
                        if (config.index != null && result[config.index]) {
                            result = result[config.index];
                        }
                    }
                    this.queryResult = this.queryResult? this.queryResult:{};
                    this.queryResult[config.name] = result;
                }
            }
        }
    }

    resolveAnchor(url: string): void {
        this.config.load = url;
        delete this.config.use;
        delete this.config.anchor;
    }

    createNewConfigWithURL(url: string): JobConfig {
        let new_config = _.clone(this.config);
        new_config.load = url;
        delete new_config.use;
        delete new_config.anchor;
        new_config.parrent = this.config.name;
        return new_config;
    }

    createNewConfigWithUse(use: string): JobConfig {
        let new_config = _.clone(this.config);
        delete new_config.useRegExp;
        new_config.use = use;
        new_config.parrent = this.config.name;
        return new_config;
    }

    getPageCache(name?: string | number): JSDOM {
        return new JSDOM(fs.readFileSync(this.getCachePath(name) + ".html"), { 
            includeNodeLocations: true 
        });
    }

    getCacheConfig(name?: string | number): JobConfig {
        return (new ConfigReader()).parseSync(this.getCachePath(name) + ".json") as JobConfig;
    }

    private getCacheDir(name?: string | number): string {
        if (name)
            return this.config.cacheDir + "/" + name;
        else
            return this.config.cacheDir + "/" + this.config.name;        
    }

    private getCachePath(name?: string | number): string {
        return this.getCacheDir(name);
    }

    writeCache() {
        const counter = this.getNextFileCounter(this.config.name as string);        
        this.config.name = this.config.name + ( (counter >= 0)? ("-"+counter):"" );
        const savePath = this.getCachePath();       
        if (this.config.pageResolved) {
            fs.writeFileSync(savePath+ ".html", this.body, { flag : 'w+' });
        }
        if (this.config.queries.length > 0 && this.queryResult) {
            fs.writeFileSync(savePath + ".result", JSON.stringify(this.queryResult, null, 4), { flag : 'w+' });
        }
        fs.writeFileSync(savePath + ".json", JSON.stringify(this.config, null, 4), { flag : 'w+' });
        Logger.log("Write to cache: ", savePath);
    }

    getConfig(): JobConfig {
        const c = _.clone(this.config);
        return c;
    }

    private getNextFileCounter(baseName: string): number {
        let cacheFiles: Array<string> = fs.readdirSync(this.config.cacheDir);
        let matchFiles: Array<string> = [];
        let countFiles: Array<number> = [];
        const reg = new RegExp("^" + baseName + "(-?)(\\d*).json$");
        cacheFiles.forEach(function(item, index, object) {
            if (reg.test(item)) {
                matchFiles.push(item);
            }
        });
        matchFiles.forEach(function(item, index, object) {
            const matcher = item.match(reg);
            let nextCount = 0;
            if (matcher) {
                if (matcher[2]) {
                    nextCount = parseInt(matcher[2]) + 1;
                }
            }
            countFiles.push(nextCount);
        });
        if (countFiles.length > 0) {
            return Math.max.apply(null, countFiles);
        }
        return -1;
    }
}