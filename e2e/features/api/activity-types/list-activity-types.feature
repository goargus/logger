@api @activity-types
Feature: List Activity Types
  As a user
  I want to see available activity types
  So that I can select the correct type when creating activities

  Scenario: Get list of activity types (public)
    When I request the list of activity types
    Then the response status should be 200
    And the response should be an array
    And each item should have property "id"
    And each item should have property "name"

  Scenario: Get authorized activity types as authenticated user
    Given I am authenticated as "admin"
    When I request my authorized activity types
    Then the response status should be 200
    And the response should be an array
