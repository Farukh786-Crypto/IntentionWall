import { FormGroup } from '@angular/forms';

export function hasValidationErrors(form: FormGroup, controlName: string, errorName?: string): boolean {
    const control = form.controls[controlName];
    if (!control || !(control?.touched || control?.dirty)) {
        return false;
    }
    if (errorName) {
        return control.hasError(errorName);
    }
    return control.invalid;
}