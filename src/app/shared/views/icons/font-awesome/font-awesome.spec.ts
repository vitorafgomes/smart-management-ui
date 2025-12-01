import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FontAwesome } from './font-awesome';

describe('FontAwesome', () => {
  let component: FontAwesome;
  let fixture: ComponentFixture<FontAwesome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FontAwesome]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FontAwesome);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
