"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const page_1 = require("./page");
class HyperLink {
    constructor(el, referer) {
        this.el = el;
        this.referer = referer;
        if (this.hasValidHref()) {
            this.url = this.el.href;
        }
        else {
            this.url = this.referer.replace(/\/?$/, '') + "/" + this.el.href.replace(/^\/?/, '');
        }
    }
    hasValidHref() {
        try {
            new url_1.URL(this.el.href).href;
            return true;
        }
        catch (e) {
            return false;
        }
    }
    getPage() {
        return new page_1.Page(this.el.href);
    }
}
exports.HyperLink = HyperLink;
//# sourceMappingURL=hyperlink.js.map