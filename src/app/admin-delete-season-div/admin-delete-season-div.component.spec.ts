import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDeleteSeasonDivComponent } from './admin-delete-season-div.component';

describe('AdminDeleteSeasonDivComponent', () => {
  let component: AdminDeleteSeasonDivComponent;
  let fixture: ComponentFixture<AdminDeleteSeasonDivComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDeleteSeasonDivComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminDeleteSeasonDivComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
