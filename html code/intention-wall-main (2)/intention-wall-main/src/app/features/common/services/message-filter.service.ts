import { Service } from '@angular/core';
import { MessageQueryParams, PUBLIC_WALL_CONFIG, STATUS } from '../models';

@Service()
export class MessageFilterService {
    selectZoneId?: string;
    selectTraditionId?: string;
    selectCountryId?: string;

    selectedFromDate: Date | undefined = undefined;
    selectedToDate: Date | undefined = undefined;

    selectedStatus?: string = undefined;
    selectedModerationStatus?: string;
    page: number = PUBLIC_WALL_CONFIG.pageNumber;
    pageSize: number = PUBLIC_WALL_CONFIG.backendpageSize;

    buildQueryParams(): MessageQueryParams {
        return {
            zoneId: this.selectZoneId,
            traditionId: this.selectTraditionId,
            countryId: this.selectCountryId,

            status: this.selectedStatus,
            moderationStatus: this.selectedModerationStatus,

            fromDate: this.selectedFromDate
                ? this.selectedFromDate.toISOString()
                : undefined,

            toDate: this.selectedToDate
                ? this.selectedToDate.toISOString()
                : undefined,

            page: this.page,
            pageSize: this.pageSize,
        }
    }

    clearFilters(): void {
        this.selectZoneId = undefined;
        this.selectTraditionId = undefined;
        this.selectCountryId = undefined;
        this.selectedFromDate = undefined;
        this.selectedToDate = undefined;
        this.selectedStatus = STATUS.Rejected;
        this.selectedModerationStatus = undefined;
        this.page = PUBLIC_WALL_CONFIG.pageNumber;
        this.pageSize = PUBLIC_WALL_CONFIG.adminPageSize;
    }
}
