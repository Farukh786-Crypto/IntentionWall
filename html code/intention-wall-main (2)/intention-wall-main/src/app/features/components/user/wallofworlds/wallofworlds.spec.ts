import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Wallofworlds } from './wallofworlds';

describe('Wallofworlds', () => {
  let component: Wallofworlds;
  let fixture: ComponentFixture<Wallofworlds>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Wallofworlds],
    }).compileComponents();

    fixture = TestBed.createComponent(Wallofworlds);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
