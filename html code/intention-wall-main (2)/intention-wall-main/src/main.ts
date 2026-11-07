import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import './app/features/common/Validators/prime-license';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
