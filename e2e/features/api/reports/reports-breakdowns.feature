@api @reports
Feature: Reports Breakdowns
  As a user with reporting permissions
  I want to view activity breakdowns
  So that I can analyze activities by different dimensions

  Background:
    Given I am authenticated as "admin"

  # === ACTIVITY TYPE BREAKDOWN ===
  @smoke @requires-active-period
  Scenario: Get breakdown by activity type
    Given I have an active reporting period
    When I request the activity type breakdown
    Then the response status should be 200
    And the response should have property "byType"

  Scenario: Activity type breakdown with date filter
    When I request the activity type breakdown with:
      | dateFrom | 2025-01-01 |
      | dateTo   | 2025-01-31 |
    Then the response status should be 200
    And the response should have property "byType"

  # === ENTITY BREAKDOWN ===
  @permission
  Scenario: Hierarchy user gets entity breakdown
    Given I am authenticated as "pastor"
    When I request the entity breakdown
    Then the response status should be 200
    And the response should have property "byEntity"

  @permission
  Scenario: Regular user gets own entity breakdown
    Given I am authenticated as "missionary"
    When I request the entity breakdown
    Then the response status should be 200
    And the response should have property "byType"

  # === USER BREAKDOWN ===
  @permission
  Scenario: Hierarchy user gets user breakdown
    Given I am authenticated as "pastor"
    When I request the user breakdown
    Then the response status should be 200
    And the response should have property "byUser"

  # === TRENDS ===
  Scenario: Get activity trends over time
    When I request the trends report
    Then the response status should be 200
    And the response should have property "periods"

  # === COMPARISON ===
  @permission @skip @requires-multiple-periods
  Scenario: Compare entities within hierarchy
    Given I am authenticated as "pastor"
    When I request the entity comparison report
    Then the response status should be 200
