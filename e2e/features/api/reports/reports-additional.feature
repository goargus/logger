@api @reports
Feature: Additional Report Endpoints
  As a user with reporting access
  I want to access various report types
  So that I can analyze different aspects of ministry activities

  Background:
    Given I am authenticated as "admin"

  # === COMPLIANCE REPORT ===
  @smoke
  Scenario: Get compliance report
    When I request the compliance report
    Then the response status should be 200

  # === RANKINGS REPORT ===
  Scenario: Get rankings report
    When I request the rankings report
    Then the response status should be 200

  # === EXPENSES REPORT ===
  Scenario: Get expenses report
    When I request the expenses report
    Then the response status should be 200

  # === USERS REPORT ===
  Scenario: Get users report
    When I request the users report
    Then the response status should be 200

  # === REPORT EXPORT ===
  Scenario: Export report as PDF
    When I request the report export
    Then the response status should be 200

  # === MONTHLY EXPENSES ===
  Scenario: Get monthly expenses stats
    When I request the monthly expenses
    Then the response status should be 200

  # === ADMIN DASHBOARD ===
  Scenario: Get admin dashboard data
    When I request the admin dashboard
    Then the response status should be 200 or 403

  # === PERMISSION BOUNDARY ===
  @permission
  Scenario: Missionary cannot access compliance report
    Given I am authenticated as "missionary"
    When I request the compliance report
    Then the response status should be 403

  @permission
  Scenario: Missionary cannot access users report
    Given I am authenticated as "missionary"
    When I request the users report
    Then the response status should be 403

  @permission
  Scenario: Missionary cannot access admin dashboard
    Given I am authenticated as "missionary"
    When I request the admin dashboard
    Then the response status should be 403
