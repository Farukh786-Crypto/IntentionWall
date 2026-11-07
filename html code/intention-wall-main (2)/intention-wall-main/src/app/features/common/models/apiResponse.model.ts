export interface ApiResponse<T> {
    StatusCode: number;
    Success: boolean;
    Message: string;
    Data: T | null;
}

export interface MessageListResponse {
    TotalCount: number;
    Messages: Message[];
    Records: Records[];
}
export interface Records {
    Id: string;
    EntityAction: string;
    EntityId: string;
    PerformedBy: string;
    PerformedById: string;
    Data: string;
    PerformedAt: string;
}

export interface AdminLoginRequest {
    Email: string;
    Password: string;
}

export interface AuditFilterResponse {
    actions: [],
    performedBy: []
}

export interface ZoneOptions {
    Id: string,
    Name: string
}

export interface CountryOptions {
    Id: string,
    Name: string,
    CountryCode?: string,
    CountryCode2: string,
}

export interface CreateZoneRequest {
    name: string;
    description: string;
    isActive: boolean;
    countries: {
        countryId: string;
    }[];
    zoneTradition: string;
}

export interface TraditionsOptions {
    Id: string,
    Name: string
}

export interface SelectOptions {
    zones: ZoneOptions[],
    countries: CountryOptions[],
    traditions: TraditionsOptions[]
}

export interface DropdownOption {
    label: string;
    value: string;
}

export interface AdminLoginResponse {
    token?: string;
    accessToken?: string;
    jwtToken?: string;
    refreshToken?: string;
    // Accept PascalCase while the API is being migrated to camelCase.
    Token?: string;
    AccessToken?: string;
    JwtToken?: string;
    RefreshToken?: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

/** Response returned by POST v1/auth/refresh. */
export interface RefreshTokenResponse {
    success: boolean;
    data: AdminLoginResponse | null;
}

export interface SendEmailOtpRequest {
    email: string;
}


export interface AdminMessageRequest {
    messageId: string;
    reviewComment: string;
}

export interface VerifyOtpRequest {
    email: string;
    otp: string;
}


export interface GetAllMessagesParams {
    zoneId?: string;
    page: number;
    pageSize: number
}

export interface CreatePostRequest {
    firstName: string;
    lastName: string;
    email: string;
    countryId: string;
    zoneId: string;
    traditionId: string;
    content: string;
}

export interface IZone {
    ZoneId: string;
    ZoneName: string;
    Description: string;
    IsActive: boolean;
    ZoneCountryList: ZoneCountryList[];
    ZoneTradition: string;

}

export interface ZoneCountryList {
    CountryId: string;
    CountryName: string;
    CountryCode: string;
    CountryCode2: string;
    IsActive: boolean;
}

export interface Country {
    Id: string;
    CountryName: string;
    CountryCode2: string;
    CountryCode3: string;
    Latitude: number;
    Longitude: number;
    IsActive: boolean;
    CreatedAt: string;
    UpdatedAt: string;
}

export interface Zone {
    ZoneId: string;
    ZoneName: string;
    Description: string;
    IsActive: boolean;
    CreatedAt: string;
    ZoneCountryList: ZoneCountryList[]
}


export interface ZoneCountryList {
    CountryId: string;
    CountryName: string;
    CountryCode2: string;
    Latitude: number;
    Longitude: number;
    IsActive: boolean;
}


export interface Message {
    Id: string
    ZoneName: string
    Content: string
    FirstName: string
    LastName: any
    CountryName: string
    TradtionName: string
    Email: string
    Status: number
    ModerationStatus: number
    ModerationAttemptCount: number
    ReviewedBy: any
    ReviewComments: any
    ReviewedAt: string
    SubmittedAt: string
    LastModeratedAt: string
    PublishedAt: any
    UpdatedAt: any
    IsSafe: any
    ModerationModel: string
    Post_Anonymously: number
}

// CHANGED: Query parameters for Get All Messages API
export interface MessageQueryParams {
    messageId?: string;
    countryId?: string;
    zoneId?: string;
    traditionId?: string;
    email?: string;
    status?: string;
    moderationStatus?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    pageSize?: number;
}

export interface AuditLogParameter {
    action?: string,
    performeby?: string,
    fromDate?: string,
    toDate?: string,
    page?: number,
    pageSize?: number
}

export interface Tradition {
    Id: string;
    TraditionName: string;
    Description: string;
    IsActive: boolean;
    CreatedAt: string;
}

export interface ApplicationSetting {
    Id?: string;
    Key: string;
    Value: string;
    CreatedAt?: string | null;
    UpdatedAt?: string | null;
}

export interface settingkey {
    settingkeys: string;
}

export interface TraditionRequest {
    name: string;
    description: string;
    isActive: boolean;
}

// map models

export interface WallMap {
    name: string;
    label: string;
    city?: string;
    countries: string[];
    labelLat: number;
    labelLng: number;
    highlightColor: string;
    traditions: TraditionMap[];
    description: string;
}

export interface ZoneApiMapResponse {
    ZoneId: string;
    ZoneName: string;
    Description: string;
    IsActive: boolean;
    ZoneCountryList: ZoneCountryApiResponse[];
    ZoneTradition: string;
}

export interface ZoneCountryApiResponse {
    CountryId: string;
    CountryName: string;
    CountryCode2: string;
    Latitude: number;
    Longitude: number;
    IsActive: boolean;
}

export interface TraditionMap {
    id: string;
    label: string;
}
