# BUG-012: Direct URL navigation doesn't work (hash-based routing mismatch)

- **Severity**: Medium
- **User**: All users
- **Page/Feature**: URL routing
- **Steps to Reproduce**:
  1. Log in as any user
  2. Navigate to Activities via sidebar click (URL becomes `...#/activities`)
  3. Copy the URL and paste into a new tab, or refresh the page
  4. Alternatively, type `https://secretary-backend.pages.dev/activities` directly
- **Expected**: The Activities page should load
- **Actual**: The Dashboard loads instead. The app uses hash-based routing (e.g., `#/activities`) but the URL path component (e.g., `/activities`) is not handled by the Flutter router. Direct navigation to paths without the hash fragment shows the Dashboard/default route.
- **Impact**:
  - Users cannot bookmark specific pages
  - Deep linking doesn't work
  - Browser forward/back may not work as expected
  - Sharing URLs to specific pages won't work
- **Notes**: The app appends hash routes (e.g., `#/activities`, `#/reports`) to the existing path URL, creating malformed URLs like `/activities#/activities`. The Flutter web router should either use hash-based routing consistently or path-based routing with proper server configuration.
