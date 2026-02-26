# Validation Test Matrix

**Date**: 2026-02-17
**URL**: https://secretary-backend.pages.dev/
**Password**: TempPass123! (all users)

## Test Users

| User | Actual Role | Entity | Login | Tested |
|------|-----------|--------|-------|--------|
| daniel.contreras@uhn.test | Presidente de Unión | Unión Hondureña | PASS | Yes |
| admin.asoc.noroccidental@uhn.test | Admin Asociación | Asoc. Nor-occidental | PASS | Yes |
| admin.asoc.central@uhn.test | Admin Asociación | Asoc. Central | Not tested | No |
| admin.asoc.nororiental@uhn.test | Admin Asociación | Asoc. Nor-oriental | Not tested | No |
| obrero.campo1@uhn.test | Misionero / Anciano | Campo Copán | PASS | Yes |
| obrero.campo2@uhn.test | Field Worker | Campo Tegucigalpa | Not tested | No |
| obrero.campo3@uhn.test | Field Worker | Campo San Pedro Sula | Not tested | No |

## Test Areas

| Area | Admin | Assoc Admin | Field Worker | Status |
|------|-------|------------|-------------|--------|
| 1. Authentication | PASS | PASS | PASS | Done (BUG-008,~~009~~,013) |
| 2. Dashboard | PASS* | PASS | PASS | Done (BUG-005,006,007,011) |
| 3. Activities CRUD | FAIL | - | PASS | Partial (BUG-004,005) |
| 4. Activity Types | FAIL* | - | PASS | Partial (admin has none) |
| 5. Reporting Periods | - | - | - | Not tested |
| 6. Reports - Personal | PASS* | PASS* | PASS* | Done (BUG-001,002) |
| 7. Reports - Entity | PASS | PASS | N/A | Done |
| 8. Entity Management | - | - | - | Not tested (no UI) |
| 9. User Management | - | - | - | Not tested (no UI) |
| 10. Permission Boundaries | PASS | PASS | PASS | Done |

*PASS with noted bugs

## Bug Count

| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 1 |
| Medium | 3 (was 4, BUG-009 is false positive) |
| Low | 8 |
| False Positive | 1 (BUG-009) |
| **Total Real Bugs** | **12** |

## Root Causes Identified via Code Review

| Bug | Root Cause File:Line | Issue |
|-----|---------------------|-------|
| BUG-001 | `reports_view.dart:220` | Raw API status displayed, needs label mapping |
| BUG-002 | `reports_view.dart:274-284` | Missing `currencySymbol` prop on SummaryCards and ComparisonBreakdownTable |
| BUG-004 | `activity_form_dialog.dart:158` | `_selectedType!.id` crashes when types list empty (no dropdown = no validator) |
| BUG-009 | N/A | False positive - logout exists at `sidebar_nav.dart:241-269` |
| BUG-011 | `sidebar_nav.dart:161` | Hardcoded 'Platform Navigation' text |
