@journey @multi-entity-roles
Feature: Managing Roles Across Entities
  As an administrator
  I want to assign users roles in multiple entities
  So that leaders can oversee multiple organizational units

  Background:
    Given I am logged in as an administrator
    And multiple entities exist in the hierarchy

  Scenario: Assigning a pastor to oversee multiple fields
    Given "Pastor David" exists in the system
    And there are three Fields: "North Church", "South Church", and "East Church"
    When I assign Pastor David the Pastor role for "North Church"
    And I assign Pastor David the Pastor role for "South Church"
    And I assign Pastor David the Pastor role for "East Church"
    Then Pastor David should have Pastor access to all three churches
    And he should appear in the users list for each entity

  Scenario: Bulk assigning a role across multiple entities
    Given "Regional Director Maria" needs oversight of multiple Associations
    And there are five Associations in the region
    When I bulk assign Maria the Executive role for all five Associations
    Then Maria should have one assignment per Association
    And I should see all five assignments in her profile

  Scenario: Viewing a user's complete role matrix
    Given "Multi-role User Carlos" has roles in several entities
    When I view Carlos's role assignments
    Then I should see all his roles across all entities
    And each assignment should show the entity and role
    And I should see when each assignment started

  Scenario: Finding all entities where a user has a specific role
    Given "Pastor Elena" has the Pastor role in multiple Fields
    When I query for entities where Elena has the Pastor role
    Then I should see all Fields where Elena serves as Pastor
    And the list should not include entities where she has other roles

  Scenario: Listing all users with a role at an entity
    Given "Mountain District" has several team members
    When I list users assigned to "Mountain District"
    Then I should see all users with any role at that entity
    And I should see each user's specific role

  Scenario: Ending a role assignment with a date
    Given Pastor David is stepping down from "South Church"
    When I set an end date on his Pastor assignment for "South Church"
    Then that assignment should show as ending
    And his other assignments should remain active

  Scenario: Removing a role assignment completely
    Given Pastor David's temporary assignment to "East Church" is over
    When I delete his Pastor assignment for "East Church"
    Then he should no longer appear in "East Church" user list
    And his assignments to other churches remain unchanged

  Scenario: Preventing duplicate role assignments
    Given "Ana" already has the Missionary role at "Valley Field"
    When I try to assign Ana the Missionary role at "Valley Field" again
    Then the system should reject the duplicate assignment
    And Ana should still have exactly one Missionary assignment there
