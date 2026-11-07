import { Service } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { StringEmpty, ZoneCountryList } from '../models';


type AddZoneFormControls = {
    zonename: FormControl<string>;
    description: FormControl<string>;
    countries: FormControl<string[]>;
    tradition: FormControl<string[]>;
    isActive: FormControl<boolean>;
};

@Service()
export class AddZoneForm extends FormGroup<AddZoneFormControls> {
    constructor() {
        super({
            zonename: new FormControl(StringEmpty, { nonNullable: true, validators: [Validators.required, Validators.pattern(/^[A-Za-z]+(?: [A-Za-z]+)*$/)] }),
            description: new FormControl(StringEmpty, { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(350)] }),
            countries: new FormControl<string[]>([], { nonNullable: true, validators: [Validators.required] }),
            tradition: new FormControl<string[]>([], { nonNullable: true }),
            isActive: new FormControl<boolean>(true, { nonNullable: true })
        });
    }
}