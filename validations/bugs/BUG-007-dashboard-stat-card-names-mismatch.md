# BUG-007: Dashboard stat card names don't match activity type names

- **Severity**: Low
- **User**: obrero.campo1@uhn.test (Obrero Campo Copan)
- **Page/Feature**: Dashboard stat cards vs Activity types
- **Steps to Reproduce**:
  1. Log in as obrero.campo1@uhn.test
  2. Dashboard shows stat cards: "Visitas Misioneras" (8) and "Estudios Bíblicos" (4->5)
  3. Open Crear actividad dialog - activity types include: Predicaciones, Estudios bíblicos, Visitas a miembros, Visitas a interesados, etc.
  4. Open Reportes > Mi Reporte - shows Predicaciones (8), Estudios bíblicos (5), etc.
- **Expected**: Dashboard card names should match the actual activity type names used elsewhere
- **Actual**: Dashboard shows "Visitas Misioneras" while the actual activity type is likely "Predicaciones" or another type. Also "Estudios Bíblicos" (capital B) on dashboard vs "Estudios bíblicos" (lowercase b) in forms.
- **Notes**: The dashboard appears to use different/consolidated names for the stat cards vs the actual activity type names used in forms and reports. This naming mismatch could confuse users. It also raises the question: are the dashboard stats aggregating multiple activity types into these two cards?
