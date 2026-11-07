import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PublishedMessage } from './published-message';

describe('PublishedMessage', () => {
  let component: PublishedMessage;
  let fixture: ComponentFixture<PublishedMessage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PublishedMessage],
    }).compileComponents();

    fixture = TestBed.createComponent(PublishedMessage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
