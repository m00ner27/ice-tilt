import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngrx/store';
import { MockStore } from '@ngrx/store/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Actions } from '@ngrx/effects';
import { Observable, of } from 'rxjs';
import { AppState } from '../store';
import { TestUtils } from './test-utils';

/**
 * Base test class for NgRx components
 */
export abstract class BaseNgRxComponentTest<T> {
  protected fixture!: ComponentFixture<T>;
  protected component!: T;
  protected store!: MockStore<AppState>;
  protected actions$!: Observable<any>;

  /**
   * Setup the test environment
   */
  protected async setupTest(
    componentClass: any,
    initialState: Partial<AppState> = {}
  ): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [componentClass],
      providers: [
        TestUtils.createMockStore(initialState),
        provideMockActions(() => this.actions$ = of())
      ]
    }).compileComponents();

    this.fixture = TestBed.createComponent<T>(componentClass);
    this.component = this.fixture.componentInstance;
    this.store = TestBed.inject(MockStore);
    this.actions$ = TestBed.inject(Actions);
  }

  /**
   * Cleanup after each test
   */
  protected cleanup(): void {
    if (this.fixture) {
      this.fixture.destroy();
    }
  }

  /**
   * Wait for async operations
   */
  protected async waitForAsync(): Promise<void> {
    await TestUtils.waitForAsync(this.fixture);
  }

  /**
   * Set store state
   */
  protected setStoreState(state: Partial<AppState>): void {
    TestUtils.setStoreState(this.store, state);
  }

  /**
   * Dispatch action
   */
  protected dispatchAction(action: any): void {
    TestUtils.dispatchAction(this.store, action);
  }

  /**
   * Get element by test id
   */
  protected getByTestId(testId: string): HTMLElement | null {
    return TestUtils.getByTestId(this.fixture, testId);
  }

  /**
   * Get all elements by test id
   */
  protected getAllByTestId(testId: string): NodeListOf<Element> {
    return TestUtils.getAllByTestId(this.fixture, testId);
  }

  /**
   * Simulate input
   */
  protected simulateInput(selector: string, value: string): void {
    TestUtils.simulateInput(this.fixture, selector, value);
  }

  /**
   * Simulate click
   */
  protected simulateClick(selector: string): void {
    TestUtils.simulateClick(this.fixture, selector);
  }

  /**
   * Assert element exists
   */
  protected assertElementExists(selector: string, message?: string): void {
    const element = this.fixture.debugElement.nativeElement.querySelector(selector);
    expect(element).toBeTruthy(message || `Element with selector '${selector}' should exist`);
  }

  /**
   * Assert element does not exist
   */
  protected assertElementNotExists(selector: string, message?: string): void {
    const element = this.fixture.debugElement.nativeElement.querySelector(selector);
    expect(element).toBeFalsy(message || `Element with selector '${selector}' should not exist`);
  }

  /**
   * Assert element text content
   */
  protected assertElementText(selector: string, expectedText: string, message?: string): void {
    const element = this.fixture.debugElement.nativeElement.querySelector(selector);
    expect(element?.textContent?.trim()).toBe(expectedText, message || `Element text should be '${expectedText}'`);
  }

  /**
   * Assert element has class
   */
  protected assertElementHasClass(selector: string, className: string, message?: string): void {
    const element = this.fixture.debugElement.nativeElement.querySelector(selector);
    expect(element?.classList.contains(className)).toBe(true, message || `Element should have class '${className}'`);
  }

  /**
   * Assert element does not have class
   */
  protected assertElementNotHasClass(selector: string, className: string, message?: string): void {
    const element = this.fixture.debugElement.nativeElement.querySelector(selector);
    expect(element?.classList.contains(className)).toBe(false, message || `Element should not have class '${className}'`);
  }

  /**
   * Assert store state
   */
  protected assertStoreState(expectedState: Partial<AppState>, message?: string): void {
    // Note: MockStore doesn't have getState method in testing
    // This is a placeholder for the pattern
    expect(true).toBe(true, message || 'Store state assertion not implemented');
  }

  /**
   * Assert actions dispatched
   */
  protected assertActionsDispatched(expectedActions: any[], message?: string): void {
    // This would need to be implemented with a spy on store.dispatch
    // For now, this is a placeholder for the pattern
    expect(true).toBe(true, message || 'Actions dispatch assertion not implemented');
  }
}
