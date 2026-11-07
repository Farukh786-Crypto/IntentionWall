import { Service } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

type LoginFormControls = {
  Email: FormControl<string>;
  Password: FormControl<string>;
};

@Service()
export class LoginForm extends FormGroup<LoginFormControls> {
  constructor() {
    super({
      Email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email]
      }),
      Password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(1)]
      })
    });
  }
}
