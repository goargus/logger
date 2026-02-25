# BUG-001: Reports page shows raw "Estado: custom" instead of translated status

- **Severity**: Medium
- **User**: daniel.contreras@uhn.test (Super Admin)
- **Page/Feature**: Reports > Mi Reporte
- **Steps to Reproduce**:
  1. Log in as daniel.contreras@uhn.test
  2. Navigate to Reportes
  3. View "Mi Reporte" tab with Mensual period type
  4. Observe the "Estado:" field under "Periodo: Febrero 2026"
- **Expected**: Status should show a meaningful, localized label (e.g., "Activo", "Cerrado", "Sin periodo")
- **Actual**: Shows "Estado: custom" - appears to be a raw/untranslated internal value
- **Screenshot**: Reports page with "Estado: custom" visible
- **Notes**: This likely comes from the reporting period status or type being passed through without localization. The word "custom" is in English, inconsistent with the Spanish UI.
