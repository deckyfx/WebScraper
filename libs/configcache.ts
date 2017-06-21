"use strict";

import { JobConfig } from "./jobconfig";
import Logger = require('./logger');

import crypto = require("crypto");
import ConfigReader = require("config-reader");
import { JSDOM } from 'jsdom';
import fs = require('fs');
import _ = require('lodash');
import { ParseConfig } from "./parseconfig";
const wgxpath = require('wgxpath');

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

    get anchorXpath(): string {
        return this.config.anchorXpath;
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
        const getValue = (el: Element | Node, getter: string, property: boolean, attr: boolean): string => {
            let rs;
            if (property) {
                switch (getter) {
                    case "textNodes": {
                        const childs = el["childNodes"];
                        let _rs;
                        for (let i = 0; i < childs.length; i++) {
                            const child = childs[i];
                            if (child.constructor.name == "Text") {
                                 const _rsd = child["data"].trim();
                                 if (_rsd) {
                                    _rs = _rs? _rs:[];
                                    _rs.push(_rsd);
                                 }
                            }
                        }                       
                        if (_rs.length > 0) {
                            if (_rs.length == 1) {
                                rs = _rs[0];
                            } else {
                                rs = _rs;
                            }
                        }
                    } break;
                    default: {                        
                        rs = el[getter];
                    } break;
                }
            } else if (attr) {
                let attr = el.attributes.getNamedItem(getter);
                if (attr) {
                    rs = attr.value;
                }
            }
            if (rs) {
                if (typeof(rs) == "string") {
                    rs = rs.trim();
                }
            }
            return rs;
        }

        const getElements = (getter:string, query: boolean, xpath: boolean): Array<Element | Node> => {
            let els: Array<Element | Node> = [];
            const document = this.dom.window.document;
            if (query) {                    
                const elements = document.querySelectorAll(getter);
                for (let i = 0; i < elements.length; i++) {
                    els.push(elements[i])
                }
            } else if (xpath) {
                wgxpath.install(this.dom.window, true);
                let nodesSnapshot = document.evaluate(getter, document, null, wgxpath.XPathResultType.ORDERED_NODE_SNAPSHOT_TYPE, null );
                for ( let i=0 ; i < nodesSnapshot.snapshotLength; i++ ){
                    els.push( nodesSnapshot.snapshotItem(i) );
                }
            }
            return els;
        }

        const parse = (cfg: ParseConfig): string | Array<any> => {
            var result: string | Array<any>;
            if (cfg.value != null && cfg.name) {
                result = cfg.value;
            } else if (cfg.group) {
                let _result;
                for (let _cfg of cfg.group) {
                    let rs = parse(_cfg);
                    if (rs) {
                        _result = _result? _result:{};
                        _result[_cfg.name] = rs;
                    }
                }
                result = _result;
            } else {
                const useQuery = cfg.query? true:false;
                const useXpath = cfg.xpath? true:false;
                const getter = useQuery? cfg.query:(useXpath? cfg.xpath:null);
                let elements: Array<Element | Node> = getElements(getter, useQuery, useXpath);
                let _result;
                for (let el of elements) {
                    const useProperty = cfg.property? true:false;
                    const useAttr = cfg.attr? true:false;
                    const getter = useProperty? cfg.property:(useAttr? cfg.attr:null);
                    if (typeof(getter) == "string") {
                        const value = getValue(el, getter, useProperty, useAttr)
                        if (value) {
                            _result = _result? _result:[];
                            _result.push(value);
                        }
                    } else if (getter instanceof Array) {
                        const getters:Array<string> = getter as Array<string>;
                        let rs:Array<string> = [];
                        for (let getter_n of getters) {
                            const value = getValue(el, getter_n, useProperty, useAttr)
                            if (value) {
                                rs.push(value);
                            }
                        }
                        if (rs.length > 0) {
                            _result = _result? _result:[];
                            _result.push(rs);
                        }
                    } else if (getter instanceof Object) {
                        const getters:{ [name: string]: string } = getter as  { [name: string]: string };
                        let rs:{ [name: string]: string } = {};
                        _.forOwn(getters, (getter, name) => {
                            const value = getValue(el, getter, useProperty, useAttr)
                            if (value) {
                                rs[name] = value;
                            }
                        });
                        if (_.size(rs) > 0) {
                            _result = _result? _result:[];
                            _result.push(rs);
                        }
                    }
                }
                if (_result) {                
                    if (_result.length > 0) {
                        if (_result.length == 1) {
                            result = _result[0];
                        } else if (cfg.index != null && _result[cfg.index]) {
                            result = _result[cfg.index];
                        } else {
                            result = _result;
                        }
                    }
                }
            }
            return result;
        }

        for (let config of this.config.queries) {
            let result = parse(config);
            if (result) {
                this.queryResult = this.queryResult? this.queryResult:{};
                this.queryResult[config.name] = result;
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