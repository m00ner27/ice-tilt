import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMergeLagoutsComponent } from './admin-merge-lagouts.component';

describe('AdminMergeLagoutsComponent', () => {
  let component: AdminMergeLagoutsComponent;
  let fixture: ComponentFixture<AdminMergeLagoutsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminMergeLagoutsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminMergeLagoutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
