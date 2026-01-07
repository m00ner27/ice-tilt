import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleBarComponent } from './schedule-bar.component';
import { TestUtils } from '../testing/test-utils';

describe('ScheduleBarComponent', () => {
  let component: ScheduleBarComponent;
  let fixture: ComponentFixture<ScheduleBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleBarComponent],
      providers: [
        ...TestUtils.getCommonMockProviders()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
