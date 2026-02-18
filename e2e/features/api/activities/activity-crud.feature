@api @activities
Feature: Activity CRUD Operations
  As a user
  I want to edit and delete my activities
  So that I can correct mistakes and remove unwanted entries

  Background:
    Given I am authenticated as "admin"

  # === CREATE ===
  @smoke
  Scenario: Create a new activity
    Given I have an authorized activity type
    When I create an activity with:
      | activityDate | 2025-01-15 |
      | description  | Test activity |
      | hasExpense   | false |
    Then the response status should be 201
    And the response should have property "id"
    And the response should have property "description" with value "Test activity"

  # === READ ===
  @smoke
  Scenario: Get my activities list
    When I request my activities
    Then the response status should be 200
    And the response should have property "items"
    And the response should have property "total"

  Scenario: Get a single activity
    Given I have an unlocked activity
    When I request the activity by id
    Then the response status should be 200
    And the response should have property "id"

  # === UPDATE ===
  @smoke
  Scenario: Edit an unlocked activity
    Given I have an unlocked activity
    When I update the activity with:
      | description | Updated description |
    Then the response status should be 200
    And the response should have property "description" with value "Updated description"

  Scenario: Edit activity date
    Given I have an unlocked activity
    When I update the activity with:
      | activityDate | 2025-01-20 |
    Then the response status should be 200
    And the response should have property "activityDate"

  Scenario: Edit activity expense
    Given I have an unlocked activity without expense
    When I update the activity with:
      | hasExpense    | true  |
      | expenseAmount | 50.00 |
    Then the response status should be 200
    And the response should have property "hasExpense"
    And the response should have property "expenseAmount"

  @skip @requires-locked-period
  Scenario: Fail to edit a locked activity
    Given I have a locked activity
    When I update the activity with:
      | description | Should fail |
    Then the response status should be 403

  # === DELETE ===
  @smoke
  Scenario: Delete an unlocked activity
    Given I have an unlocked activity
    When I delete the current activity
    Then the response status should be 200

  Scenario: Deleted activity is no longer in list
    Given I have an unlocked activity
    And I note the activity id
    When I delete the current activity
    And I request my activities
    Then the activity should not be in the list

  @skip @requires-locked-period
  Scenario: Fail to delete a locked activity
    Given I have a locked activity
    When I delete the current activity
    Then the response status should be 403

  # === EDGE CASES ===
  Scenario: Cannot edit non-existent activity
    When I try to update activity "00000000-0000-0000-0000-000000000000" with:
      | description | Should fail |
    Then the response status should be 404

  Scenario: Cannot delete non-existent activity
    When I try to delete activity "00000000-0000-0000-0000-000000000000"
    Then the response status should be 404

  # === PERMISSION BOUNDARY TESTS ===
  @permission @skip @requires-multiple-users
  Scenario: Missionary cannot see other users activities
    Given I am authenticated as "missionary"
    And another user has created an activity
    When I request my activities
    Then the response should only contain my activities

  @permission @skip @requires-multiple-users
  Scenario: Missionary cannot edit another users activity
    Given I am authenticated as "missionary"
    And another user has an activity with id "other-user-activity-id"
    When I try to update activity "other-user-activity-id" with:
      | description | Should fail |
    Then the response status should be 403

  @permission @skip @requires-multiple-users
  Scenario: Pastor can see subordinate activities
    Given I am authenticated as "pastor"
    And a subordinate user has created an activity
    When I request activities with hierarchy
    Then the response should include subordinate activities

  @permission @skip @requires-multiple-users
  Scenario: Pastor cannot modify subordinate activities
    Given I am authenticated as "pastor"
    And a subordinate user has an activity with id "subordinate-activity-id"
    When I try to update activity "subordinate-activity-id" with:
      | description | Should fail |
    Then the response status should be 403

  @permission
  Scenario: Unauthenticated request returns 401
    Given I am not authenticated
    When I request my activities
    Then the response status should be 401
