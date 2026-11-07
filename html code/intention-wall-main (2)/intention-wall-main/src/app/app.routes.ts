import { Routes } from '@angular/router';
import { rootNavigationRoutes } from './features/common/models/navigation-routes';
import { authGuard } from './features/common/guards/auth-guard';
import { StringEmpty } from './features/common/models';
import { guestGuard } from './features/common/guards/guest-guard';

export const routes: Routes = [
    { path: StringEmpty, redirectTo: rootNavigationRoutes.intentionwall, pathMatch: 'full' },
    {
        path: rootNavigationRoutes.adminLogin,
        loadComponent: () => import('./core/components/admin/login/login').then(a => a.AdminLogin),
        canActivate: [guestGuard]
    },
    {
        path: rootNavigationRoutes.adminHome,
        loadComponent: () => import('./core/components/admin/home/home').then(a => a.Home),
        canActivate: [authGuard],
        children: [
            { path: StringEmpty, redirectTo: rootNavigationRoutes.intentionReview, pathMatch: 'full' },
            { path: rootNavigationRoutes.intentionReview, loadComponent: () => import('./features/components/admin/intention-review/intention-review').then(a => a.IntentionReview) },
            { path: rootNavigationRoutes.publishMessage, loadComponent: () => import('./features/components/admin/published-message/published-message').then(a => a.PublishedMessage) },
            { path: rootNavigationRoutes.auditLogs, loadComponent: () => import('./features/components/admin/audit-logs/audit-logs').then(a => a.AuditLogs) },
            { path: rootNavigationRoutes.settings, loadComponent: () => import('./features/components/admin/setting/setting').then(a => a.Setting) }
        ]
    },
    {
        path: rootNavigationRoutes.intentionwall, loadComponent: () => import('./core/components/user-dashboard/intentionwall').then(a => a.Intentionwall),
    },
    { path: '**', loadComponent: () => import('./features/common/components/page-not-found/page-not-found').then(a => a.PageNotFound) }
];
