@journey @organization-setup
Feature: Setting Up the Organization
  As an administrator
  I want to configure roles and activity types
  So that my organization can track ministry work appropriately

  Background:
    Given I am logged in as an administrator

  Scenario: Defining roles for a new ministry organization
    When I create a "Missionary" role for field workers
    And I create a "Youth Leader" role for youth ministry
    And I create a "Elder" role for church leadership
    Then all three roles should be available for assignment
    And I can assign team members to these roles

  Scenario: Configuring activity types for tracking
    When I create a "Home Visits" activity type
    And I create a "Bible Studies" activity type
    And I create a "Community Events" activity type
    Then team members can log these types of activities
    And activities will be categorized appropriately

  Scenario: Updating organization configuration over time
    Given the organization has existing roles and activity types
    When I update the "Bible Studies" description to be more specific
    And I remove an unused "Temporary" role
    Then the changes should be reflected immediately
    And existing data should not be affected
