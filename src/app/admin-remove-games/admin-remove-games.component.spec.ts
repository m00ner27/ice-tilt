import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminRemoveGamesComponent } from './admin-remove-games.component';

describe('AdminRemoveGamesComponent', () => {
  let component: AdminRemoveGamesComponent;
  let fixture: ComponentFixture<AdminRemoveGamesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminRemoveGamesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminRemoveGamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
