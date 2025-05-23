import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCreateClubComponent } from './admin-create-club.component';

describe('AdminCreateClubComponent', () => {
  let component: AdminCreateClubComponent;
  let fixture: ComponentFixture<AdminCreateClubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCreateClubComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCreateClubComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
