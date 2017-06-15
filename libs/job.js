"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const configcache_1 = require("./configcache");
const Logger = require("./logger");
const fs = require("fs");
const path = require("path");
const events = require("events");
const request = require("request");
const url_1 = require("url");
const wgxpath = require('wgxpath');
class Job {
    constructor(config) {
        this.ev = new events.EventEmitter();
        this.config = new configcache_1.ConfigCache(config);
    }
    get started() {
        return this._started;
    }
    get success() {
        return this._success;
    }
    set success(flag) {
        this._success = flag;
    }
    start(id) {
        this.config.setId(id);
        const promise = new Promise((resolve, reject) => {
            setTimeout(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    if (this.config.useRegExp) {
                        const cacheFiles = fs.readdirSync(this.config.cacheDir);
                        let limit = this.config.regexpLimit;
                        limit = (limit && limit > 0) ? limit : cacheFiles.length;
                        let i = 0;
                        for (let cacheFile of cacheFiles) {
                            const extName = path.extname(cacheFile);
                            const baseName = cacheFile.replace(extName, "");
                            const useRegExp = new RegExp(this.config.useRegExp);
                            const validName = useRegExp.test(baseName);
                            if (validName && extName == ".json") {
                                Logger.log("Want to use " + this.config.cacheDir + "/" + baseName + ".html");
                                if (fs.existsSync(this.config.cacheDir + "/" + baseName + ".html")) {
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
                    }
                    else if (this.config.use) {
                        Logger.log("Use Cached Page: ", this.config.use);
                        const cache = this.config.getCacheConfig(this.config.use);
                        const cachePage = this.config.getPageCache(this.config.use);
                        const document = cachePage.window.document;
                        let links = [];
                        if (this.config.anchor) {
                            const elements = document.querySelectorAll(this.config.anchor);
                            for (let i = 0; i < elements.length; i++) {
                                links.push(elements[i]);
                            }
                        }
                        else if (this.config.anchorXpath) {
                            let nodesSnapshot = document.evaluate(this.config.anchorXpath, document, null, wgxpath.XPathResultType.ORDERED_NODE_SNAPSHOT_TYPE, null);
                            for (let i = 0; i < nodesSnapshot.snapshotLength; i++) {
                                links.push(nodesSnapshot.snapshotItem(i));
                            }
                        }
                        if (links.length > 1) {
                            let limit = links.length;
                            if (this.config.anchorLimit) {
                                if (this.config.anchorLimit > 0 && this.config.anchorLimit > links.length) {
                                    limit = this.config.anchorLimit;
                                }
                            }
                            for (let i = 0; i < limit; i++) {
                                const anchor = links[i];
                                let new_config = this.config.createNewConfigWithURL(this.getURL(anchor, cache.load));
                                this.ev.emit('spawn', new Job(new_config));
                            }
                            this.config.writeCache();
                            resolve(this);
                        }
                        else if (links.length == 1) {
                            const url = this.getURL(links[0], cache.load);
                            this.config.resolveAnchor(url);
                            resolve(yield this.download(url));
                        }
                        else {
                            Logger.warn("Anchor Query resulting zero element, using: ", this.config.use, ", query: ", this.config.load);
                            resolve(this);
                        }
                    }
                    else {
                        resolve(yield this.download(this.config.load));
                    }
                }
                catch (error) {
                    reject(error);
                }
            }), this.config.delay);
        });
        this._started = true;
        this.ev.emit('start', this);
        promise.then(() => {
            this.success = true;
            this.ev.emit('success', this);
            this.ev.emit('finish', this);
            this._started = false;
        }).catch((error) => {
            Logger.error("", error);
            this.success = false;
            this.ev.emit('error', this, error);
            this.ev.emit('finish', this);
            this._started = false;
        });
    }
    download(url) {
        return __awaiter(this, void 0, void 0, function* () {
            Logger.log("Loading page ", url);
            return new Promise((resolve, reject) => {
                request({ uri: url }, (error, response, body) => __awaiter(this, void 0, void 0, function* () {
                    if (!response) {
                        reject(new Error("Empty Response"));
                    }
                    else if (error && response.statusCode !== 200) {
                        reject(error);
                    }
                    else {
                        try {
                            Logger.log("Load page done");
                            this.config.resolvePage(body);
                            this.config.parseQueries();
                            this.config.writeCache();
                            resolve(this);
                        }
                        catch (error) {
                            reject(error);
                        }
                    }
                }));
            });
        });
    }
    getURL(anchor, baseURL) {
        let url = "";
        if (this.testValidHref(anchor.href)) {
            url = anchor.href;
        }
        else {
            const bUrl = new url_1.URL(baseURL);
            url = bUrl.origin.replace(/\/?$/, '') + "/" + anchor.href.replace(/^\/?/, '');
        }
        return url;
    }
    testValidHref(href) {
        try {
            new url_1.URL(href).href;
            return true;
        }
        catch (e) {
            return false;
        }
    }
    getConfig() {
        return this.config.getConfig();
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
}
exports.Job = Job;
//# sourceMappingURL=job.js.map