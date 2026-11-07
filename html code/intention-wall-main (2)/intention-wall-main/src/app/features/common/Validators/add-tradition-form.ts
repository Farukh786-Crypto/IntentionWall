import { Service } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { StringEmpty } from '../models';

type AddTraditionFormControls = {
    traditionName: FormControl<string>;
    description: FormControl<string>;
    isActive: FormControl<boolean>;
};

@Service()
export class AddTraditionForm extends FormGroup<AddTraditionFormControls> {
    constructor() {
        super({
            traditionName: new FormControl(StringEmpty, {
                nonNullable: true,
                validators: [Validators.required, Validators.pattern(/^[A-Za-z]+(?: [A-Za-z]+)*$/)]
            }),

            description: new FormControl(StringEmpty, {
                nonNullable: true, validators: [Validators.maxLength(350)]
            }),
            isActive: new FormControl<boolean>(true, { nonNullable: true })
        });
    }
}