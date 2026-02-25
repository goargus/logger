# BUG-004: "Null check operator used on a null value" error when saving activity without type

- **Severity**: High
- **User**: daniel.contreras@uhn.test (Super Admin / Presidente de Unión)
- **Page/Feature**: Dashboard > Crear actividad dialog
- **Steps to Reproduce**:
  1. Log in as daniel.contreras@uhn.test
  2. Click "+ Agregar Actividad" on the Dashboard
  3. Dialog shows "No hay tipos de actividad disponibles." for "Tipo de actividad"
  4. Click "Guardar" (Save) button
- **Expected**: Either:
  - The "Guardar" button should be disabled when no activity type is selected
  - A user-friendly validation error like "Seleccione un tipo de actividad" should appear
  - Ideally, if the role has no activity types, the "+ Agregar Actividad" button shouldn't appear at all
- **Actual**: Raw Dart/Flutter exception displayed in red banner: "Null check operator used on a null value"
- **Root Cause**: The code uses a Dart null check operator (`!`) on the selected activity type value, which is null when no activity types are available for the role. The error is not caught and surfaces directly to the UI.
- **Impact**:
  - Exposes internal error details to users (poor UX, potential info leakage)
  - The "Presidente de Unión" role has no activity types assigned, yet the UI still shows the create button
  - This is a validation gap - form submission should be prevented when required fields cannot be filled
