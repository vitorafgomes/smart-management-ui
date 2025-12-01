import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SmartAdmin } from './smart-admin';

describe('SmartAdmin', () => {
  let component: SmartAdmin;
  let fixture: ComponentFixture<SmartAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SmartAdmin]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SmartAdmin);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
