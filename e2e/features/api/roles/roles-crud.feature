@api @roles
Feature: Roles CRUD Operations
  As an administrator
  I want to manage user roles
  So that I can control access permissions within the organization

  Background:
    Given I am authenticated as "admin"

  # === READ ===
  @smoke
  Scenario: List available roles
    When I request all roles
    Then the response status should be 200
    And the response should be an array
    And each item should have property "name"

  Scenario: Get role by ID
    Given I have a role ID
    When I request the role by id
    Then the response status should be 200
    And the response should have property "id"
    And the response should have property "name"

  @smoke
  Scenario: List my role assignments
    When I request my role assignments
    Then the response status should be 200
    And the response should be an array

  # === ROLE ASSIGNMENT ===
  @skip @requires-role-enum-fix
  Scenario: Admin assigns a role to a user
    Given I have a user without the "missionary" role
    When I assign the "missionary" role to the user
    Then the response status should be 201 or 409
    And the user should have the "missionary" role

  @skip @requires-role-removal-endpoint
  Scenario: Admin removes a role assignment
    Given I have a user with the "missionary" role
    When I remove the "missionary" role from the user
    Then the response status should be 200
    And the user should not have the "missionary" role

  # === PERMISSION BOUNDARY ===
  @permission
  Scenario: Regular user cannot assign roles
    Given I am authenticated as "missionary"
    And I have a user ID
    When I try to assign the "pastor" role to the user
    Then the response status should be 403

  @permission
  Scenario: Regular user cannot remove roles
    Given I am authenticated as "missionary"
    And I have a user ID
    When I try to remove the "missionary" role from the user
    Then the response status should be 403

  # === ERROR CASES ===
  Scenario: Cannot assign non-existent role
    Given I have a user ID
    When I try to assign role "nonexistent" to the user
    Then the response status should be 400

  Scenario: Cannot assign role to non-existent user
    When I try to assign the "missionary" role to user "00000000-0000-0000-0000-000000000000"
    Then the response status should be 400 or 404
