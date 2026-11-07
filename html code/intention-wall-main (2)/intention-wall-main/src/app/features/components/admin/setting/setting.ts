import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { TabsModule } from 'primeng/tabs';
import { ButtonModule } from 'primeng/button';
import { APPLICATIONSETTING, ApplicationSetting, countriesStoragekey, CountryOptions, CreateZoneRequest, EditBackendPageSize, IZone, Manage, MANAGEMENTS, PUBLIC_WALL_CONFIG, SELECTMANAGEMENT, Tradition, TRADITIONMANAGE, TraditionRequest, TraditionsOptions, traditionStoragekey, Zone, ZoneCountryList, ZONEMANAGE } from '../../../common/models';
import { RouterModule } from '@angular/router';
import { Adminleftsidepanel } from '../adminleftsidepanel/adminleftsidepanel';
import { LookupStore } from '../../../common/services/api-store';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { AddZoneForm } from '../../../common/Validators/setting-addzone-form';
import { hasValidationErrors } from '../../../common/Validators/form-utils';
import { ReactiveFormsModule } from '@angular/forms';
import { MultiSelectModule } from 'primeng/multiselect';
import { ApiHandlerService } from '../../../common/services';
import { AdminService } from '../../../common/services/admin.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableModule } from 'primeng/table';
import { AddTraditionForm } from '../../../common/Validators/add-tradition-form';
import { AddApplicationSettingForm } from '../../../common/Validators/application-setting-form';

@Component({
  imports: [CommonModule, ReactiveFormsModule, TabsModule, TableModule, MultiSelectModule, ButtonModule, DialogModule, InputTextModule, RouterModule, Adminleftsidepanel],
  selector: 'IntentionWall-setting',
  styleUrl: './setting.scss',
  templateUrl: './setting.html',
})
export class Setting implements OnInit {
  // inject services
  private readonly lookupStore = inject(LookupStore);
  private readonly apiHandler = inject(ApiHandlerService);
  private readonly adminService = inject(AdminService);
  private readonly destroyRef = inject(DestroyRef);
  readonly addzoneForm = inject(AddZoneForm);
  readonly addTraditionForm = inject(AddTraditionForm);
  readonly addApplicationSettingForm = inject(AddApplicationSettingForm);

  collapsed: boolean = false;
  addZoneModelOpened = signal<boolean>(false);
  addTraditionModelOpened = signal<boolean>(false);
  applicationSettingModalOpened = signal<boolean>(false);
  applicationSettingWarningModalOpened = signal(false);
  applicationSetting = signal<ApplicationSetting[]>([]);
  deleteZoneModalOpened = signal<boolean>(false);
  selectManagement: string = SELECTMANAGEMENT;
  managements = signal<string[]>([]);
  Zones = signal<Zone[]>([]);
  countries = signal<CountryOptions[]>([]);
  traditionForZone = signal<TraditionsOptions[]>([]);
  selectedCountry?: string;
  selectedTradition?: string;
  zoneList = signal<IZone[]>([]);
  traditionList = signal<Tradition[]>([]);
  isZoneEdit = signal<boolean>(false);
  isTraditionEdit = signal<boolean>(false);
  selectedEditCountries = signal<CountryOptions[]>([]);
  selectedEditTraditions = signal<TraditionsOptions[]>([]);
  zoneId!: string;
  traditionId!: string;
  settingId?: string;
  Manage = Manage; // class here
  configurationSetting = signal<boolean>(false);
  editingConfigurationKey = signal<string | null>(null);
  readonly editBackendPageSizeVal: number = EditBackendPageSize;

  isConfiguration = signal<boolean>(false);

  ngOnInit(): void {
    this.lookupStore.loadAdminMessagesSelectOption();
    // pass array of management
    this.managements.set(MANAGEMENTS);
    // if tab changes
    if (this.selectManagement == Manage.zoneManage) {
      this.LoadZone();
    }
    // flag and country added or remove while edit zone 
    this.addedCountry();
    this.addedTradtion();
    this.editSettingFormValidation();
  }

  // changes value while edit setting configuration Form
  editSettingFormValidation() {
    this.addApplicationSettingForm.controls.value.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      // value must be numeric
      const numericVal = Number(value);
      if (value && !Number.isNaN(numericVal) && numericVal > this.editBackendPageSizeVal) {
        this.addApplicationSettingForm.controls.value.setErrors({
          ...(this.addApplicationSettingForm.controls.value.errors ?? {}),
          maxLimit: true
        });
        return;
      }
      const errors = this.addApplicationSettingForm.controls.value.errors;
      if (errors?.['maxLimit']) {
        delete errors['maxLimit'];
        this.addApplicationSettingForm.controls.value.setErrors(Object.keys(errors).length ? errors : null);
      }

    });
  }

  addedCountry() {
    // keep badges synchronized with multiselect
    this.addzoneForm.controls.countries.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(selectedIds => {
        //  selectedIds contains only currently selected country IDs
        let selectedCountries = this.countries().filter(country =>
          selectedIds.includes(country.Id)
        );
        // automatically adds new countries and removes unselected countries
        this.selectedEditCountries.set(selectedCountries);
      });
  }

  addedTradtion() {
    // keep badges synchronized with multiselect
    this.addzoneForm.controls.tradition.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(selectedIds => {
        //  selectedIds contains only currently selected country IDs
        let selectedTraditions = this.traditionForZone().filter(country =>
          selectedIds.includes(country.Name)
        );
        // automatically adds new countries and removes unselected countries
        this.selectedEditTraditions.set(selectedTraditions);
      });
  }


  cancelApplicationSettingWarning() {
    this.applicationSettingWarningModalOpened.set(false);
  }

  discardApplicationSettingChanges() {
    this.applicationSettingWarningModalOpened.set(false);
  }

  loadTradition() {
    // api called here
    this.apiHandler.execute({
      apiCall: () => this.adminService.getTraditions(),
      errorMessage: 'Unable to load traditions. Please try again.'
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res && Array.isArray(res.Data)) {
          this.traditionList.set(res.Data);
        }
      }
    })
  }


  saveConfiguration(modalName: string, setting?: ApplicationSetting) {
    this.applicationSettingModalOpened.set(true);
    if (modalName === 'Add') {
      this.addApplicationSettingForm.controls.key.enable(); // enabled
      this.addApplicationSettingForm.reset();
      this.isConfiguration.set(false);
    }
    if (modalName === 'Edit') {
      this.isConfiguration.set(true);
      this.addApplicationSettingForm.controls.key.disable(); // disabled key formcontrol
      // bind value to addApplicationSettingForm
      this.addApplicationSettingForm.patchValue({ key: setting?.Key, value: setting?.Value })
    }
    // getting value to settingId
    this.settingId = setting ? setting.Id : undefined;
  }

  loadSetting() {
    // api called here
    this.apiHandler.execute({
      apiCall: () => this.adminService.getSetting(),
      errorMessage: 'Unable to load application settings. Please try again.'
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res && Array.isArray(res.Data)) {
          const setting: ApplicationSetting[] = res.Data.map((item) => ({ Id: item.Id, Key: item.Key, Value: item.Value }))
          //store in localsotrage
          localStorage.removeItem(APPLICATIONSETTING);
          localStorage.setItem(APPLICATIONSETTING, JSON.stringify(setting));
          this.applicationSetting.set(setting);
        }
      }
    })
  }

  LoadZone() {
    // api called here
    this.apiHandler.execute({
      apiCall: () => this.adminService.getZone(),
      errorMessage: 'Unable to load zones. Please try again.'
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res && Array.isArray(res.Data)) {
          this.zoneList.set(res.Data);
        }
      }
    })
  }

  removeSelectedCountry(countryId: string) {
    // remove from badge
    this.selectedEditCountries.update(countries => countries.filter(country => country.Id !== countryId));
    // remove from control
    let selectedCountries = this.addzoneForm.controls.countries.value;
    let updatedCountries = selectedCountries.filter(id => id !== countryId);
    // set in formcontrol countried
    this.addzoneForm.controls.countries.setValue(updatedCountries);
  }

  removeSelectedTradition(traditionName: string) {
    // remove from badge
    this.selectedEditTraditions.update(traditions => traditions.filter(tradition => tradition.Name !== traditionName));
    // remove from control
    let selectedTraditions = this.addzoneForm.controls.tradition.value;
    let updatedTraditions = selectedTraditions.filter(id => id !== traditionName);
    // set in formcontrol countried
    this.addzoneForm.controls.tradition.setValue(updatedTraditions);
  }

  hasAddZoneFormErrors(controlName: string, errorName?: string): boolean {
    return hasValidationErrors(this.addzoneForm, controlName, errorName);
  }

  hasAddTraditionFormErrors(controlName: string, errorName?: string): boolean {
    return hasValidationErrors(this.addTraditionForm, controlName, errorName);
  }

  hasAddApplicationSettingFormErrors(controlName: string, errorName?: string): boolean {
    return hasValidationErrors(this.addApplicationSettingForm, controlName, errorName);
  }

  selectManagementTab(managementName: string) {
    this.selectManagement = managementName;
    if (this.selectManagement == Manage.zoneManage) {
      this.LoadZone();
    }
    if (this.selectManagement == Manage.traditionManage) {
      this.loadTradition();
    }
    if (this.selectManagement == Manage.configurationManage) {
      this.loadSetting();
      this.configurationSetting.set(true);
    }
  }

  cancelZoneModal() {
    this.isZoneEdit.set(false);
    this.selectedEditCountries.set([]);
    this.selectedEditTraditions.set([]);
    this.addzoneForm.reset();
    this.addZoneModelOpened.set(false);
  }

  isCollpased(value: boolean) {
    this.collapsed = value;
  }

  AddZone(modalName: string, zone?: IZone) {
    this.selectedEditCountries.set([]);
    this.selectedEditTraditions.set([]);
    // modal opened
    this.addZoneModelOpened.update(value => !value);
    const cacheCountries = localStorage.getItem(countriesStoragekey);
    const cacheTraditions = localStorage.getItem(traditionStoragekey);
    if (cacheCountries && cacheTraditions) {
      let countryList: CountryOptions[] = JSON.parse(cacheCountries);
      let traditionList: TraditionsOptions[] = JSON.parse(cacheTraditions);
      this.countries.set(countryList);
      this.traditionForZone.set(traditionList);
    }
    if (modalName === 'Add') {
      this.addzoneForm.reset();
    }
    if (modalName === 'Edit') {
      this.isZoneEdit.update(value => !value);
      // country objects for displaying badges
      if (Array.isArray(zone?.ZoneCountryList) && zone.ZoneCountryList.length >= 1) {
        this.selectedEditCountries.set(
          (zone?.ZoneCountryList ?? []).map(country => ({
            Id: country.CountryId,
            Name: country.CountryName,
            CountryCode2: country.CountryCode2
          }))
        );

        const traditionArray = this.getTraditionArray(zone.ZoneTradition);
        // Bind traditions to badges
        this.selectedEditTraditions.set(traditionArray.map(res => ({ Id: res, Name: res })));
        if (zone) {
          // pass zoneId as paramerter to EditZone()
          this.zoneId = zone?.ZoneId;
          this.addzoneForm.patchValue({
            zonename: zone.ZoneName,
            description: zone.Description,
            isActive: zone.IsActive,
            countries: (zone.ZoneCountryList ?? []).map(
              country => country.CountryId
            ),
            //tradition: zone.ZoneTradition.split(',')
            tradition: traditionArray
          });
        }
      }
    }
  }

  // Convert comma-separated tradition string into an array
  private getTraditionArray(tradition: string | null | undefined): string[] {
    return (tradition ?? '')
      .split(',')
      .map(item => item.trim())
      .filter(item => item !== '');
  }

  submitZone() {
    this.addzoneForm.markAllAsTouched();
    if (this.addzoneForm.invalid) {
      return;
    }

    const formValue = this.addzoneForm.getRawValue();
    let tradition = formValue.tradition.join(','); // convert array into string
    // create request here
    const Request: CreateZoneRequest = {
      name: formValue.zonename,
      description: formValue.description,
      isActive: formValue.isActive ?? true,
      countries: (formValue.countries as unknown as string[]).map((country) => ({
        countryId: country
      })),
      zoneTradition: tradition
    };
    if (!this.isZoneEdit()) {
      // called api here..
      this.addZone(Request);
    }
    else {
      this.editZone(this.zoneId, Request);
    }
  }

  toggleTraditionStatus() {
    const currentStatus = this.addTraditionForm.controls.isActive.value;
    // Toggle tradition status
    this.addTraditionForm.controls.isActive.setValue(!currentStatus);
  }

  AddTradition(modalName: string, tradition?: Tradition) {
    this.addTraditionModelOpened.update(value => !value);
    if (modalName === 'Add') {
      this.isTraditionEdit.set(false);
      this.addTraditionForm.reset();
    }
    if (modalName === 'Edit') {
      this.isTraditionEdit.set(true);

      if (tradition) {
        // pass zoneId as paramerter to EditZone()
        this.traditionId = tradition?.Id;
        this.addTraditionForm.patchValue({
          traditionName: tradition.TraditionName,
          description: tradition.Description,
          isActive: tradition.IsActive
        });
      }
    }
  }

  addZone(Request: CreateZoneRequest) {
    this.apiHandler.execute({
      apiCall: () => this.adminService.addSettingZone(Request),
      successMessage: 'Zone added successfully.',
      errorMessage: 'Unable to add zone. Please try again.'
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.Success) {
          this.addZoneModelOpened.set(false);
        }
      },
      complete: () => {
        this.addzoneForm.reset();
        // first clearzoneList then called loadZone api again
        this.lookupStore.clearZoneList();
        this.LoadZone();
      }
    })
  }

  editZone(zoneId: string, Request: CreateZoneRequest) {
    // called Edit Zone api here..
    this.apiHandler.execute({
      apiCall: () => this.adminService.editSettingZone(zoneId, Request),
      successMessage: 'Zone updated successfully.',
      errorMessage: 'Unable to update zone. Please try again.'
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.Success) {
          this.addZoneModelOpened.set(false);
        }
      },
      complete: () => {
        this.addzoneForm.reset();
        // called loadZone api again again
        this.LoadZone();
      }
    })
  }

  toggleZoneStatus(): void {
    const currentValue = this.addzoneForm.controls.isActive.value;
    // inactive in FormControl
    this.addzoneForm.controls.isActive.setValue(!currentValue);
  }

  deleteZone(zone: IZone) {
    // delete zone here
    this.deleteZoneModalOpened.set(true);
    // update zoneId
    this.zoneId = zone.ZoneId;
  }

  deleteModalZone() {
    // called delete zone api here..
    if (this.zoneId) {
      this.apiHandler.execute({
        apiCall: () => this.adminService.deleteSettingZone(this.zoneId),
        successMessage: 'Zone deleted successfully.',
        errorMessage: 'Unable to delete zone. Please try again.'
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (res) => {
          if (res.Success) {
            this.addzoneForm.reset();
            this.lookupStore.clearZoneList();
            this.deleteZoneModalOpened.set(false);
          }
        },
        complete: () => {
          this.LoadZone();
        }
      })
    }
  }

  deleteTradition(tradition: Tradition) {
    this.traditionId = tradition.Id;
    // called delete api here
    this.apiHandler.execute({
      apiCall: () => this.adminService.deleteTradition(this.traditionId),
      successMessage: 'Tradition deleted successfully.',
      errorMessage: 'Unable to delete tradition. Please try again.'
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.Success) {
          this.addTraditionForm.reset();
          // called loadZone api again again
          this.loadTradition();
        }
      }
    })
  }

  cancelTraditionModal() {
    this.addTraditionModelOpened.set(false);
  }

  submitTradition() {
    this.addTraditionForm.markAllAsTouched();
    if (this.addTraditionForm.invalid) {
      return;
    }
    const formBody = this.addTraditionForm.controls;
    const Request: TraditionRequest = {
      name: formBody.traditionName.value,
      description: formBody.description.value,
      isActive: formBody.isActive.value ?? true,
    }
    // submit Tradition here..
    if (!this.isTraditionEdit()) {
      this.addTradition(Request);
    }
    else {
      this.editTradition(this.traditionId, Request);
    }

  }

  addTradition(Request: TraditionRequest) {
    // addTradition
    this.apiHandler.execute({
      apiCall: () => this.adminService.addTradition(Request),
      successMessage: 'Tradition added successfully.',
      errorMessage: 'Unable to add tradition. Please try again.'
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.Success) {
          this.addTraditionModelOpened.set(false);
          this.addTraditionForm.reset();
          // first delete localstorage then called loadZone api again again
          this.lookupStore.clearTraditionList();
          this.loadTradition();
        }
      }
    })
  }

  editTradition(traditionId: string, Request: TraditionRequest) {
    // edit api called here
    this.apiHandler.execute({
      apiCall: () => this.adminService.updateTradition(traditionId, Request),
      successMessage: 'Tradition updated successfully.',
      errorMessage: 'Unable to update tradition. Please try again.'
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.Success) {
          this.addTraditionModelOpened.set(false);
          this.addTraditionForm.reset();
          // called loadZone api again again
          this.loadTradition();
        }
      }
    })
  }

  cancelApplicationSettingModal() {
    this.applicationSettingModalOpened.set(false);
    this.addApplicationSettingForm.reset();
  }

  submitAppSetting(issettingEdit: string) {
    this.addApplicationSettingForm.markAllAsTouched();
    if (this.addApplicationSettingForm.invalid) {
      return;
    }
    const formValue = this.addApplicationSettingForm.getRawValue();
    const body: ApplicationSetting = {
      Key: formValue.key,
      Value: formValue.value
    }
    if (issettingEdit === 'Add') {
      // called api here for add Configuration
      this.settingId = undefined;
      this.AddConfigurationSetting(body);
    }
    if (issettingEdit === 'Edit') {
      if (this.settingId) {
        this.EditConfiguration(this.settingId, body);
      }
    }
  }

  AddConfigurationSetting(Request: ApplicationSetting) {
    this.apiHandler.execute({
      apiCall: () => this.adminService.addSetting(Request),
      successMessage: 'Application setting added successfully.',
      errorMessage: 'Unable to add application setting. Please try again.'
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.Success) {
          // close Modal here.
          this.applicationSettingModalOpened.set(false);
          this.addApplicationSettingForm.reset();
          // called loadSetting api again again
          this.loadSetting();
        }
      }
    })
  }

  EditConfiguration(settingId: string, Request: ApplicationSetting) {
    // edit api called here
    this.apiHandler.execute({
      apiCall: () => this.adminService.updateSetting(settingId, Request),
      successMessage: 'Application setting updated successfully.',
      errorMessage: 'Unable to update application setting. Please try again.'
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        if (res.Success) {
          // close Modal here.
          this.applicationSettingModalOpened.set(false);
          this.addApplicationSettingForm.reset();
          // called loadSetting api again again
          this.loadSetting();
        }
      }
    })
  }

  cancelDeleteModalZone() {
    this.deleteZoneModalOpened.set(false);
  }
}
