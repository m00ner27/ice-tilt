# Ad Placement Strategy Plan

## Current Ad Placements
- **Home Page**: Banner ad at top, banner ad in middle, rectangle ad at bottom
- **Club Detail Page**: Rectangle ad after stats grid
- **Goalie Stats Page**: Banner ad at top
- **Standings Page**: Banner ad at top
- **Player Stats Page**: Banner ad at top

## Proposed Ad Placement Strategy

### 1. Header Ads (Navigation Bar)
**Location**: Below the main navigation bar, above page content
**Type**: Responsive banner (728x90 desktop, 320x50 mobile)
**Pages**: All public pages (except admin panel)
**Frequency**: One per page, always visible
**Priority**: High - High visibility, non-intrusive

### 2. Sidebar Ads (Desktop Only)
**Location**: Right sidebar on desktop layouts (hidden on mobile)
**Type**: Rectangle (300x250) or Skyscraper (160x600)
**Pages**: 
- Standings
- Player Stats
- Goalie Stats
- Rankings
- Schedule
- Articles List
- Clubs List
- Transactions
**Frequency**: One per page, sticky position
**Priority**: Medium - Good revenue, doesn't interfere with content

### 3. Full Page/Interstitial Ads
**Location**: Full-screen overlay (with close button)
**Type**: Full-page responsive ad
**Pages**: 
- **Schedule** (on page load, dismissible after 3 seconds)
- **Standings** (on page load, dismissible after 3 seconds)
**Frequency**: One per session per page type (use localStorage to track)
**Priority**: High - High revenue potential, but must be used sparingly

### 4. In-Content Ads
**Location**: Between content sections
**Type**: Banner or Rectangle
**Pages**:

#### Home Page
- ✅ Already has: Top banner, middle banner, bottom rectangle
- **Add**: Rectangle ad between news carousel and stats section

#### Standings Page
- ✅ Already has: Top banner
- **Add**: Rectangle ad between season filter and standings table
- **Add**: Banner ad after first division standings table

#### Player Stats Page
- ✅ Already has: Top banner
- **Add**: Rectangle ad between filters and stats tables
- **Add**: Banner ad after first division stats table

#### Goalie Stats Page
- ✅ Already has: Top banner
- **Add**: Rectangle ad between filters and stats tables
- **Add**: Banner ad after first division stats table

#### Club Detail Page
- ✅ Already has: Rectangle ad after stats grid
- **Add**: Banner ad after roster tables section

#### Match Detail Page
- **Add**: Banner ad at top (before match header)
- **Add**: Rectangle ad between home team stats and away team stats

#### Schedule Page
- **Add**: Banner ad at top
- **Add**: Rectangle ad in sidebar (desktop) or after first week (mobile)

#### Rankings Page
- **Add**: Banner ad at top
- **Add**: Rectangle ad after rankings table

#### Playoffs Page
- **Add**: Banner ad at top
- **Add**: Rectangle ad after bracket visualization

#### Tournaments Page
- **Add**: Banner ad at top
- **Add**: Rectangle ad after bracket visualization

#### Articles List Page
- **Add**: Banner ad at top
- **Add**: Rectangle ad after first 3 articles (desktop sidebar, mobile inline)

#### Article Detail Page
- **Add**: Banner ad at top
- **Add**: Rectangle ad after first paragraph (desktop sidebar, mobile inline)
- **Add**: Banner ad before comments section

#### Clubs List Page
- **Add**: Banner ad at top
- **Add**: Rectangle ad after first row of clubs (desktop sidebar, mobile inline)

#### Transactions Page
- **Add**: Banner ad at top
- **Add**: Rectangle ad after first 10 transactions (desktop sidebar, mobile inline)

#### Player Profile Page
- **Add**: Banner ad at top
- **Add**: Rectangle ad after player info section

### 5. Footer Ads
**Location**: Above footer, at bottom of page
**Type**: Banner (728x90)
**Pages**: All public pages
**Frequency**: One per page
**Priority**: Low - Lower visibility but still valuable

## Implementation Priority

### Phase 1: High Priority (Immediate)
1. Header ad component (reusable across all pages)
2. In-content ads on high-traffic pages:
   - Standings
   - Player Stats
   - Goalie Stats
   - Match Detail
   - Article Detail

### Phase 2: Medium Priority
1. Sidebar ads for desktop layouts
2. Footer ads
3. Additional in-content ads on remaining pages

### Phase 3: Advanced Features
1. Full-page interstitial ads (with session tracking)
2. Smart ad placement based on scroll position
3. Ad frequency capping per user

## Ad Types & Sizes

### Banner Ads
- Desktop: 728x90 (Leaderboard)
- Mobile: 320x50 (Mobile Banner)
- Responsive: Auto

### Rectangle Ads
- Desktop: 300x250 (Medium Rectangle)
- Mobile: 300x250 (Medium Rectangle)
- Responsive: Auto

### Skyscraper Ads (Sidebar)
- Desktop: 160x600 (Wide Skyscraper)
- Mobile: Hidden

### Full-Page Ads
- Responsive: Auto (covers viewport)

## User Experience Considerations

1. **Ad Density**: Maximum 3-4 ads per page (excluding header/footer)
2. **Content First**: Ads should not interrupt reading flow
3. **Mobile Optimization**: Sidebar ads hidden on mobile, replaced with inline ads
4. **Loading States**: Show placeholder while ads load
5. **Close Buttons**: Full-page ads must have clear close buttons
6. **Frequency Capping**: Limit full-page ads to once per session per page type

## Technical Implementation Notes

1. Create reusable ad components:
   - `HeaderAdComponent` - For navigation header
   - `SidebarAdComponent` - For desktop sidebars
   - `FullPageAdComponent` - For interstitials
   - `InContentAdComponent` - For inline content ads

2. Use AdSense service for all ad rendering
3. Implement lazy loading for ads below the fold
4. Track ad impressions (optional analytics)
5. Use localStorage for frequency capping

## Pages to Exclude from Ads

- Admin Panel (all routes under `/admin`)
- User Profile/Edit Profile (authenticated user pages)
- Inbox (authenticated user pages)
- Test pages

## Estimated Ad Count Per Page

| Page | Header | Sidebar | In-Content | Footer | Total |
|------|--------|---------|------------|--------|-------|
| Home | 1 | 0 | 3 | 1 | 5 |
| Standings | 1 | 1 | 2 | 1 | 5 |
| Player Stats | 1 | 1 | 2 | 1 | 5 |
| Goalie Stats | 1 | 1 | 2 | 1 | 5 |
| Match Detail | 1 | 0 | 2 | 1 | 4 |
| Article Detail | 1 | 1 | 2 | 1 | 5 |
| Schedule | 1 | 1 | 1 | 1 | 4 |
| Rankings | 1 | 1 | 1 | 1 | 4 |
| Club Detail | 1 | 0 | 2 | 1 | 4 |
| Clubs List | 1 | 1 | 1 | 1 | 4 |
| Playoffs | 1 | 0 | 1 | 1 | 3 |
| Tournaments | 1 | 0 | 1 | 1 | 3 |
| Transactions | 1 | 1 | 1 | 1 | 4 |
| Player Profile | 1 | 0 | 1 | 1 | 3 |

## Next Steps

1. Review and approve this plan
2. Create ad slot IDs in AdSense (if needed)
3. Implement header ad component
4. Implement sidebar ad component (desktop only)
5. Add in-content ads to high-priority pages
6. Test ad placement and user experience
7. Monitor ad performance and adjust as needed

