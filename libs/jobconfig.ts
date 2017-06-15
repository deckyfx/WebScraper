import { ParseConfig } from "./parseconfig";

export interface JobConfig {
    id?: string | number;
    name?: string | number;
    load?: string;
    anchor?: string;
    anchorXpath?: string;
    use?: string | number;        // cannot be used with "useRegExp"
    useRegExp?: string;           // cannot be used with "use"
    queries?: Array<ParseConfig>;
    anchorLimit?: number;
    regexpLimit?: number;
    delay?: number;

    projectName?: string;
    cacheDir?: string;
    pageResolved?: boolean;
    parrent?: string | number;
}