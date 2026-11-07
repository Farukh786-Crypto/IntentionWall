import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Adminleftsidepanel } from './adminleftsidepanel';

describe('Adminleftsidepanel', () => {
  let component: Adminleftsidepanel;
  let fixture: ComponentFixture<Adminleftsidepanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Adminleftsidepanel],
    }).compileComponents();

    fixture = TestBed.createComponent(Adminleftsidepanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
