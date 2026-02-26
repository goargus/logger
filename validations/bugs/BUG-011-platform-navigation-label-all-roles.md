# BUG-011: Sidebar shows "Platform Navigation" regardless of user role

- **Severity**: Low
- **User**: All users
- **Page/Feature**: Sidebar navigation
- **Steps to Reproduce**:
  1. Log in as any user (admin, association admin, or field worker)
  2. Observe the sidebar navigation label
- **Expected**: The navigation label should be contextual to the user's level:
  - Platform admin: "Platform Navigation" (correct)
  - Association admin: "Asociación Navigation" or similar
  - Field worker: "Campo Navigation" or simply no label
- **Actual**: All users see "Platform Navigation" regardless of their role in the hierarchy
- **Notes**: This is a minor labeling issue. The label "Platform" implies platform-level access, which could be confusing for field workers who only have access to their own activities.
