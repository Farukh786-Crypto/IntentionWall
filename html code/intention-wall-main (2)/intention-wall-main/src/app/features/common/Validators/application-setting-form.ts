import { Service } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { StringEmpty } from '../models';

type AddApplicationSettingFormControls = {
    key: FormControl<string>;
    value: FormControl<string>;
};

@Service()
export class AddApplicationSettingForm extends FormGroup<AddApplicationSettingFormControls> {
    constructor() {
        super({
            key: new FormControl(StringEmpty, { nonNullable: true, validators: [Validators.required] }),
            value: new FormControl(StringEmpty, { nonNullable: true, validators: [Validators.required] }),
        });
    }
}