import { inject, Service } from '@angular/core';
import { Api } from './api';
import { ADMIN_API, AdminMessageRequest, ApiResponse, ApplicationSetting, AuditFilterResponse, AuditLogParameter, CreateZoneRequest, IZone, MessageListResponse, SelectOptions, Tradition, TraditionRequest } from '../models';

@Service()
export class AdminService {
    // inject services here
    private readonly apiservice = inject(Api);

    getZone() {
        return this.apiservice.getAdmin<ApiResponse<IZone>>(ADMIN_API.ADDZONE);
    }

    approvedMessage(adminMessageRequest: AdminMessageRequest) {
        return this.apiservice.postAdmin<AdminMessageRequest, ApiResponse<MessageListResponse>>(ADMIN_API.MESSAGEAPPROVED, adminMessageRequest);
    }

    rejectedMessage(adminMessageRequest: AdminMessageRequest) {
        return this.apiservice.postAdmin<AdminMessageRequest, ApiResponse<MessageListResponse>>(ADMIN_API.MESSAGEREJECTED, adminMessageRequest);
    }

    getAuditLogs(filters?: AuditLogParameter) {
        const params: Record<string, string | number | boolean> = {};
        if (filters?.action) {
            params['action'] = filters.action;
        }
        if (filters?.performeby) {
            params['performedby'] = filters.performeby;
        }
        if (filters?.fromDate) {
            params['fromDate'] = filters.fromDate;
        }

        if (filters?.toDate) {
            params['toDate'] = filters.toDate;
        }
        if (filters?.page !== undefined && filters?.page !== null) {
            params['page'] = filters.page;
        }

        if (filters?.pageSize !== undefined && filters?.pageSize !== null) {
            params['pageSize'] = filters.pageSize;
        }
        return this.apiservice.getAdmin<ApiResponse<MessageListResponse>>(ADMIN_API.AUDITLOGS, params);
    }

    getMessageSelectOptions() {
        return this.apiservice.getAdmin<ApiResponse<SelectOptions>>(ADMIN_API.MESSAGESELECTOPTIONS);
    }



    getAuditFilters() {
        return this.apiservice.getAdmin<ApiResponse<AuditFilterResponse>>(ADMIN_API.AUDITFILTERSLOGS);
    }

    // Setting Zone
    addSettingZone(createZoneRequest: CreateZoneRequest) {
        return this.apiservice.postAdmin<CreateZoneRequest, ApiResponse<any>>(ADMIN_API.ADDZONE, createZoneRequest);
    }

    editSettingZone(zoneId: string, request: CreateZoneRequest) {
        return this.apiservice.putAdmin<CreateZoneRequest, ApiResponse<any>>(`${ADMIN_API.ADDZONE}/${zoneId}`, request);
    }

    deleteSettingZone(zoneId: string) {
        return this.apiservice.deleteAdmin<ApiResponse<any>>(`${ADMIN_API.ADDZONE}/${zoneId}`);
    }

    // Tradition
    getTraditions() {
        return this.apiservice.getAdmin<ApiResponse<Tradition>>(ADMIN_API.GETTRADITION);
    }

    addTradition(tradition: TraditionRequest) {
        return this.apiservice.postAdmin<TraditionRequest, ApiResponse<any>>(ADMIN_API.GETTRADITION, tradition);
    }

    updateTradition(traditionId: string, request: TraditionRequest) {
        return this.apiservice.putAdmin<TraditionRequest, ApiResponse<any>>(`${ADMIN_API.GETTRADITION}/${traditionId}`, request);
    }

    deleteTradition(traditionId: string) {
        return this.apiservice.deleteAdmin<ApiResponse<any>>(`${ADMIN_API.GETTRADITION}/${traditionId}`);
    }

    // setting

    getSetting() {
        return this.apiservice.getAdmin<ApiResponse<ApplicationSetting>>(ADMIN_API.SETTING);
    }

    addSetting(setting: ApplicationSetting) {
        return this.apiservice.postAdmin<ApplicationSetting, ApiResponse<any>>(ADMIN_API.SETTING, setting)
    }

    updateSetting(settingId: string, setting: ApplicationSetting) {
        return this.apiservice.putAdmin<ApplicationSetting, ApiResponse<any>>(`${ADMIN_API.SETTING}/${settingId}`, setting);
    }
}
