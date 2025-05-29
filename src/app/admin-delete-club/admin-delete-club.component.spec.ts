import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminDeleteClubComponent } from './admin-delete-club.component';

describe('AdminDeleteClubComponent', () => {
  let component: AdminDeleteClubComponent;
  let fixture: ComponentFixture<AdminDeleteClubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminDeleteClubComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminDeleteClubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
