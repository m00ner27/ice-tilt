import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminManageUsers2Component } from './admin-manage-users-2.component';

describe('AdminManageUsers2Component', () => {
  let component: AdminManageUsers2Component;
  let fixture: ComponentFixture<AdminManageUsers2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminManageUsers2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminManageUsers2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
