"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const admin = require("firebase-admin");
const _ = require("lodash");
const crypto = require("crypto");
const fs = require("fs");
const Logger = require("./logger");
const serviceAccount = require("../../wynn-wynn-firebase-adminsdk-wseld-c1547f99c4.json");
class FireBaseIntegrator {
    constructor(data) {
        this.data = data;
        let categories;
        var alldata = {
            categories: {},
            subcategories: {},
            category_subcategory: {},
            subcategory_item: {},
            items: {}
        };
        _.forOwn(this.data, (jobResult, jobName) => {
            switch (jobResult.type) {
                case "category":
                    {
                        let data = {};
                        data.images = {};
                        if (jobResult.images) {
                            if (jobResult.images instanceof Array) {
                                jobResult.images.forEach((url, index) => {
                                    data.images[`url-${index}`] = url;
                                });
                            }
                            else {
                                data.images[`url-0`] = jobResult.images;
                            }
                        }
                        if (jobResult.title) {
                            data.name = jobResult.title;
                        }
                        else if (jobResult.name) {
                            data.name = jobResult.name;
                        }
                        else {
                            data.name = crypto.randomBytes(16).toString("hex");
                        }
                        data.key = data.name.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                        if (jobResult.description) {
                            data.description = jobResult.description.replace(/img\{.*\}/g, "");
                            data.description = data.description.replace(/\\n/g, "\n");
                            data.description = data.description.trim();
                        }
                        else {
                            data.description = "";
                        }
                        data.timestamp = admin.database.ServerValue.TIMESTAMP;
                        alldata.categories[data.key] = data;
                    }
                    break;
                case "subcategory":
                    {
                        let data = {};
                        data.images = {};
                        if (jobResult.images) {
                            if (jobResult.images instanceof Array) {
                                jobResult.images.forEach((url, index) => {
                                    data.images[`url-${index}`] = url;
                                });
                            }
                            else {
                                data.images[`url-0`] = jobResult.images;
                            }
                        }
                        if (jobResult.title) {
                            data.name = jobResult.title;
                        }
                        else if (jobResult.name) {
                            data.name = jobResult.name;
                        }
                        else {
                            data.name = crypto.randomBytes(16).toString("hex");
                        }
                        data.key = data.name.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                        if (jobResult.description) {
                            data.description = jobResult.description.replace(/img\{.*\}/g, "");
                            data.description = data.description.replace(/\\n/g, "\n");
                            data.description = data.description.trim();
                        }
                        else {
                            data.description = "";
                        }
                        if (jobResult.category) {
                            data.category = jobResult.category.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                        }
                        else {
                            data.category = "no-category";
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
                    }
                    break;
                case "item":
                    {
                        let data = {};
                        data.images = {};
                        if (jobResult.images) {
                            if (jobResult.images instanceof Array) {
                                jobResult.images.forEach((url, index) => {
                                    data.images[`url-${index}`] = url;
                                });
                            }
                            else {
                                data.images[`url-0`] = jobResult.images;
                            }
                        }
                        if (jobResult.title) {
                            data.name = jobResult.title;
                        }
                        else if (jobResult.name) {
                            data.name = jobResult.name;
                        }
                        else {
                            data.name = crypto.randomBytes(16).toString("hex");
                        }
                        data.key = data.name.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                        if (jobResult.description) {
                            data.description = jobResult.description.replace(/img\{.*\}/g, "");
                            data.description = data.description.replace(/\\n/g, "\n");
                            data.description = data.description.trim();
                        }
                        else {
                            data.description = "";
                        }
                        if (jobResult.logo) {
                            data.logo = jobResult.logo;
                        }
                        else {
                            data.logo = "";
                        }
                        if (jobResult.openTableLink) {
                            let url = "";
                            if (jobResult.openTableLink instanceof Array) {
                                url = jobResult.openTableLink[0];
                            }
                            else {
                                url = jobResult.openTableLink;
                            }
                            data.openTable = url;
                        }
                        else {
                            data.openTable = "";
                        }
                        if (jobResult.timeTable) {
                            data.timeTable = jobResult.timeTable.replace(/\\n/g, "\n");
                            data.timeTable = data.timeTable.trim();
                        }
                        else if (jobResult.timeTableAlt) {
                            data.timeTable = jobResult.timeTableAlt.replace(/\\n/g, "\n");
                            data.timeTable = data.timeTable.trim();
                        }
                        else {
                            data.timeTable = "";
                        }
                        if (jobResult.category) {
                            data.category = jobResult.category.trim().replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
                        }
                        else {
                            data.category = "no-category";
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
                        }
                        else {
                            data.subcategory = `${data.category}-default`;
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
                    }
                    break;
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
                var db = admin.database();
                var ref = db.ref(`${folderKey}/${itemKey}`).set(data);
                promises.push(ref);
            }
        }
        Promise.all(promises).then((r) => {
            Logger.log("Firebase Success", `${r.length} Tasks inserted`);
        }).catch((e) => {
            Logger.error("Firebase Error", e);
        });
    }
}
exports.FireBaseIntegrator = FireBaseIntegrator;
//# sourceMappingURL=firebase.js.map