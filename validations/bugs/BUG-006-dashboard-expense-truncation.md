# BUG-006: Dashboard truncates expense amount, losing decimal precision

- **Severity**: Low
- **User**: obrero.campo1@uhn.test (Obrero Campo Copan)
- **Page/Feature**: Dashboard > Viatico Utilizado card
- **Steps to Reproduce**:
  1. Log in as obrero.campo1@uhn.test
  2. Observe "Viático Utilizado" card on Dashboard - shows "L.211"
  3. Navigate to Reportes > Mi Reporte - shows "$211.16" (exact amount)
- **Expected**: Dashboard should show the full amount with decimals (L.211.16 or at least L.211.50)
- **Actual**: Dashboard shows "L.211" (truncated/rounded), while reports show "$211.16"
- **Notes**: This is a formatting inconsistency. The dashboard stat cards don't show decimal places for currency amounts. While this may be a design choice for visual simplicity, it could cause confusion when comparing with the reports page which shows full precision.
