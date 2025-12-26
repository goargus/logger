@journey @entity-hierarchy
Feature: Managing Organizational Structure
  As a platform administrator
  I want to organize entities hierarchically
  So that reporting and permissions flow correctly

  Background:
    Given I am logged in as an administrator

  Scenario: Viewing the organizational hierarchy
    Given the organization has a Platform with Unions and Associations
    When I view the organizational structure
    Then I should see the complete hierarchy tree
    And each level should show its child entities

  Scenario: Creating a new Union under the Platform
    Given the Platform entity exists
    When I create a Union named "North Region"
    And I set its parent to the Platform
    Then the Union should appear under the Platform
    And it should be ready to contain Associations

  Scenario: Creating an Association under a Union
    Given a Union named "North Region" exists
    When I create an Association named "Mountain District"
    And I set its parent to "North Region"
    Then the Association should appear under "North Region"
    And it should be ready to contain Fields

  Scenario: Creating a Field under an Association
    Given an Association named "Mountain District" exists
    When I create a Field named "Valley Church"
    And I set its parent to "Mountain District"
    Then the Field should appear under "Mountain District"
    And team members can be assigned to this Field

  Scenario: Updating an entity's details
    Given a Field named "Valley Church" exists
    When I update its location to "123 Valley Road"
    And I update its description to "Main congregation in the valley"
    Then the changes should be saved
    And the entity should reflect the new details

  Scenario: Deactivating an entity
    Given a Field named "Closed Mission" exists
    And it has no active team members
    When I deactivate the entity
    Then it should be marked as inactive
    And it should not appear in active entity lists

  Scenario: Viewing entities at a specific level
    Given multiple Unions exist under the Platform
    When I list all Unions
    Then I should see all Union-level entities
    And I can drill down into each Union's children
