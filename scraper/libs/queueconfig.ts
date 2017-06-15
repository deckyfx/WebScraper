import { JobConfig } from "./jobconfig";

export interface QueueConfig {
    name: any;
    tasks: Array<JobConfig>
}