import { signal } from "@angular/core";
import { PUBLIC_WALL_CONFIG } from "./constants";

export class MessagePagination {
    page: number = PUBLIC_WALL_CONFIG.pageNumber;
    pageSize: number = PUBLIC_WALL_CONFIG.adminPageSize;
    backendpage: number = 1;
    backendPageSize = 100;
    pageNumber = signal<number>(1);
    totalRecords: number = 0;
    batchStartIndex: number = 0;
}


// export class AuditPagination {
//     page: number = PUBLIC_WALL_CONFIG.pageNumber;
//     pageSize: number = PUBLIC_WALL_CONFIG.pageSize;
//     backendpage: number = 1;
//     backendPageSize = 100;
//     pageNumber = signal<number>(1);
//     totalRecords: number = 0;
//     loadedRecords: number = 0;
//     batchStartIndex: number = 0;
// }