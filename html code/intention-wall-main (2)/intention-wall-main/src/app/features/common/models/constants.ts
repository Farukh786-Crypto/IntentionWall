export enum ToastType {
    Success = 'Success',
    Error = 'Error',
    Warning = 'Warning',
    Info = 'Information'
}

export const digitValidator = 6;
export const EditBackendPageSize = 1000;
export const ColumnCount = 3;
export const TotalSlides = 3;
export const StringEmpty = '';

export const ADMIN_API_PREFIX = '/api/v1/admin';
export const ADMIN_API_EXCLUDED_PATHS = ['/api/v1/admin/zones'];

export const TOKENSTORAGEKEY = 'intention-wall.admin.jwt';
export const REFRESHTOKENSTORAGEKEY = 'intention-wall.admin.refresh-token';
export const TOKENPAYLOADEMAIL = 'intention-wall.admin.email.jwt';
export const APPLICATIONSETTING = 'applicationSettings';

// keys
export const countriesStoragekey = 'countriesList';
export const zonesStoragekey = 'zonesList';
export const traditionStoragekey = 'traditionList';

export const PUBLIC_WALL_CONFIG = {
    poolingIntervalMinutes: 10,
    pollingMessageCountIntervalInMinutes: 5,
    cardMoveDurationSeconds: 5,
    adminPageSize: 20,
    publicPageSize: 50,
    pageNumber: 1,
    backendpageSize: 100,
    wallColumn1_InSeconds: '180s',
    wallColumn2_InSeconds: '200s',
    wallColumn3_InSeconds: '160s'
}

export const STATUS = {
    Pending: 'Pending',
    Approved: 'Approved',
    Rejected: 'Rejected'
}

export const settingkeyName = {
    pollingIntervalMinutes: 'pollingIntervalMinutes',
    publicPageSize: 'publicPageSize',
    wallColumn1InSeconds: 'wallColumn1InSeconds',
    wallColumn2InSeconds: 'wallColumn2InSeconds',
    wallColumn3InSeconds: 'wallColumn3InSeconds',
    WallCountInMinutes: 'WallCountInMinutes'
}

export const SettingKeys = [
    'pollingIntervalMinutes',
    'publicPageSize',
    'wallColumn1InSeconds',
    'wallColumn2InSeconds',
    'wallColumn3InSeconds',
    'WallCountInMinutes'
]

export const ZONEMANAGE = 'Zone Management';
export const TRADITIONMANAGE = 'Tradition Management';
export const CONFIGURATIONMANAGE = 'Application Settings';

export const SELECTMANAGEMENT = ZONEMANAGE;

export const MANAGEMENTS = [
    'Zone Management',
    'Tradition Management',
    'Application Settings'
]

export const Manage = {
    zoneManage: ZONEMANAGE,
    traditionManage: TRADITIONMANAGE,
    configurationManage: CONFIGURATIONMANAGE
} as const;


export interface ConfigurationSetting {
    key: string;
    value: string;
}

// Routing
export const APPLICATION_USER_API = {
    COUNTRY: 'v1/admin/country',
    ZONES: 'v1/admin/zones',
    TRADITIONS: 'v1/admin/Traditions',
    APPROVED_MESSAGE: 'v1/messages',
    GETALLMESSAGES: 'v1/getallapprovedmessages',
    GETALLMESSAGESCOUNT: 'v1/Getallapprovedmessagecount',
    SEND_OTP: 'v1/email/send-otp',
    VERIFY_OTP: 'v1/email/verify-otp',
    LOGIN: 'v1/auth/login',
    MESSAGES: 'v1/admin/getallmessages',
    MESSAGEFILTER: 'v1/Getallfiltersforpublic',
    REFRESH_TOKEN: 'v1/auth/refresh',
    SETTINGKEYS: 'v1/settingbykey'
} as const;

export const ADMIN_API = {
    MESSAGESELECTOPTIONS: 'v1/admin/GetMessageFilters',
    MESSAGEAPPROVED: 'v1/admin/messages/approve',
    MESSAGEREJECTED: 'v1/admin/messages/reject',
    AUDITLOGS: 'v1/admin/audit/GetAuditLogs',
    AUDITFILTERSLOGS: 'v1/admin/audit-filters',
    ADDZONE: 'v1/admin/zones',
    GETTRADITION: 'v1/admin/traditions',
    SETTING: 'v1/admin/settings'
} as const;
