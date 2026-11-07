import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WriteIntentionForm } from './write-intention-form';

describe('WriteIntentionForm', () => {
  let component: WriteIntentionForm;
  let fixture: ComponentFixture<WriteIntentionForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WriteIntentionForm],
    }).compileComponents();

    fixture = TestBed.createComponent(WriteIntentionForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
