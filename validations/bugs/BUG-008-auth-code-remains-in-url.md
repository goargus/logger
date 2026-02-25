# BUG-008: Auth0 authorization code remains in URL after login

- **Severity**: Low
- **User**: All users
- **Page/Feature**: Authentication / URL handling
- **Steps to Reproduce**:
  1. Navigate to https://secretary-backend.pages.dev/
  2. Log in with any user
  3. Observe the URL after successful login
- **Expected**: URL should be clean (e.g., `https://secretary-backend.pages.dev/` or `https://secretary-backend.pages.dev/#/dashboard`)
- **Actual**: URL retains the auth code and state parameters: `?code=FLexVp-5Rk9N-KI0wgDKS0p1D1VgFJUlY3-d-g5_H_6_z&state=1771379198054`
- **Notes**: While not a security vulnerability (the code is single-use and expired), it's untidy. The app should clean the URL after exchanging the authorization code for tokens. Users who bookmark or share the URL will get an invalid code parameter. Could use `window.history.replaceState()` to clean up.
