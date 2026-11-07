import { Service } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { StringEmpty } from '../models';


type MessageDetailsFormControls = {
    message: FormControl<string>;
    submittedBy: FormControl<string>;
    email: FormControl<string>;
    country: FormControl<string>;
    zone: FormControl<string>;
    tradition: FormControl<string>;
    dateSubmitted: FormControl<string>;
    reviewComment: FormControl<string>;
};

@Service()
export class MessageDetailsIntentionForm extends FormGroup<MessageDetailsFormControls> {
    constructor() {
        super({
            message: new FormControl(StringEmpty, { nonNullable: true }),
            submittedBy: new FormControl(StringEmpty, { nonNullable: true }),
            email: new FormControl(StringEmpty, { nonNullable: true }),
            country: new FormControl(StringEmpty, { nonNullable: true }),
            zone: new FormControl(StringEmpty, { nonNullable: true }),
            tradition: new FormControl(StringEmpty, { nonNullable: true }),
            dateSubmitted: new FormControl(StringEmpty, { nonNullable: true }),
            reviewComment: new FormControl(StringEmpty, { nonNullable: true })
        });
    }
}