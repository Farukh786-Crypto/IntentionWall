import { Service } from '@angular/core';
import { APPLICATIONSETTING, ApplicationSetting, PUBLIC_WALL_CONFIG } from '../models';

@Service()
export class ConfigurationService {
    private readonly storagekey = APPLICATIONSETTING;

    private getstting(): ApplicationSetting[] {
        const storageSettings = localStorage.getItem(this.storagekey);
        if (!storageSettings) {
            return [];
        }
        return JSON.parse(storageSettings);
    }

    get adminPageSize(): number {
        const setting = this.getstting();
        const value = setting.find(a => a.Key === 'adminPageSize')?.Value ?? PUBLIC_WALL_CONFIG.adminPageSize;
        return Number(value);
    }

    get backendPageSize(): number {
        const setting = this.getstting();
        const value = setting.find(a => a.Key === 'backendPageSize')?.Value ?? PUBLIC_WALL_CONFIG.backendpageSize;
        return Number(value);
    }
}