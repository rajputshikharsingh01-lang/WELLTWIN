export type Well=Record<string,unknown>&{id?:string;well_id?:string;status?:string;health?:string};
export type Metric={name:string;value:string|number;unit?:string;status?:string};
