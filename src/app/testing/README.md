# NgRx Component Testing Guide

This guide explains how to test NgRx-integrated components in the Ice Tilt application.

## Testing Infrastructure

### Core Testing Files

- **`test-utils.ts`** - Core testing utilities and mock data generators
- **`base-ngrx-component.spec.ts`** - Base test class for NgRx components
- **`test-config.ts`** - Test configuration utilities
- **`test-runner.ts`** - Test runner and scenario utilities

### Key Testing Utilities

#### TestUtils
Provides mock data generators and common testing utilities:

```typescript
// Create mock data
const mockClub = TestUtils.createMockClub({ name: 'Test Club' });
const mockPlayer = TestUtils.createMockPlayer({ position: 'C' });
const mockMatch = TestUtils.createMockMatch({ homeScore: 3, awayScore: 2 });

// Setup component with NgRx
const fixture = TestUtils.setupComponentWithStore(ClubListComponent, {
  clubs: { clubs: [mockClub], loading: false, error: null }
});

// Wait for async operations
await TestUtils.waitForAsync(fixture);
```

#### BaseNgRxComponentTest
Base class for NgRx component tests:

```typescript
class MyComponentTest extends BaseNgRxComponentTest<MyComponent> {
  async setupTest() {
    await this.setupTest(MyComponent, {
      clubs: { clubs: [], loading: false, error: null }
    });
  }
}
```

## Testing Patterns

### 1. Component Initialization Testing

```typescript
describe('Component Initialization', () => {
  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load data on init', () => {
    component.ngOnInit();
    expect(ngrxApiService.loadClubs).toHaveBeenCalled();
  });

  it('should initialize with default values', () => {
    expect(component.filteredItems).toEqual([]);
    expect(component.loading).toBe(false);
  });
});
```

### 2. Data Loading Testing

```typescript
describe('Data Loading', () => {
  it('should display data when loaded', async () => {
    component.ngOnInit();
    await TestUtils.waitForAsync(fixture);
    
    expect(component.filteredItems.length).toBe(2);
  });

  it('should display loading state', async () => {
    store.setState({
      clubs: { clubs: [], loading: true, error: null }
    });
    
    await TestUtils.waitForAsync(fixture);
    expect(component.loading).toBe(true);
  });

  it('should display error state', async () => {
    store.setState({
      clubs: { clubs: [], loading: false, error: 'Failed to load' }
    });
    
    await TestUtils.waitForAsync(fixture);
    expect(component.error).toBe('Failed to load');
  });
});
```

### 3. User Interaction Testing

```typescript
describe('User Interactions', () => {
  it('should filter data when search input changes', () => {
    component.searchText = 'test';
    component.onSearchChange({ target: { value: 'test' } } as any);
    
    expect(component.filteredItems.length).toBe(1);
  });

  it('should sort data when sort button clicked', () => {
    component.onSortChange('name');
    
    expect(component.sortCriteria).toBe('name');
    expect(component.sortDirection).toBe('asc');
  });
});
```

### 4. NgRx Integration Testing

```typescript
describe('NgRx Integration', () => {
  it('should dispatch actions on user interactions', () => {
    component.onAddItem({ name: 'Test Item' });
    
    expect(ngrxApiService.addItem).toHaveBeenCalledWith({ name: 'Test Item' });
  });

  it('should subscribe to store state changes', () => {
    store.setState({
      items: { items: [mockItem], loading: false, error: null }
    });
    
    expect(component.items.length).toBe(1);
  });
});
```

## Component-Specific Testing

### Club List Component
- Tests data loading and display
- Tests search and filtering functionality
- Tests image URL handling
- Tests router navigation

### Free Agents Component
- Tests user data mapping
- Tests position and status filtering
- Tests search functionality
- Tests refresh capability

### Schedule Component
- Tests match data display
- Tests team and season filtering
- Tests sorting functionality
- Tests date formatting

### Standings Component
- Tests standings calculation
- Tests season selection
- Tests sorting by different columns
- Tests data aggregation

### Inbox Component
- Tests authentication flow
- Tests offer display and response
- Tests error handling
- Tests Auth0 integration

### Players Component
- Tests complex data processing
- Tests multiple filter combinations
- Tests club logo mapping
- Tests position grouping

### Club Detail Component
- Tests route parameter handling
- Tests data mapping
- Tests season selection
- Tests child component integration

## Mock Data Patterns

### Creating Mock Data
```typescript
// Simple mock
const mockClub = TestUtils.createMockClub({ name: 'Test Club' });

// Complex mock with relationships
const mockClubWithRoster = TestUtils.createMockClub({
  name: 'Test Club',
  seasons: [{
    seasonId: 'season-1',
    roster: ['user-1', 'user-2']
  }]
});
```

### Mock Store State
```typescript
const initialState = {
  clubs: {
    clubs: [mockClub1, mockClub2],
    selectedClub: mockClub1,
    loading: false,
    error: null
  }
};
```

## Testing Best Practices

### 1. Test Structure
- Group related tests in describe blocks
- Use descriptive test names
- Test one thing per test
- Use beforeEach for setup

### 2. Async Testing
- Always use `await TestUtils.waitForAsync(fixture)` for async operations
- Test loading states
- Test error states
- Test success states

### 3. Mock Management
- Use consistent mock data
- Create reusable mock generators
- Mock external dependencies
- Verify mock interactions

### 4. Assertions
- Test both positive and negative cases
- Verify component state changes
- Check DOM updates
- Validate user interactions

### 5. Cleanup
- Always call `fixture.destroy()` in afterEach
- Clean up subscriptions
- Reset mock state
- Clear timers and intervals

## Running Tests

### Individual Component Tests
```bash
ng test --include="**/club-list.component.spec.ts"
```

### All Component Tests
```bash
ng test
```

### Watch Mode
```bash
ng test --watch
```

### Coverage Report
```bash
ng test --code-coverage
```

## Common Testing Scenarios

### 1. Data Loading Flow
1. Component initializes
2. Dispatches load action
3. Shows loading state
4. Receives data
5. Updates display

### 2. User Interaction Flow
1. User performs action
2. Component processes input
3. Dispatches action
4. Updates local state
5. Re-renders view

### 3. Error Handling Flow
1. Action fails
2. Error state updated
3. Error message displayed
4. User can retry

### 4. Filtering Flow
1. User enters search term
2. Component filters data
3. Updates filtered results
4. Re-renders list

## Troubleshooting

### Common Issues

1. **Async operations not completing**
   - Use `await TestUtils.waitForAsync(fixture)`
   - Check for proper subscription cleanup

2. **Mock store not updating**
   - Verify store state structure
   - Check selector implementations

3. **Component not re-rendering**
   - Call `fixture.detectChanges()`
   - Check for proper change detection

4. **Mock services not working**
   - Verify service injection
   - Check mock method implementations

### Debug Tips

1. Use `console.log` to debug test state
2. Check fixture debug element
3. Verify store state with Redux DevTools
4. Use `fixture.debugElement.nativeElement` to inspect DOM

## Future Enhancements

1. **Visual Regression Testing**
   - Add screenshot testing
   - Test responsive layouts

2. **Integration Testing**
   - Test component interactions
   - Test full user workflows

3. **Performance Testing**
   - Test with large datasets
   - Measure rendering performance

4. **Accessibility Testing**
   - Test keyboard navigation
   - Test screen reader compatibility
