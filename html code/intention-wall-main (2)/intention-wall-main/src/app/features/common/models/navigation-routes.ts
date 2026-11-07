import { publish } from "rxjs";

export const rootNavigationRoutes = Object.freeze({
    intentionwall: 'intentionwall',
    header: 'header',
    adminLogin: 'admin/login',
    adminHome: 'admin/home',
    intentionReview: 'intention-review',
    publishMessage: 'published-message',
    auditLogs: 'audit-logs',
    settings: 'settings'

});

export const navigationRoutes = Object.freeze({
    intentionwall: `/${rootNavigationRoutes.intentionwall}`,
    header: `/${rootNavigationRoutes.header}`,
    login: `/${rootNavigationRoutes.adminLogin}`,
    home: `/${rootNavigationRoutes.adminHome}`,
    review: `/${rootNavigationRoutes.intentionReview}`,
    message: `/${rootNavigationRoutes.publishMessage}`,
    audit: `/${rootNavigationRoutes.auditLogs}`,
    setting: `/${rootNavigationRoutes.settings}`,
});