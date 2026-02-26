# BUG-009: No visible logout mechanism in the UI

- **Severity**: ~~Medium~~ **FALSE POSITIVE**
- **User**: All users
- **Page/Feature**: Sidebar / User profile area
- **Resolution**: Logout IS implemented. The user profile area at the bottom of the sidebar is a `PopupMenuButton` that shows a "Cerrar sesion" option with a logout icon (`sidebar_nav.dart:241-269`). This was not detected during Playwright browser testing because Flutter renders everything to a `<canvas>` element, and Playwright cannot interact with Flutter's popup menus through the DOM.
- **Original Report**:
  - **Steps to Reproduce**: Log in, click user profile area in sidebar
  - **Expected**: Logout menu appears
  - **Actual (Playwright)**: No menu appeared - canvas click didn't trigger the PopupMenuButton
  - **Actual (Real Browser)**: PopupMenuButton opens, showing "Cerrar sesion" logout option
- **Code Location**: `frontend/lib/widgets/nav/sidebar_nav.dart:241-269`
- **Verified By**: Code review and widget test infrastructure (test/integration/sidebar_nav_test.dart)
