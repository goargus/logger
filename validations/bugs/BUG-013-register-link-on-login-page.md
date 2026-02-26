# BUG-013: Auth0 login page shows "Registrate" (Register) link

- **Severity**: Medium
- **User**: N/A (login page, unauthenticated)
- **Page/Feature**: Auth0 login page
- **Steps to Reproduce**:
  1. Navigate to https://secretary-backend.pages.dev/
  2. Observe the Auth0 login page
  3. Below the login button, see "¿No tienes cuenta? Regístrate"
- **Expected**: For an internal organizational tool, self-registration should be disabled. Users should only be created by administrators.
- **Actual**: A "Regístrate" (Register) link is visible on the login page, implying anyone can create an account.
- **Impact**: If self-registration is actually functional, unauthorized users could create accounts and potentially access the system. Even if the backend rejects unrecognized users, the registration link creates a misleading user experience and potential security concern.
- **Notes**: This needs to be disabled in the Auth0 dashboard settings (disable Sign Up in the Universal Login configuration or in the Application settings).
