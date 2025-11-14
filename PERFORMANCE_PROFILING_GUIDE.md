# Performance Profiling Guide for Angular App

This guide will help you identify performance bottlenecks in your Angular app using browser DevTools and Angular DevTools.

## Table of Contents
1. [Chrome DevTools - Network Tab](#chrome-devtools---network-tab)
2. [Chrome DevTools - Performance Tab](#chrome-devtools---performance-tab)
3. [Angular DevTools](#angular-devtools)
4. [Understanding the Results](#understanding-the-results)
5. [Common Issues and Fixes](#common-issues-and-fixes)

---

## Chrome DevTools - Network Tab

### How to Open
1. Open your app in Chrome
2. Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
3. Click the **Network** tab

### What to Look For

#### 1. Identify Slow API Calls
- **Look for:** Requests with long "Time" values (red bars are slowest)
- **Action:** Click on a slow request to see details:
  - **Waiting (TTFB):** Time to first byte - if >500ms, backend is slow
  - **Content Download:** Time to download response - if large, response is too big
  - **Total Time:** Overall request time

#### 2. Check Response Sizes
- **Look for:** Large "Size" values (especially >100KB)
- **Action:** 
  - Click the request
  - Check "Preview" or "Response" tab
  - Look for unnecessary data being sent
  - Consider pagination or filtering on backend

#### 3. Understand Request Waterfall
- **What it shows:** Which requests happen in parallel vs sequentially
- **Red flags:**
  - Many requests happening one after another (sequential)
  - Long gaps between requests
  - Requests blocking each other

#### 4. Check Cache Status
- **Look for:** "Status" column
- **Good:** 200 (from cache) or 304 (Not Modified)
- **Bad:** Every request shows 200 (not cached)

### Example Analysis
```
Request: GET /api/games
Time: 2.5s
Size: 1.2MB
Status: 200

Problem: Loading ALL games at once
Solution: Add date filtering or pagination
```

---

## Chrome DevTools - Performance Tab

### How to Record a Performance Profile

1. Open DevTools (`F12`)
2. Click the **Performance** tab
3. Click the **Record** button (circle icon) or press `Cmd+E` (Mac) / `Ctrl+E` (Windows)
4. **Reload the page** or interact with your app
5. Click **Stop** when done (or wait for page to fully load)

### What to Look For

#### 1. Long Tasks (Red Bars)
- **What they are:** JavaScript tasks that take >50ms
- **Why it matters:** Blocks the main thread, makes app feel slow
- **How to fix:** 
  - Break up large computations
  - Use Web Workers for heavy processing
  - Optimize change detection

#### 2. Change Detection Cycles
- **Look for:** Many small green/yellow bars clustered together
- **Problem:** Too many change detection cycles
- **Solution:** Use OnPush change detection strategy

#### 3. Layout Shifts (Purple Bars)
- **What they are:** Elements moving around as page loads
- **Why it matters:** Bad user experience, affects CLS score
- **How to fix:**
  - Set image dimensions
  - Reserve space for dynamic content
  - Avoid inserting content above existing content

#### 4. JavaScript Execution Time
- **Look for:** Yellow "Scripting" bars
- **Problem:** Too much JavaScript running on startup
- **Solution:**
  - Lazy load routes
  - Defer non-critical code
  - Code split large bundles

### Reading the Timeline

```
┌─────────────────────────────────────┐
│ FPS (should stay at 60)            │
├─────────────────────────────────────┤
│ CPU (colored bars show activity)    │
│  - Yellow = JavaScript              │
│  - Purple = Layout/Reflow           │
│  - Green = Painting                 │
│  - Blue = Loading                   │
└─────────────────────────────────────┘
```

---

## Angular DevTools

### Installation
1. Install the [Angular DevTools extension](https://chrome.google.com/webstore/detail/angular-devtools) from Chrome Web Store
2. Reload Chrome

### Using the Profiler

1. Open DevTools (`F12`)
2. You'll see a new **Angular** tab
3. Click **Profiler** tab
4. Click **Record**
5. Interact with your app or reload
6. Click **Stop**

### What to Look For

#### 1. Component Render Times
- **Look for:** Components taking >16ms to render (one frame)
- **Problem:** Component doing too much work
- **Solution:**
  - Optimize template expressions
  - Use OnPush change detection
  - Break into smaller components

#### 2. Change Detection Frequency
- **Look for:** Components with many change detection cycles
- **Problem:** Change detection running too often
- **Solution:**
  - Use OnPush strategy
  - Avoid functions in templates
  - Use trackBy in *ngFor

#### 3. Component Tree
- **Look for:** Deep component trees
- **Problem:** Too many nested components
- **Solution:** Flatten component structure where possible

---

## Understanding the Results

### Good Performance Indicators
- ✅ FCP (First Contentful Paint): < 1.8s
- ✅ LCP (Largest Contentful Paint): < 2.5s
- ✅ TBT (Total Blocking Time): < 200ms
- ✅ API response times: < 500ms
- ✅ Bundle size: < 2MB initial
- ✅ Cache hit rate: > 80%

### Bad Performance Indicators
- ❌ FCP: > 3s
- ❌ LCP: > 4s
- ❌ TBT: > 600ms
- ❌ API response times: > 2s
- ❌ Bundle size: > 5MB
- ❌ Many long tasks (>50ms)

---

## Common Issues and Fixes

### Issue 1: Slow Initial Load
**Symptoms:**
- Long white screen
- High "Time to Interactive" in Lighthouse

**Diagnosis:**
1. Check Network tab - are bundles large?
2. Check Performance tab - are there long tasks?

**Fixes:**
- Enable lazy loading (already done)
- Reduce initial bundle size
- Defer non-critical JavaScript
- Optimize images

### Issue 2: Slow API Calls
**Symptoms:**
- App loads but data takes forever
- Network tab shows slow requests

**Diagnosis:**
1. Check Network tab - which API is slow?
2. Check backend logs for slow queries

**Fixes:**
- Increase cache TTL (already done)
- Implement request batching
- Add database indexes
- Use pagination

### Issue 3: App Feels Laggy
**Symptoms:**
- App loads but interactions are slow
- Scrolling is janky

**Diagnosis:**
1. Use Performance tab - record while interacting
2. Look for long tasks during interactions
3. Check Angular DevTools - change detection frequency

**Fixes:**
- Use OnPush change detection (already done)
- Optimize change detection
- Debounce user inputs
- Use virtual scrolling for long lists

### Issue 4: Memory Leaks
**Symptoms:**
- App gets slower over time
- Browser uses more and more memory

**Diagnosis:**
1. Use Performance tab - take heap snapshot
2. Check for components not being destroyed

**Fixes:**
- Unsubscribe from observables (already using takeUntil)
- Remove event listeners in ngOnDestroy
- Clear intervals/timeouts

---

## Quick Performance Checklist

Before deploying, check:

- [ ] Run Lighthouse audit (should score 80+)
- [ ] Check Network tab - no requests > 2s
- [ ] Check Performance tab - no long tasks > 100ms
- [ ] Verify production build is being used
- [ ] Check bundle sizes are reasonable (<2MB)
- [ ] Test on slow 3G network (Chrome DevTools > Network > Throttling)
- [ ] Verify cache is working (check Network tab for cached responses)

---

## Using the Performance Interceptor

The app now includes a `PerformanceInterceptor` that automatically logs API performance in development mode.

**To view API metrics:**
1. Open browser console (F12)
2. Look for messages like:
   - `⏱️ API: GET /api/seasons - 234ms - 45.2KB`
   - `⚠️ SLOW API: GET /api/games - 1250ms - 1.2MB`

**What the numbers mean:**
- First number: Request duration in milliseconds
- Second number: Response size in kilobytes
- `[CACHED]` means response came from cache

**Red flags:**
- API calls > 1000ms (1 second)
- Response sizes > 500KB
- No `[CACHED]` indicators (cache not working)

---

## Next Steps

After profiling:

1. **Identify the biggest bottleneck** (usually obvious from the data)
2. **Fix one issue at a time** (don't try to fix everything at once)
3. **Re-test after each fix** (verify the improvement)
4. **Document what worked** (for future reference)

Remember: **Measure first, optimize second!** Don't guess what's slow - use the tools to find out.

