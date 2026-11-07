import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { detect } from 'tinyld';

export function englishOnlyValidators(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value?.trim();
        // Let Validators.required handle empty value
        if (!value) {
            return null;
        }
        const language = detect(value);
        return language == 'en' ? null : { englishOnly: true };
    }
}