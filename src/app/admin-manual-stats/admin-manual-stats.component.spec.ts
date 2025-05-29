import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminManualStatsComponent } from './admin-manual-stats.component';

describe('AdminManualStatsComponent', () => {
  let component: AdminManualStatsComponent;
  let fixture: ComponentFixture<AdminManualStatsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminManualStatsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminManualStatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
