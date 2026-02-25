# BUG-010: CORS error when loading user avatar from Gravatar

- **Severity**: Low
- **User**: All users
- **Page/Feature**: User avatar loading
- **Steps to Reproduce**:
  1. Log in as any user
  2. Open browser developer console
  3. Observe CORS error
- **Expected**: Avatar should either load successfully or gracefully fall back to a default avatar without errors
- **Actual**: Console shows CORS error:
  ```
  Access to XMLHttpRequest at 'https://s.gravatar.com/avatar/...' from origin 'https://secretary-backend.pages.dev' has been blocked by CORS policy
  ```
  Followed by: `Failed to load resource: net::ERR_FAILED`
- **Notes**: The app attempts to load user avatars from Gravatar but the request is blocked by CORS policy. The user profile shows a generic person icon, so the fallback works visually, but the CORS errors generate unnecessary noise in the console. Either proxy the gravatar request through the backend or don't attempt the client-side fetch.
