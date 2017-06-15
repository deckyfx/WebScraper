WebScraper
===========

# Introduction
Scraping Webpage and get its contents

# Usage
```
git clone https://github.com/deckyfx/WebScraper.git

cd WebScraper

npm install -d

tsc build

./bin/scrap --url https://github.com/deckyfx/WebScraper --xpath '//*[@id="js-repo-pjax-container"]/div[2]/div[1]/div[1]/div[1]/div/span' --property textContent

./bin/scrap --config {path to your config file}
```

# Configuration File
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
            "property": "string",   // Optional, get property of acquired elements
            "name": "string"        // Optional, name of this query task result
            "value": any            // Optional, when this config present, the result will give this value instead of element property
        }
        ...
        ]
    }
    ...
    ]
}
```

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