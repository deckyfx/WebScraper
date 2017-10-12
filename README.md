WebScraper
===========

# Introduction
Scraping Webpage and get its contents

# Instalation
```
git clone https://github.com/deckyfx/WebScraper.git

cd WebScraper

npm install -d

npm build
```

# Usage
Get this page title
```
./bin/scrap --url https://github.com/deckyfx/WebScraper --xpath '//*[@id="js-repo-pjax-container"]/div[2]/div[1]/div[1]/div[1]/div/span' --property textContent
```

Run with specific config.json
```
./bin/scrap --config {path to your config file}
```

For more usages
```
./bin/scrap --help
```

# Configuration File
Cofiguration file are text file with JSON format with the following structure
```
{
    "name": string,                 // Name of your project, required, all files wil be saved in scraper/cache/{projectname}/
    "tasks": [{
        "name": string | number,    // Name of a Task, optional, the name of the task that will be use as base name
        "load": string,             // URL to load, optional
        "delay": number,            // Optional, delay {delay} milisecond before executing this task
        "use": string               // Optional, use previous task data by name to load the anchor url, you have to set previous task name
        "useRegExp": string,        // Optional, using previous task data by its name that match of regex
        "anchor": string,           // Optional, get anchor href using querySelector from used task
        "anchorXpath": string,      // Optional, get anchor href using xpath from used task
        "anchorLimit": number,      // Optional, when anchor querySelector result is multiple, limit it by {anchorLimit}
        "regexpLimit": number,      // Optional, useRegExp result multiple previous tasks, limit it by {useRegExpLimit}
        "queries": [{               
            "query": string,        // Optional, get elements using querySelector
            "xpath": string,        // Optional, get elements using xpath
            "property": string | Array<string> | { [name:string]: string },
                                    // Optional, get property of acquired elements
            "attr": string | Array<string> | { [name:string]: string },
                                    // Optional, get attribute value of acquired elements
            "name": string          // Optional, name of this query task result
            "index": number         // Optional, if queries result returning array, get the {index}th item
            "value": any            // Optional, when this config present, the result will give this value instead of element property,
            "group": Array<ParseConfig>
                                    // Optional, process queries and group it all in one result
        }
        ...
        ]
    }
    ...
    ]
}
```

## Special Parser Config
there are some special value for queries task, that when mentioned, the program will perform special actions instead of regular command

### Text Nodes property
```
    property: "textNodes"
```
when textNodes is asked, then the queries will get all non empty textNode in direct child of resolved elements 


please see ```sample/tasks.json``` for sample 

# Result
The process will generate result file ```scraper/cache/{project name}/result.json```
with the following format

```
{
    {Task Name}: {
        {Query Task Name}: {Query Task Result},
        ...
    },
    ...
}
```

please see ```sample/result.json``` for sample 

# Change Log
 - resolve elements using xpath
 - get attributes of resolved elements
 - obtain textNode
 - group another query tasks as one single result
 - get multiple properties / attributes from resolved elements

# ToDo
 - Implement Exclude Rule
 -- Exclude Use
 -- Exclude Anchor

 - Implement Extendable Caching strategy
 -- Base abstract class of Cache
 -- Memory Cache
 -- File Cache
 -- Redis Cache
 -- MySQLCache
 -- etc
