import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAddClubToSeasonDiv2Component } from './admin-add-club-to-season-div-2.component';

describe('AdminAddClubToSeasonDiv2Component', () => {
  let component: AdminAddClubToSeasonDiv2Component;
  let fixture: ComponentFixture<AdminAddClubToSeasonDiv2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAddClubToSeasonDiv2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAddClubToSeasonDiv2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
