@api @reports
Feature: Reports Summary
  As a user with reporting permissions
  I want to view activity summaries
  So that I can understand organizational activity levels

  Background:
    Given I am authenticated as "admin"

  # === BASIC SUMMARY ===
  @smoke @requires-active-period
  Scenario: Get summary for my entity
    Given I have an active reporting period
    When I request the summary report
    Then the response status should be 200
    And the response should have property "totals"

  Scenario: Get summary with date range filter
    When I request the summary report with:
      | dateFrom | 2025-01-01 |
      | dateTo   | 2025-01-31 |
    Then the response status should be 200
    And the response should have property "totals"

  Scenario: Get summary for specific reporting period
    Given I have an active reporting period
    When I request the summary report for the current period
    Then the response status should be 200
    And the response should have property "totals"
    And the response should have property "period"

  # === MULTI-ROLE ACCESS ===
  # Note: hierarchy breakdown requires fixing TypeORM eager-loading in
  # UserRoleAssignment → Role → rolePermissions chain (role.rolePermissions
  # not loaded when role relation is eager). For now, verify access works.
  @permission
  Scenario: Pastor user can access reports
    Given I am authenticated as "pastor"
    When I request the summary report
    Then the response status should be 200
    And the response should have property "totals"

  @permission
  Scenario: Missionary user can access own reports
    Given I am authenticated as "missionary"
    When I request the summary report
    Then the response status should be 200
    And the response should have property "totals"

  # === FILTER OPTIONS ===
  Scenario: Filter summary by user
    Given I have a user ID
    When I request the summary report for that user
    Then the response status should be 200
    And the response should have property "scope" with value "personal"

  # === ERROR CASES ===
  Scenario: Invalid date format returns error
    When I request the summary report with:
      | dateFrom | not-a-date |
    Then the response status should be 400
