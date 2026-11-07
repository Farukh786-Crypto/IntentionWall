import { AuditLogParameter } from "./apiResponse.model";
import { PUBLIC_WALL_CONFIG } from "./constants";

export class AuditLogParams {
    action?: string;
    performedby?: string;
    fromDate: Date | undefined = undefined;
    toDate: Date | undefined = undefined;
    page: number = PUBLIC_WALL_CONFIG.pageNumber;
    pageSize: number = PUBLIC_WALL_CONFIG.backendpageSize;

    buildAuditQueryParams(): AuditLogParameter {
        return {
            action: this.action,
            performeby: this.performedby,
            fromDate: this.fromDate ? this.fromDate.toISOString() : undefined,
            toDate: this.toDate ? this.toDate.toISOString() : undefined,
            page: this.page,
            pageSize: this.pageSize,
        }

    }

    clearFilters(): void {
        this.action = undefined;
        this.performedby = undefined;
        this.fromDate = undefined;
        this.toDate = undefined;
        this.page = PUBLIC_WALL_CONFIG.pageNumber;
        this.pageSize = PUBLIC_WALL_CONFIG.backendpageSize;
    }
}