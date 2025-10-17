import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ManagerViewComponent } from './manager-view.component';
import { TestUtils } from '../testing/test-utils';

describe('ManagerViewComponent', () => {
  let component: ManagerViewComponent;
  let fixture: ComponentFixture<ManagerViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ManagerViewComponent],
      providers: [
        ...TestUtils.getCommonMockProviders(),
        TestUtils.createMockStore()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ManagerViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
