import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCreateSeasonDivComponent } from './admin-create-season-div.component';

describe('AdminCreateSeasonDivComponent', () => {
  let component: AdminCreateSeasonDivComponent;
  let fixture: ComponentFixture<AdminCreateSeasonDivComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCreateSeasonDivComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCreateSeasonDivComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
