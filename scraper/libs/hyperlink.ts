import { URL } from 'url';
import { Page } from './page';
   
export class HyperLink {
    public url: string;
    constructor(public el : HTMLAnchorElement, public referer: string){
        if (this.hasValidHref()) {
            this.url = this.el.href
        } else { 
            this.url = this.referer.replace(/\/?$/, '') + "/" + this.el.href.replace(/^\/?/, '');
        }
    }
    private hasValidHref(): boolean {
        try {
            new URL(this.el.href).href;
            return true;
        } catch (e) {
            return false;
        } 
    }
    getPage(): Page {
        return new Page(this.el.href);
    }
}