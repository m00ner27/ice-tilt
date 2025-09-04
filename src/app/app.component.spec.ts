import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { TestUtils } from './testing/test-utils';
import { NgRxApiService } from './store/services/ngrx-api.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    const ngrxApiServiceSpy = jasmine.createSpyObj('NgRxApiService', ['auth0Sync']);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        ...TestUtils.getCommonMockProviders(),
        TestUtils.createMockStore(),
        { provide: NgRxApiService, useValue: ngrxApiServiceSpy }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have loading state`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.isLoading).toBeDefined();
  });

  it('should render navigation', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-navigation')).toBeTruthy();
  });
});
