import { DestroyRef, inject, Service, signal } from '@angular/core';
import { ApiHandlerService } from './api-handler.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { countriesStoragekey, zonesStoragekey, traditionStoragekey, APPLICATIONSETTING } from '../models/constants';
import { AdminService } from './admin.service';
import { ApplicationSetting, Country, CountryOptions, Tradition, TraditionsOptions, Zone, ZoneOptions } from '../models';
import { ApplicationuserService } from './applicationuser.service';

@Service()
export class LookupStore {
    private readonly apiHandler = inject(ApiHandlerService);
    private readonly adminService = inject(AdminService);
    private readonly applicationUserService = inject(ApplicationuserService);
    private readonly destroyRef = inject(DestroyRef);

    countriesListOptions = signal<CountryOptions[]>([]);
    readonly zonesListOptions = signal<ZoneOptions[]>([]);
    traditionListOptions = signal<TraditionsOptions[]>([]);

    loadSetting() {
        // api called here
        this.apiHandler.execute({
            apiCall: () => this.adminService.getSetting(),
            errorMessage: 'Failed to Fetch Setting Records'
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (res) => {
                if (res && Array.isArray(res.Data)) {
                    const setting: ApplicationSetting[] = res.Data.map((item) => ({
                        Id: item.Id,
                        Key: item.Key,
                        Value: item.Value
                    }))
                    //store in localsotrage
                    localStorage.setItem(APPLICATIONSETTING, JSON.stringify(setting));

                }
            }
        })
    }

    loadMessagesSelectOption() {
        const cachedCountries = localStorage.getItem(countriesStoragekey);
        const cachedZones = localStorage.getItem(zonesStoragekey);
        const cachedTraditions = localStorage.getItem(traditionStoragekey);
        // called get zones api
        this.apiHandler.execute({
            apiCall: () => this.applicationUserService.getFiltersPublic(),
            showSpinner: false
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (res) => {
                if (res && res.Data) {
                    if (Array.isArray(res.Data.countries)) {
                        if (cachedCountries) {
                            const countries: CountryOptions[] = JSON.parse(cachedCountries);
                            this.countriesListOptions.set(countries);
                        } else {
                            this.countriesListOptions.set(res.Data.countries);
                        }
                    }

                    if (Array.isArray(res.Data.zones)) {
                        // load zones
                        if (cachedZones) {
                            const zones: ZoneOptions[] = JSON.parse(cachedZones);
                            this.zonesListOptions.set(zones);
                        } else {
                            this.zonesListOptions.set(res.Data.zones);
                        }
                    }

                    if (Array.isArray(res.Data.traditions)) {
                        // load traditions
                        if (cachedTraditions) {
                            const traditions: TraditionsOptions[] = JSON.parse(cachedTraditions);
                            this.traditionListOptions.set(traditions);
                        } else {
                            this.traditionListOptions.set(res.Data.traditions);
                        }
                    }

                }
            },
            complete: () => {
                localStorage.setItem(countriesStoragekey, JSON.stringify(this.countriesListOptions()));
                localStorage.setItem(zonesStoragekey, JSON.stringify(this.zonesListOptions()));
                localStorage.setItem(traditionStoragekey, JSON.stringify(this.traditionListOptions()));
            }
        })
    }


    loadAdminMessagesSelectOption() {
        const cachedCountries = localStorage.getItem(countriesStoragekey);
        const cachedZones = localStorage.getItem(zonesStoragekey);
        const cachedTraditions = localStorage.getItem(traditionStoragekey);
        // called get zones api
        this.apiHandler.execute({
            apiCall: () => this.adminService.getMessageSelectOptions(),
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (res) => {
                if (res && res.Data) {
                    if (Array.isArray(res.Data.countries)) {
                        if (cachedCountries) {
                            const countries: CountryOptions[] = JSON.parse(cachedCountries);
                            this.countriesListOptions.set(countries);
                        } else {
                            this.countriesListOptions.set(res.Data.countries);
                        }
                    }

                    if (Array.isArray(res.Data.zones)) {
                        // load zones
                        if (cachedZones) {
                            const zones: ZoneOptions[] = JSON.parse(cachedZones);
                            this.zonesListOptions.set(zones);
                        } else {
                            this.zonesListOptions.set(res.Data.zones);
                        }
                    }

                    if (Array.isArray(res.Data.traditions)) {
                        // load traditions
                        if (cachedTraditions) {
                            const traditions: TraditionsOptions[] = JSON.parse(cachedTraditions);
                            this.traditionListOptions.set(traditions);
                        } else {
                            this.traditionListOptions.set(res.Data.traditions);
                        }
                    }
                }
            },
            complete: () => {
                localStorage.setItem(countriesStoragekey, JSON.stringify(this.countriesListOptions()));
                localStorage.setItem(zonesStoragekey, JSON.stringify(this.zonesListOptions()));
                localStorage.setItem(traditionStoragekey, JSON.stringify(this.traditionListOptions()));
            }
        })
    }

    loadZones() {
        const cachedZones = localStorage.getItem(zonesStoragekey);

        if (cachedZones) {
            const zones: ZoneOptions[] = JSON.parse(cachedZones);
            this.zonesListOptions.set(zones);
            return;
        }

        // called zone api here
        this.apiHandler.execute({
            apiCall: () => this.applicationUserService.getZones(),
            errorMessage: 'Unable to load Zones',
            showSpinner: true,
        }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (res) => {
                if (res && Array.isArray(res.Data)) {
                    this.zonesListOptions.set(res.Data);
                    const zonesStorageList = res.Data.map((zone: ZoneOptions) => ({
                        ZoneId: zone.Id,
                        ZoneName: zone.Name,
                    }))
                    localStorage.setItem(zonesStoragekey, JSON.stringify(zonesStorageList));
                }
            }
        })
    }

    refreshCountries(): void {
        this.countriesListOptions.set([]);
        // called again
        // this.loadCountries();
    }

    refreshZones(): void {
        this.zonesListOptions.set([]);
        // called again
        //this.loadZones();
    }

    refreshTraditions(): void {
        this.traditionListOptions.set([]);
        // called again
        //this.loadTradition();
    }

    clearCountriesList(): void {
        localStorage.removeItem(countriesStoragekey);
        return this.countriesListOptions.set([]);
    }

    clearZoneList(): void {
        localStorage.removeItem(zonesStoragekey);
        return this.zonesListOptions.set([]);
    }

    clearTraditionList(): void {
        localStorage.removeItem(traditionStoragekey);
        return this.traditionListOptions.set([]);
    }

    clearLookStorage(): void {
        // clear localstorage
        localStorage.removeItem(countriesStoragekey);
        localStorage.removeItem(zonesStoragekey);
        localStorage.removeItem(traditionStoragekey);

        // clear signals
        this.clearCountriesList();
        this.clearZoneList();
        this.clearTraditionList();
    }
}
