import { JSDOM } from 'jsdom';
import request = require('request');
import { HyperLink } from './hyperlink';

export class Page {
    private body: string;
    private window: any;
    private dom: any;

    constructor(public url : string){
    }

    async Get() : Promise<Page> {
        return await this.fetch();
    }

    private async fetch() : Promise<Page> {
        return new Promise<Page>((resolve, reject) => {
            request({ uri: this.url }, async (error, response, body) => {  
                if (error && response.statusCode !== 200) {
                    reject(error);
                }
                this.body = body;
                resolve(await this.parseHTML(this.body));
            });
        });
    }

    private async parseHTML(text: string) : Promise<Page> {
        return new Promise<Page>((resolve, reject) => {
            this.dom = new JSDOM(text, { 
                includeNodeLocations: true }
            );
            this.window = this.dom.window;
            resolve(this);
        })
    }
    
    getLinks(query: string): Array<HyperLink> {
        const document = this.dom.window.document;
        const links = document.querySelectorAll(query);
        if (links.length > 0) {
            var hyperlink = [];
            for (let i = 0; i < links.length; i++) {
                hyperlink.push(new HyperLink(links[i], this.url));
            }
        }
        return hyperlink;
    }
}