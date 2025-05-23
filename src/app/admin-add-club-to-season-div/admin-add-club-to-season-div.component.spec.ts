import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAddClubToSeasonDivComponent } from './admin-add-club-to-season-div.component';

describe('AdminAddClubToSeasonDivComponent', () => {
  let component: AdminAddClubToSeasonDivComponent;
  let fixture: ComponentFixture<AdminAddClubToSeasonDivComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAddClubToSeasonDivComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAddClubToSeasonDivComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
