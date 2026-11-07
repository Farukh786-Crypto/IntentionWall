import { Service } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { StringEmpty } from '../models';
import { englishOnlyValidators } from './english-only.validator';


type AddIntentionFormControls = {
    firstName: FormControl<string>;
    lastName: FormControl<string>;
    email: FormControl<string>;
    country: FormControl<string>;
    zone: FormControl<string>;
    tradition: FormControl<string>;
    content: FormControl<string>;
    emailconsent: FormControl<boolean>;
    consent: FormControl<boolean>;
    post_Anonymously: FormControl<boolean>;
    otp: FormControl<string>;
};

@Service()
export class AddIntentionForm extends FormGroup<AddIntentionFormControls> {
    constructor() {
        super({
            firstName: new FormControl(StringEmpty, { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[A-Za-z]+$/)] }),
            lastName: new FormControl(StringEmpty, { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[A-Za-z]+$/)] }),
            email: new FormControl(StringEmpty, { nonNullable: true, validators: [Validators.required, Validators.email] }),
            content: new FormControl(StringEmpty, { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(350), englishOnlyValidators()] }),
            country: new FormControl(StringEmpty, { nonNullable: true, validators: [Validators.required] }),
            zone: new FormControl(StringEmpty, { nonNullable: true, validators: [Validators.required] }),
            tradition: new FormControl(StringEmpty, { nonNullable: true }),
            emailconsent: new FormControl(false, { nonNullable: true, }),
            consent: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
            post_Anonymously: new FormControl(false, { nonNullable: true }),
            otp: new FormControl(StringEmpty, { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{6}$/)] })
        });
    }
}