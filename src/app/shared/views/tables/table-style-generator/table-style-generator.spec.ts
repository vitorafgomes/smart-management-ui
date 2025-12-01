import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TableStyleGenerator } from './table-style-generator';

describe('TableStyleGenerator', () => {
  let component: TableStyleGenerator;
  let fixture: ComponentFixture<TableStyleGenerator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TableStyleGenerator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TableStyleGenerator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
