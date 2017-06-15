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
const jsdom_1 = require("jsdom");
const request = require("request");
const hyperlink_1 = require("./hyperlink");
class Page {
    constructor(url) {
        this.url = url;
    }
    Get() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.fetch();
        });
    }
    fetch() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                request({ uri: this.url }, (error, response, body) => __awaiter(this, void 0, void 0, function* () {
                    if (error && response.statusCode !== 200) {
                        reject(error);
                    }
                    this.body = body;
                    resolve(yield this.parseHTML(this.body));
                }));
            });
        });
    }
    parseHTML(text) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.dom = new jsdom_1.JSDOM(text, {
                    includeNodeLocations: true
                });
                this.window = this.dom.window;
                resolve(this);
            });
        });
    }
    getLinks(query) {
        const document = this.dom.window.document;
        const links = document.querySelectorAll(query);
        if (links.length > 0) {
            var hyperlink = [];
            for (let i = 0; i < links.length; i++) {
                hyperlink.push(new hyperlink_1.HyperLink(links[i], this.url));
            }
        }
        return hyperlink;
    }
}
exports.Page = Page;
//# sourceMappingURL=page.js.map