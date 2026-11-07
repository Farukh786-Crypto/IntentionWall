import { inject, Service } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ToastType } from '../models/constants';


@Service()
export class Toastservice {

    private toastr = inject(ToastrService);

    showSuccess(message: string) {
        this.toastr.success(message, ToastType.Success);
    }

    showError(message: string) {
        this.toastr.error(message, ToastType.Error);
    }

    showWarning(message: string) {
        this.toastr.warning(message, ToastType.Warning);
    }

    showInfo(message: string) {
        this.toastr.info(message, ToastType.Info);
    }

}
