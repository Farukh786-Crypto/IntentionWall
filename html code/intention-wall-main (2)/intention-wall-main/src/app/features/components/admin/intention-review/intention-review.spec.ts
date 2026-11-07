import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntentionReview } from './intention-review';

describe('IntentionReview', () => {
  let component: IntentionReview;
  let fixture: ComponentFixture<IntentionReview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntentionReview],
    }).compileComponents();

    fixture = TestBed.createComponent(IntentionReview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
