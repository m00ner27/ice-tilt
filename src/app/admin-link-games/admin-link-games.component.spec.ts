import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminLinkGamesComponent } from './admin-link-games.component';

describe('AdminLinkGamesComponent', () => {
  let component: AdminLinkGamesComponent;
  let fixture: ComponentFixture<AdminLinkGamesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLinkGamesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminLinkGamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
