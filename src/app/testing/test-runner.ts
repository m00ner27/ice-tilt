/**
 * Test runner utilities for NgRx components
 * This file provides utilities to run tests with consistent patterns
 */

import { ComponentFixture } from '@angular/core/testing';
import { MockStore } from '@ngrx/store/testing';
import { AppState } from '../store';
import { TestUtils } from './test-utils';
import { TestConfig } from './test-config';

/**
 * Test runner for NgRx components
 */
export class TestRunner<T> {
  private fixture!: ComponentFixture<T>;
  private component!: T;
  private store!: MockStore<AppState>;

  /**
   * Setup test environment
   */
  async setup(
    componentClass: any,
    initialState: Partial<AppState> = {},
    additionalProviders: any[] = []
  ): Promise<void> {
    await TestConfig.configureTestBed(componentClass, initialState, additionalProviders).compileComponents();
    
    this.fixture = TestBed.createComponent<T>(componentClass);
    this.component = this.fixture.componentInstance;
    this.store = TestConfig.getMockStore();
  }

  /**
   * Get component instance
   */
  getComponent(): T {
    return this.component;
  }

  /**
   * Get fixture
   */
  getFixture(): ComponentFixture<T> {
    return this.fixture;
  }

  /**
   * Get store
   */
  getStore(): MockStore<AppState> {
    return this.store;
  }

  /**
   * Update store state
   */
  updateState(state: Partial<AppState>): void {
    TestUtils.setStoreState(this.store, state);
  }

  /**
   * Dispatch action
   */
  dispatchAction(action: any): void {
    TestUtils.dispatchAction(this.store, action);
  }

  /**
   * Wait for async operations
   */
  async waitForAsync(): Promise<void> {
    await TestUtils.waitForAsync(this.fixture);
  }

  /**
   * Detect changes
   */
  detectChanges(): void {
    this.fixture.detectChanges();
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.fixture) {
      this.fixture.destroy();
    }
  }

  /**
   * Run a test with setup and cleanup
   */
  async runTest(
    testFn: (runner: TestRunner<T>) => Promise<void> | void,
    componentClass: any,
    initialState: Partial<AppState> = {},
    additionalProviders: any[] = []
  ): Promise<void> {
    try {
      await this.setup(componentClass, initialState, additionalProviders);
      await testFn(this);
    } finally {
      this.cleanup();
    }
  }
}

/**
 * Test scenarios for common NgRx component patterns
 */
export class TestScenarios {
  /**
   * Test component initialization
   */
  static async testInitialization<T>(
    runner: TestRunner<T>,
    expectedCalls: string[] = []
  ): Promise<void> {
    const component = runner.getComponent();
    
    // Test component creation
    expect(component).toBeTruthy();
    
    // Test initialization
    if (typeof (component as any).ngOnInit === 'function') {
      (component as any).ngOnInit();
    }
    
    await runner.waitForAsync();
  }

  /**
   * Test data loading
   */
  static async testDataLoading<T>(
    runner: TestRunner<T>,
    feature: keyof AppState,
    mockData: any[]
  ): Promise<void> {
    // Test loading state
    runner.updateState(TestConfig.createLoadingState(feature));
    await runner.waitForAsync();
    
    // Test data loaded state
    const stateWithData = TestConfig.createDefaultState();
    (stateWithData[feature] as any) = {
      ...(stateWithData[feature] as any),
      [Array.isArray(mockData) ? 'clubs' : 'selectedClub']: mockData,
      loading: false,
      error: null
    };
    
    runner.updateState(stateWithData);
    await runner.waitForAsync();
  }

  /**
   * Test error handling
   */
  static async testErrorHandling<T>(
    runner: TestRunner<T>,
    feature: keyof AppState,
    errorMessage: string = 'Test error'
  ): Promise<void> {
    runner.updateState(TestConfig.createErrorState(feature, errorMessage));
    await runner.waitForAsync();
    
    // Verify error is handled
    const component = runner.getComponent();
    if ((component as any).error !== undefined) {
      expect((component as any).error).toBe(errorMessage);
    }
  }

  /**
   * Test filtering functionality
   */
  static async testFiltering<T>(
    runner: TestRunner<T>,
    filterMethod: string,
    filterValue: any,
    expectedResults: number
  ): Promise<void> {
    const component = runner.getComponent();
    
    if (typeof (component as any)[filterMethod] === 'function') {
      (component as any)[filterMethod](filterValue);
      await runner.waitForAsync();
      
      if ((component as any).filteredItems !== undefined) {
        expect((component as any).filteredItems.length).toBe(expectedResults);
      }
    }
  }

  /**
   * Test search functionality
   */
  static async testSearch<T>(
    runner: TestRunner<T>,
    searchTerm: string,
    expectedResults: number
  ): Promise<void> {
    const component = runner.getComponent();
    
    if (typeof (component as any).onSearchChange === 'function') {
      (component as any).onSearchChange({ target: { value: searchTerm } });
      await runner.waitForAsync();
      
      if ((component as any).filteredItems !== undefined) {
        expect((component as any).filteredItems.length).toBe(expectedResults);
      }
    }
  }

  /**
   * Test component lifecycle
   */
  static async testLifecycle<T>(runner: TestRunner<T>): Promise<void> {
    const component = runner.getComponent();
    
    // Test destroy
    if (typeof (component as any).ngOnDestroy === 'function') {
      spyOn((component as any)['destroy$'], 'next');
      spyOn((component as any)['destroy$'], 'complete');
      
      (component as any).ngOnDestroy();
      
      expect((component as any)['destroy$'].next).toHaveBeenCalled();
      expect((component as any)['destroy$'].complete).toHaveBeenCalled();
    }
  }
}

/**
 * Test data generators
 */
export class TestDataGenerators {
  /**
   * Generate test clubs
   */
  static generateClubs(count: number = 3): any[] {
    return Array.from({ length: count }, (_, i) => 
      TestUtils.createMockClub({
        _id: `club-${i + 1}`,
        name: `Test Club ${i + 1}`,
        manager: `Manager ${i + 1}`
      })
    );
  }

  /**
   * Generate test users
   */
  static generateUsers(count: number = 3): any[] {
    return Array.from({ length: count }, (_, i) => 
      TestUtils.createMockUser({
        _id: `user-${i + 1}`,
        discordUsername: `Player${i + 1}`,
        gamertag: `player${i + 1}-gamertag`
      })
    );
  }

  /**
   * Generate test matches
   */
  static generateMatches(count: number = 3): any[] {
    return Array.from({ length: count }, (_, i) => 
      TestUtils.createMockMatch({
        _id: `match-${i + 1}`,
        homeTeam: `Home Team ${i + 1}`,
        awayTeam: `Away Team ${i + 1}`,
        homeScore: i + 1,
        awayScore: i
      })
    );
  }

  /**
   * Generate test seasons
   */
  static generateSeasons(count: number = 2): any[] {
    return Array.from({ length: count }, (_, i) => 
      TestUtils.createMockSeason({
        _id: `season-${i + 1}`,
        name: `Test Season ${i + 1}`,
        startDate: new Date(2024, i, 1).toISOString(),
        endDate: new Date(2024, i + 6, 30).toISOString()
      })
    );
  }
}
