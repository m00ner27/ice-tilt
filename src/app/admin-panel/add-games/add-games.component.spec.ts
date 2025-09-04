import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddGamesComponent } from './add-games.component';
import { TestUtils } from '../../testing/test-utils';

describe('AddGamesComponent', () => {
  let component: AddGamesComponent;
  let fixture: ComponentFixture<AddGamesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddGamesComponent],
      providers: [
        ...TestUtils.getCommonMockProviders()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddGamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
