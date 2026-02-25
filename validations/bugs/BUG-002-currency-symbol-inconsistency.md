# BUG-002: Currency symbol inconsistency between Dashboard and Reports

- **Severity**: Medium
- **User**: daniel.contreras@uhn.test (Super Admin)
- **Page/Feature**: Dashboard vs Reports > Mi Reporte
- **Steps to Reproduce**:
  1. Log in as daniel.contreras@uhn.test
  2. View Dashboard - "Viatico Utilizado" card shows "L.0" (Lempiras)
  3. Navigate to Reportes > Mi Reporte
  4. View "Gastos" stat card - shows "$0.00" (Dollar sign)
- **Expected**: Both should use the same currency symbol. The entity's currency should be consistently applied (Lempiras "L." for Honduran context).
- **Actual**: Dashboard uses "L." (Lempiras) while Reports uses "$" (Dollar sign)
- **Notes**: The entity has a currency_symbol field. Dashboard appears to use it correctly but Reports uses a hardcoded "$" or a different default. This could confuse users and misrepresent financial data.
