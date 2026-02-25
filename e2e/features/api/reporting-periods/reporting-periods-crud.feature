@api @reporting-periods
Feature: Reporting Periods CRUD Operations
  As a user
  I want to manage reporting periods
  So that I can organize activities into time-bounded periods

  Background:
    Given I am authenticated as "admin"

  # === READ ===
  @smoke
  Scenario: List reporting periods for my entity
    When I request my reporting periods
    Then the response status should be 200
    And the response should be an array

  @smoke
  Scenario: Get active period from list
    When I request my reporting periods
    Then the response status should be 200
    And the response should be an array

  Scenario: Get a specific reporting period
    Given I have an active reporting period
    When I request the reporting period by id
    Then the response status should be 200
    And the response should have property "id"
    And the response should have property "startDate"
    And the response should have property "endDate"
    And the response should have property "status"

  # === ADMIN OPERATIONS ===
  @skip @requires-clean-periods
  Scenario: Admin creates a new reporting period
    Given the current period is locked
    When I create a reporting period with:
      | startDate | 2025-02-01 |
      | endDate   | 2025-02-14 |
    Then the response status should be 201
    And the response should have property "id"
    And the response should have property "status" with value "active"

  @skip @requires-clean-periods
  Scenario: Admin locks a reporting period
    Given I have an active reporting period
    When I lock the current reporting period
    Then the response status should be 200
    And the response should have property "status" with value "locked"

  # === ACTIVITY CONSTRAINTS ===
  @permission @skip @requires-locked-period-with-data
  Scenario: Cannot modify activities in a locked period
    Given I have a locked reporting period
    And I have an activity in the locked period
    When I try to update the activity
    Then the response status should be 403

  @permission @skip @requires-locked-period-with-data
  Scenario: Cannot create activities in a locked period
    Given I have a locked reporting period
    When I try to create an activity in the locked period
    Then the response status should be 403

  # === ERROR CASES ===
  Scenario: Cannot have multiple active periods
    Given I have an active reporting period
    When I create a reporting period with:
      | startDate | 2025-03-01 |
      | endDate   | 2025-03-14 |
    Then the response status should be 409
