#!/usr/bin/env node

/**
 * Test runner script for NgRx components
 * This script runs all component tests with proper configuration
 */

const { execSync } = require('child_process');
const path = require('path');

// Test configuration
const testConfig = {
  // Component test files
  componentTests: [
    'club-list.component.spec.ts',
    'schedule.component.spec.ts',
    'standings.component.spec.ts',
    'inbox.component.spec.ts',
    'club-detail.component.spec.ts',
    'match-detail.component.spec.ts',
    'view-profile.component.spec.ts'
  ],
  
  // Test options
  options: {
    watch: false,
    coverage: true,
    verbose: true,
    browsers: 'ChromeHeadless'
  }
};

/**
 * Run individual component test
 */
function runComponentTest(componentName) {
  console.log(`\n🧪 Running tests for ${componentName}...`);
  
  try {
    const testFile = `**/${componentName}`;
    const command = `ng test --include="${testFile}" --watch=false --browsers=ChromeHeadless`;
    
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log(`✅ ${componentName} tests passed`);
    return true;
  } catch (error) {
    console.error(`❌ ${componentName} tests failed:`, error.message);
    return false;
  }
}

/**
 * Run all component tests
 */
function runAllTests() {
  console.log('🚀 Starting NgRx Component Test Suite...\n');
  
  const results = [];
  
  testConfig.componentTests.forEach(testFile => {
    const componentName = testFile.replace('.component.spec.ts', '');
    const success = runComponentTest(testFile);
    results.push({ component: componentName, success });
  });
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.component}`);
  });
  
  console.log(`\nTotal: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Some tests failed. Please check the output above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  }
}

/**
 * Run tests with coverage
 */
function runTestsWithCoverage() {
  console.log('📊 Running tests with coverage...\n');
  
  try {
    const command = 'ng test --code-coverage --watch=false --browsers=ChromeHeadless';
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('\n✅ Coverage report generated in coverage/ directory');
  } catch (error) {
    console.error('❌ Coverage tests failed:', error.message);
    process.exit(1);
  }
}

/**
 * Run tests in watch mode
 */
function runTestsInWatchMode() {
  console.log('👀 Running tests in watch mode...\n');
  
  try {
    const command = 'ng test --watch=true';
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    console.error('❌ Watch mode tests failed:', error.message);
    process.exit(1);
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--coverage')) {
    runTestsWithCoverage();
  } else if (args.includes('--watch')) {
    runTestsInWatchMode();
  } else if (args.includes('--help')) {
    console.log(`
NgRx Component Test Runner

Usage: node run-tests.js [options]

Options:
  --coverage    Run tests with coverage report
  --watch       Run tests in watch mode
  --help        Show this help message

Examples:
  node run-tests.js                    # Run all tests once
  node run-tests.js --coverage         # Run tests with coverage
  node run-tests.js --watch            # Run tests in watch mode
    `);
  } else {
    runAllTests();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runComponentTest,
  runAllTests,
  runTestsWithCoverage,
  runTestsInWatchMode
};
