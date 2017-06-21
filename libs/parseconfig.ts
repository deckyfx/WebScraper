export interface ParseConfig {
    query?: string,
    xpath?: string,
    property?: string | Array<String> | { [name: string]: string },
    attr?: string | Array<String> | { [name: string]: string },
    name?: string,
    index?: number,
    value?: any,
    group?: Array<ParseConfig>
}