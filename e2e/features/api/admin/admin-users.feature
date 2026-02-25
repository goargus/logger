@api @admin
Feature: Admin User Management
  As a system administrator
  I want to manage users
  So that I can control access to the system

  Background:
    Given I am authenticated as "admin"

  # === LIST USERS ===
  @smoke
  Scenario: Admin lists all users
    When I request all users
    Then the response status should be 200
    And the response should be an array

  # === GET USER ===
  Scenario: Admin gets user by ID
    Given I have a user ID
    When I request the user by id
    Then the response status should be 200
    And the response should have property "id"
    And the response should have property "email"
    And the response should have property "username"

  # === CREATE USER ===
  Scenario: Admin creates a new user
    When I create a user with a unique email
    Then the response status should be 201
    And the response should have property "user"

  Scenario: Cannot create user with duplicate email
    Given there is a user with email "existing@test.local"
    When I create a user with:
      | email    | existing@test.local |
      | username | duplicate           |
    Then the response status should be 400

  # === UPDATE USER ===
  Scenario: Admin updates a user
    Given I have a user ID
    When I update the user with:
      | username | updateduser |
    Then the response status should be 200

  Scenario: Admin changes user entity
    Given I have a user ID
    And I have a different entity ID
    When I update the user with:
      | entity_id | different-entity |
    Then the response status should be 200

  # === DEACTIVATE USER ===
  Scenario: Admin deactivates a user
    Given I have an active user
    When I deactivate the user
    Then the response status should be 200
    And the user should be inactive

  Scenario: Admin reactivates a user
    Given I have an inactive user
    When I reactivate the user
    Then the response status should be 200
    And the user should be active

  # === PERMISSION BOUNDARY ===
  @permission
  Scenario: Non-admin cannot list all users
    Given I am authenticated as "missionary"
    When I request all users
    Then the response status should be 403

  @permission
  Scenario: Non-admin cannot create users
    Given I am authenticated as "missionary"
    When I create a user with:
      | email    | unauthorized@test.local |
      | username | unauthorized            |
    Then the response status should be 403

  @permission
  Scenario: Non-admin cannot update other users
    Given I am authenticated as "missionary"
    And I have another user's ID
    When I try to update the user
    Then the response status should be 403

  # === ERROR CASES ===
  Scenario: Cannot create user with invalid email
    When I create a user with:
      | email    | not-an-email |
      | username | baduser      |
    Then the response status should be 400

  Scenario: Cannot get non-existent user
    When I request user "00000000-0000-0000-0000-000000000000"
    Then the response status should be 404
