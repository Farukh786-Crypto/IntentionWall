import { Service, signal } from '@angular/core';

@Service()
export class Spinnerservice {

    readonly isLoading = signal(false);

    showSpinner(): void {
        this.isLoading.set(true);
    }

    hideSpinner(): void {
        this.isLoading.set(false);
    }

}
