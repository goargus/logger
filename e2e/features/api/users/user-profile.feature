@api @users
Feature: User Profile
  As an authenticated user
  I want to access my profile
  So that I can see my information

  @smoke
  Scenario: Get current user profile
    Given I am authenticated as "admin"
    When I request my user profile
    Then the response status should be 200
    And the response should have property "email"
    And the response should have property "username"

  @smoke
  Scenario: Fail to get profile without authentication
    Given I am not authenticated
    When I request my user profile
    Then the response status should be 401
