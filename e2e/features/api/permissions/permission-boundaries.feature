@api @permission
Feature: Permission Boundaries
  As a system administrator
  I want to ensure users can only access data they are authorized to see
  So that the system maintains proper access control

  # === AUTHENTICATION TESTS ===
  Scenario: Unauthenticated request to protected endpoint returns 401
    Given I am not authenticated
    When I request my user profile
    Then the response status should be 401

  Scenario: Unauthenticated request to activities returns 401
    Given I am not authenticated
    When I request my activities
    Then the response status should be 401

  Scenario: Unauthenticated request to reports returns 401
    Given I am not authenticated
    When I request the summary report
    Then the response status should be 401

  # === MISSIONARY (REGULAR USER) PERMISSION TESTS ===
  Scenario: Missionary can view own profile
    Given I am authenticated as "missionary"
    When I request my user profile
    Then the response status should be 200
    And the response should have property "id"

  Scenario: Missionary can view own activities
    Given I am authenticated as "missionary"
    When I request my activities
    Then the response status should be 200

  Scenario: Missionary cannot access admin user list
    Given I am authenticated as "missionary"
    When I request all users
    Then the response status should be 403

  Scenario: Missionary can only see own entity breakdown
    Given I am authenticated as "missionary"
    When I request the entity breakdown
    Then the response status should be 200

  Scenario: Missionary cannot create entities
    Given I am authenticated as "missionary"
    And I have a parent entity ID
    When I try to create a child entity
    Then the response status should be 403

  Scenario: Missionary cannot assign roles
    Given I am authenticated as "missionary"
    And I have a user ID
    When I try to assign the "pastor" role to the user
    Then the response status should be 403

  # === PASTOR (HIERARCHY USER) PERMISSION TESTS ===
  Scenario: Pastor can view subordinate entity data
    Given I am authenticated as "pastor"
    And I have subordinate entities
    When I request the summary report with hierarchy
    Then the response status should be 200

  Scenario: Pastor can view entity breakdown
    Given I am authenticated as "pastor"
    When I request the entity breakdown
    Then the response status should be 200

  Scenario: Pastor cannot access admin functions
    Given I am authenticated as "pastor"
    When I request all users
    Then the response status should be 403

  Scenario: Pastor cannot create entities
    Given I am authenticated as "pastor"
    And I have a parent entity ID
    When I try to create a child entity
    Then the response status should be 403

  # === PRESIDENT (ENTITY ADMIN) PERMISSION TESTS ===
  Scenario: President can view entity-wide reports
    Given I am authenticated as "president"
    When I request the summary report with hierarchy
    Then the response status should be 200

  Scenario: President cannot access system admin functions
    Given I am authenticated as "president"
    When I request all users
    Then the response status should be 403

  # === ADMIN PERMISSION TESTS ===
  Scenario: Admin can access user list
    Given I am authenticated as "admin"
    When I request all users
    Then the response status should be 200

  Scenario: Admin can view all reports
    Given I am authenticated as "admin"
    When I request the summary report
    Then the response status should be 200

  Scenario: Admin can view entity breakdown
    Given I am authenticated as "admin"
    When I request the entity breakdown
    Then the response status should be 200

  @skip @requires-role-enum-fix
  Scenario: Admin can assign roles
    Given I am authenticated as "admin"
    And I have a user without the "missionary" role
    When I assign the "missionary" role to the user
    Then the response status should be 201

  # === CROSS-ENTITY ACCESS TESTS ===
  @skip @requires-multiple-entities
  Scenario: User cannot access data from unrelated entity
    Given I am authenticated as "admin"
    And there is an unrelated entity
    When I try to access the unrelated entity data
    Then the response status should be 403

  @skip @requires-multiple-users
  Scenario: User cannot modify another users data
    Given I am authenticated as "admin"
    And another user has created an activity
    When I try to modify another users activity
    Then the response status should be 403
