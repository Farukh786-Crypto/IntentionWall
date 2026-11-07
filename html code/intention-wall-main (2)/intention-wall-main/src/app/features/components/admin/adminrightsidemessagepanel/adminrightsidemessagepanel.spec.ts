import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Adminrightsidemessagepanel } from './adminrightsidemessagepanel';

describe('Adminrightsidemessagepanel', () => {
  let component: Adminrightsidemessagepanel;
  let fixture: ComponentFixture<Adminrightsidemessagepanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Adminrightsidemessagepanel],
    }).compileComponents();

    fixture = TestBed.createComponent(Adminrightsidemessagepanel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
