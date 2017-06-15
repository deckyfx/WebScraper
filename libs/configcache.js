"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Logger = require("./logger");
const crypto = require("crypto");
const ConfigReader = require("config-reader");
const jsdom_1 = require("jsdom");
const fs = require("fs");
const _ = require("lodash");
const wgxpath = require('wgxpath');
class ConfigCache {
    constructor(config) {
        this.config = config;
        this.config.delay = this.config.delay ? this.config.delay : 0;
        this.config.name = this.config.name ? this.config.name : crypto.randomBytes(16).toString("hex");
    }
    setId(id) {
        this.config.id = id;
    }
    get delay() {
        return this.config.delay;
    }
    get use() {
        return this.config.use;
    }
    get useRegExp() {
        return this.config.useRegExp;
    }
    get anchor() {
        return this.config.anchor;
    }
    get anchorXpath() {
        return this.config.anchorXpath;
    }
    get load() {
        return this.config.load;
    }
    get cacheDir() {
        return this.config.cacheDir;
    }
    get regexpLimit() {
        return this.config.regexpLimit;
    }
    get anchorLimit() {
        return this.config.anchorLimit;
    }
    resolvePage(body) {
        this.body = body;
        this.dom = new jsdom_1.JSDOM(body, {
            includeNodeLocations: true
        });
        this.config.pageResolved = true;
        return this.dom;
    }
    parseQueries() {
        for (let i = 0; i < this.config.queries.length; i++) {
            var config = this.config.queries[i];
            if (config.value != null && config.name) {
                this.queryResult = this.queryResult ? this.queryResult : {};
                this.queryResult[config.name] = config.value;
            }
            else {
                let els = [];
                const document = this.dom.window.document;
                if (config.query) {
                    const elements = document.querySelectorAll(config.query);
                    for (let i = 0; i < elements.length; i++) {
                        els.push(elements[i]);
                    }
                }
                else if (config.xpath) {
                    wgxpath.install(this.dom.window, true);
                    let nodesSnapshot = document.evaluate(config.xpath, document, null, wgxpath.XPathResultType.ORDERED_NODE_SNAPSHOT_TYPE, null);
                    for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {
                        els.push(nodesSnapshot.snapshotItem(i));
                    }
                }
                let result = [];
                for (let el of els) {
                    let rs = el[config.property];
                    if (rs) {
                        result.push(rs.trim());
                    }
                }
                if (result.length > 0) {
                    if (result.length == 1) {
                        result = result[0];
                    }
                    else {
                        if (config.index != null && result[config.index]) {
                            result = result[config.index];
                        }
                    }
                    this.queryResult = this.queryResult ? this.queryResult : {};
                    this.queryResult[config.name] = result;
                }
            }
        }
    }
    resolveAnchor(url) {
        this.config.load = url;
        delete this.config.use;
        delete this.config.anchor;
    }
    createNewConfigWithURL(url) {
        let new_config = _.clone(this.config);
        new_config.load = url;
        delete new_config.use;
        delete new_config.anchor;
        new_config.parrent = this.config.name;
        return new_config;
    }
    createNewConfigWithUse(use) {
        let new_config = _.clone(this.config);
        delete new_config.useRegExp;
        new_config.use = use;
        new_config.parrent = this.config.name;
        return new_config;
    }
    getPageCache(name) {
        return new jsdom_1.JSDOM(fs.readFileSync(this.getCachePath(name) + ".html"), {
            includeNodeLocations: true
        });
    }
    getCacheConfig(name) {
        return (new ConfigReader()).parseSync(this.getCachePath(name) + ".json");
    }
    getCacheDir(name) {
        if (name)
            return this.config.cacheDir + "/" + name;
        else
            return this.config.cacheDir + "/" + this.config.name;
    }
    getCachePath(name) {
        return this.getCacheDir(name);
    }
    writeCache() {
        const counter = this.getNextFileCounter(this.config.name);
        this.config.name = this.config.name + ((counter >= 0) ? ("-" + counter) : "");
        const savePath = this.getCachePath();
        if (this.config.pageResolved) {
            fs.writeFileSync(savePath + ".html", this.body, { flag: 'w+' });
        }
        if (this.config.queries.length > 0 && this.queryResult) {
            fs.writeFileSync(savePath + ".result", JSON.stringify(this.queryResult, null, 4), { flag: 'w+' });
        }
        fs.writeFileSync(savePath + ".json", JSON.stringify(this.config, null, 4), { flag: 'w+' });
        Logger.log("Write to cache: ", savePath);
    }
    getConfig() {
        const c = _.clone(this.config);
        return c;
    }
    getNextFileCounter(baseName) {
        let cacheFiles = fs.readdirSync(this.config.cacheDir);
        let matchFiles = [];
        let countFiles = [];
        const reg = new RegExp("^" + baseName + "(-?)(\\d*).json$");
        cacheFiles.forEach(function (item, index, object) {
            if (reg.test(item)) {
                matchFiles.push(item);
            }
        });
        matchFiles.forEach(function (item, index, object) {
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
exports.ConfigCache = ConfigCache;
//# sourceMappingURL=configcache.js.map