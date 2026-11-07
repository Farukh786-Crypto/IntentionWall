import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { catchError, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Service()
export class Api {
    // inject services
    private readonly http = inject(HttpClient);
    private readonly adminBaseUrl = environment.adminApiBaseUrl;
    private readonly messageFetchUrl = environment.messagefetchApiBaseUrl;
    private readonly messageBaseUrl = environment.messageApiBaseUrl;

    // Admin API - port 7071
    getAdmin<T>(url: string, params?: Record<string, string | number | boolean>): Observable<T> {
        return this.http.get<T>(`${this.adminBaseUrl}${url}`, { params });
    }

    postAdmin<TRequest, TResponse>(url: string, body: TRequest): Observable<TResponse> {
        return this.http.post<TResponse>(`${this.adminBaseUrl}${url}`, body);
    }

    putAdmin<TRequest, TResponse>(url: string, body: TRequest): Observable<TResponse> {
        return this.http.put<TResponse>(`${this.adminBaseUrl}${url}`, body);
    }

    // Admin API - Port 7071
    deleteAdmin<TResponse>(
        url: string
    ): Observable<TResponse> {
        return this.http.delete<TResponse>(`${this.adminBaseUrl}${url}`);
    }
    // Message Fetch API - Port 7072
    getMessageFetch<T>(url: string, params?: Record<string, string | number | boolean>): Observable<T> {
        return this.http.get<T>(`${this.messageFetchUrl}${url}`, { params });
    }
    // Message API - Port 7073
    getMessage<T>(url: string, params?: Record<string, string | number | boolean>): Observable<T> {
        return this.http.get<T>(`${this.messageBaseUrl}${url}`, { params });
    }

    postMessage<TRequest, TResponse>(url: string, body: TRequest): Observable<TResponse> {
        return this.http.post<TResponse>(`${this.messageBaseUrl}${url}`, body);
    }

    putMessage<TRequest, TResponse>(url: string, body: TRequest): Observable<TResponse> {
        return this.http.put<TResponse>(`${this.messageBaseUrl}${url}`, body);
    }
}
