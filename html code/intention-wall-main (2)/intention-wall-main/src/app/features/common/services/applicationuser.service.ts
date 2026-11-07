import { inject, Service } from '@angular/core';
import { Api } from './api';
import { ApiResponse, APPLICATION_USER_API, ApplicationSetting, Country, CreatePostRequest, GetAllMessagesParams, MessageListResponse, MessageQueryParams, SelectOptions, SendEmailOtpRequest, Tradition, VerifyOtpRequest, Zone, ZoneOptions } from '../models';
import { HttpParams } from '@angular/common/http';


@Service()
export class ApplicationuserService {
    // inject services here
    private readonly apiservice = inject(Api);

    getAllMessage(filters?: MessageQueryParams) {
        const params: Record<string, string | number | boolean> = {};

        if (filters?.messageId) {
            params['messageId'] = filters.messageId;
        }

        if (filters?.countryId) {
            params['countryId'] = filters.countryId;
        }

        if (filters?.zoneId) {
            params['zoneId'] = filters.zoneId;
        }

        if (filters?.traditionId) {
            params['traditionId'] = filters.traditionId;
        }

        if (filters?.email) {
            params['email'] = filters.email;
        }

        if (
            filters?.status !== undefined &&
            filters?.status !== null &&
            filters?.status !== ''
        ) {
            params['status'] = filters.status;
        }

        if (
            filters?.moderationStatus !== undefined &&
            filters?.moderationStatus !== null &&
            filters?.moderationStatus !== ''
        ) {
            params['moderationStatus'] = filters.moderationStatus;
        }

        if (filters?.fromDate) {
            params['fromDate'] = filters.fromDate;
        }

        if (filters?.toDate) {
            params['toDate'] = filters.toDate;
        }

        if (
            filters?.page !== undefined &&
            filters?.page !== null
        ) {
            params['page'] = filters.page;
        }

        if (
            filters?.pageSize !== undefined &&
            filters?.pageSize !== null
        ) {
            params['pageSize'] = filters.pageSize;
        }

        return this.apiservice.getAdmin<ApiResponse<MessageListResponse>>(
            APPLICATION_USER_API.MESSAGES,
            params
        );
    }


    getCountry() {
        return this.apiservice.getAdmin<ApiResponse<Country[]>>(APPLICATION_USER_API.COUNTRY);
    }

    getZones() {
        return this.apiservice.getAdmin<ApiResponse<ZoneOptions[]>>(APPLICATION_USER_API.ZONES);
    }

    getFiltersPublic() {
        return this.apiservice.getMessageFetch<ApiResponse<SelectOptions>>(APPLICATION_USER_API.MESSAGEFILTER);
    }

    getTraditions() {
        return this.apiservice.getAdmin<ApiResponse<Tradition[]>>(APPLICATION_USER_API.TRADITIONS);
    }

    getAllApprovedMessages(getAllMessageParams: GetAllMessagesParams) {
        const params: Record<string, string | number | boolean> = {
            page: getAllMessageParams.page,
            pageSize: getAllMessageParams.pageSize
        };

        if (getAllMessageParams.zoneId) {
            params['zoneId'] = getAllMessageParams.zoneId;
        }
        return this.apiservice.getMessageFetch<ApiResponse<MessageListResponse>>(APPLICATION_USER_API.GETALLMESSAGES, params);
    }

    getAllApprovedMessagesCount() {
        return this.apiservice.getMessageFetch<ApiResponse<any>>(APPLICATION_USER_API.GETALLMESSAGESCOUNT);
    }

    approvedMessage(createPost: CreatePostRequest) {
        return this.apiservice.postMessage<CreatePostRequest, ApiResponse<any>>(APPLICATION_USER_API.APPROVED_MESSAGE, createPost);
    }

    showSettingBykeys(settingkeys: any) {
        return this.apiservice.postAdmin<any, ApiResponse<ApplicationSetting[]>>(APPLICATION_USER_API.SETTINGKEYS, settingkeys);
    }

    sendOtp(sendEmailOtpRequest: SendEmailOtpRequest) {
        return this.apiservice.postMessage<SendEmailOtpRequest, ApiResponse<any>>(APPLICATION_USER_API.SEND_OTP, sendEmailOtpRequest);
    }

    verifyOtp(verifyOtpRequest: VerifyOtpRequest) {
        return this.apiservice.postMessage<VerifyOtpRequest, ApiResponse<any>>(APPLICATION_USER_API.VERIFY_OTP, verifyOtpRequest);
    }

}
