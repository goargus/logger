# BUG-003: User report table columns truncated on right side

- **Severity**: Low
- **User**: daniel.contreras@uhn.test (Super Admin)
- **Page/Feature**: Reports > Entidad > Reporte de Usuarios
- **Steps to Reproduce**:
  1. Log in as daniel.contreras@uhn.test
  2. Navigate to Reportes > Entidad tab
  3. Scroll down to "Reporte de Usuarios" table
  4. Observe the table at 1280px viewport width
- **Expected**: All columns should be visible or the table should be horizontally scrollable
- **Actual**: The third column (and possibly more) after "Usuario" and "Email" is truncated/cut off with only partial characters visible (showing "A", "C", "U" etc.)
- **Notes**: The truncated column likely shows Entity or Role info. At 1280px viewport width the table doesn't fit. Either needs horizontal scroll, responsive column sizing, or a wider minimum.
