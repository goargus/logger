# BUG-005: Platform admin (Presidente de Unión) has no activity types available

- **Severity**: Medium
- **User**: daniel.contreras@uhn.test (Super Admin / Presidente de Unión)
- **Page/Feature**: Dashboard > Crear actividad dialog
- **Steps to Reproduce**:
  1. Log in as daniel.contreras@uhn.test
  2. Click "+ Agregar Actividad" on the Dashboard
  3. Observe "Tipo de actividad" section
- **Expected**: The platform admin should either:
  - Have activity types assigned to their role, OR
  - Not see the "+ Agregar Actividad" button if they're not meant to create activities
- **Actual**: Dialog opens showing "No hay tipos de actividad disponibles." - the admin role has no activity types configured, yet the create button is still visible on the dashboard.
- **Notes**: This is likely a data/configuration issue. The "Presidente de Unión" role needs activity types assigned, or the UI should conditionally hide the create button when the user's role has no authorized activity types.
