"use strict";

import * as admin from "firebase-admin";
import * as _ from "lodash";
import crypto = require("crypto");
import fs = require('fs');

import Logger = require('./logger');

const serviceAccount = require("../../wynn-wynn-firebase-adminsdk-wseld-c1547f99c4.json");

export class FireBaseIntegrator {
    constructor(private data: any){
        
    }

    async saveToFirebase(): Promise<any> {
        let categories: Array<any>;

        var alldata: FBData = {
            categories: {},
            subcategories: {},
            category_subcategory: {},
            subcategory_item: {},
            items: {}
        }
        _.forOwn(this.data, (jobResult, jobName) => { 
            switch (jobResult.type) {
                case "category": {
                    let data: DataCategory = {};
                    data.images = {};
                    if (jobResult.images) {
                        if ( jobResult.images instanceof Array) {
                            jobResult.images.forEach((url, index) => {
                                data.images[`url-${index}`] = url;
                            })
                        } else {
                            data.images[`url-0`] = jobResult.images;
                        }
                    }
                    if (jobResult.title) {
                        data.name = jobResult.title;
                    } else if (jobResult.name) {
                        data.name = jobResult.name;
                    } else {
                        data.name = crypto.randomBytes(16).toString("hex");
                    }
                    data.key = data.name.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                    if (jobResult.description) {
                        data.description = jobResult.description.replace(/img\{.*\}/g, "");
                        data.description = data.description.replace(/\\n/g, "\n");
                        data.description = data.description.trim();
                    } else {
                        data.description = "";
                    }
                    data.timestamp = admin.database.ServerValue.TIMESTAMP;

                    alldata.categories[data.key] = data;
                } break;
                case "subcategory": {
                    let data: DataSubCategory = {};
                    data.images = {};
                    if (jobResult.images) {
                        if ( jobResult.images instanceof Array) {
                            jobResult.images.forEach((url, index) => {
                                data.images[`url-${index}`] = url;
                            })
                        } else {
                            data.images[`url-0`] = jobResult.images;
                        }
                    }
                    if (jobResult.title) {
                        data.name = jobResult.title;
                    } else if (jobResult.name) {
                        data.name = jobResult.name;
                    } else {
                        data.name = crypto.randomBytes(16).toString("hex");
                    }
                    data.key = data.name.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                    if (jobResult.description) {
                        data.description = jobResult.description.replace(/img\{.*\}/g, "");
                        data.description = data.description.replace(/\\n/g, "\n");
                        data.description = data.description.trim();
                    } else {
                        data.description = "";
                    }
                    if (jobResult.category) {
                        data.category = jobResult.category.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                    } else {
                        data.category = "no-category"
                    }
                    if (!alldata.categories[data.category]) {
                        alldata.categories[data.category] = {
                            name: data.category,
                            key: data.category,
                            timestamp: admin.database.ServerValue.TIMESTAMP
                        };
                    }
                    if (!alldata.category_subcategory[data.category]) {
                        alldata.category_subcategory[data.category] = {};
                    }
                    alldata.category_subcategory[data.category][data.key] = true;

                    data.timestamp = admin.database.ServerValue.TIMESTAMP;

                    alldata.subcategories[data.key] = data;
                } break;
                case "item": {
                    let data: DataItem = {};
                    data.images = {};
                    if (jobResult.images) {
                        if ( jobResult.images instanceof Array) {
                            jobResult.images.forEach((url, index) => {
                                data.images[`url-${index}`] = url;
                            })
                        } else {
                            data.images[`url-0`] = jobResult.images;
                        }
                    }
                    if (jobResult.title) {
                        data.name = jobResult.title;
                    } else if (jobResult.name) {
                        data.name = jobResult.name;
                    } else {
                        data.name = crypto.randomBytes(16).toString("hex");
                    }
                    data.key = data.name.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                    if (jobResult.description) {
                        data.description = jobResult.description.replace(/img\{.*\}/g, "");
                        data.description = data.description.replace(/\\n/g, "\n");
                        data.description = data.description.trim();
                    } else {
                        data.description = "";
                    }
                    if (jobResult.logo) {
                        data.logo = jobResult.logo;
                    } else {
                        data.logo = "";
                    }
                    if (jobResult.openTableLink) {
                        let url = "";
                        if (jobResult.openTableLink instanceof Array) {
                            url = jobResult.openTableLink[0]
                        } else {
                            url = jobResult.openTableLink;
                        }
                        data.openTable = url;
                    } else {
                        data.openTable = "";
                    }
                    if (jobResult.timeTable) {
                        data.timeTable =  jobResult.timeTable.replace(/\\n/g, "\n");
                        data.timeTable = data.timeTable.trim();
                    } else if (jobResult.timeTableAlt) {
                        data.timeTable =  jobResult.timeTableAlt.replace(/\\n/g, "\n");
                        data.timeTable = data.timeTable.trim();
                    } else {
                        data.timeTable = "";
                    }
                    if (jobResult.category) {
                        data.category = jobResult.category.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                    } else {
                        data.category = "no-category"
                    }
                    if (!alldata.categories[data.category]) {
                        alldata.categories[data.category] = {
                            name: data.category,
                            key: data.category,
                            timestamp: admin.database.ServerValue.TIMESTAMP
                        };
                    }
                    if (jobResult.subcategory) {
                        data.subcategory = jobResult.subcategory.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                    } else {
                        data.subcategory = `${data.category}-default`
                    }
                    if (!alldata.subcategories[data.subcategory]) {
                        alldata.subcategories[data.subcategory] = {
                            name: data.subcategory,
                            key: data.subcategory,
                            category: data.category,
                            timestamp: admin.database.ServerValue.TIMESTAMP
                        };
                    }
                    if (!alldata.category_subcategory[data.category]) {
                        alldata.category_subcategory[data.category] = {};
                    }
                    alldata.category_subcategory[data.category][data.subcategory] = true;

                    if (!alldata.subcategory_item[data.subcategory]) {
                        alldata.subcategory_item[data.subcategory] = {};
                    }
                    alldata.subcategory_item[data.subcategory][data.key] = true;

                    data.timestamp = admin.database.ServerValue.TIMESTAMP;

                    alldata.items[data.key] = data;
                } break;
            }
        });
        fs.writeFileSync("firebase.json", JSON.stringify(alldata, null, 4), { flag: "w+" });
        
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: "https://wynn-wynn.firebaseio.com"
        });

        const promises = [];

        for (let folderKey in alldata) {
            const folder = alldata[folderKey];
            for (let itemKey in folder) {
                const data = folder[itemKey];                
                delete data.key;
                // As an admin, the app has access to read and write all data, regardless of Security Rules
                var db = admin.database();
                var ref = db.ref(`${folderKey}/${itemKey}`).set(data);
                promises.push(ref);
            }
        }
        return Promise.all(promises);
    }
}

interface FBData {
    categories?: { [key: string]: DataCategory };
    subcategories?: { [key: string]: DataSubCategory };
    category_subcategory?: { [key: string]: DataCategorySubCategory };
    subcategory_item?: { [key: string]: DataSubCategoryItem };
    items?: { [key: string]: DataItem };
}

interface DataCategory {
    key?: string;
    name?: string;
    images?: { [key: string]: string };
    description?: string;
    timestamp?: any;
}

interface DataSubCategory {
    key?: string;
    name?: string;
    images?: { [key: string]: string };
    description?: string;
    category?: string;
    timestamp?: any;
}

interface DataItem {
    key?: string;
    images?: { [key: string]: string };
    name?: string;
    description?: string;
    logo?: string;
    openTable?: string;
    timeTable?: string;
    category?: string;
    subcategory?: string;
    timestamp?: any;
}

interface DataCategorySubCategory {
    [key: string]: boolean
}

interface DataSubCategoryItem {
    [key: string]: boolean
}