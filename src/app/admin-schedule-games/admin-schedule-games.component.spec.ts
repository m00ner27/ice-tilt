import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminScheduleGamesComponent } from './admin-schedule-games.component';

describe('AdminScheduleGamesComponent', () => {
  let component: AdminScheduleGamesComponent;
  let fixture: ComponentFixture<AdminScheduleGamesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminScheduleGamesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminScheduleGamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
