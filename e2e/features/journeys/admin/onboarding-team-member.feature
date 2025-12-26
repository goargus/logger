@journey @onboarding
Feature: Onboarding a New Team Member
  As an administrator
  I want to bring new team members into the system
  So that they can participate in ministry tracking

  Background:
    Given I am logged in as an administrator

  Scenario: A new missionary joins the organization
    When I create an account for "Ana Martinez" with email "ana.martinez@ministry.org"
    And I assign Ana the Missionary role
    Then Ana should have access to the system
    And Ana should be able to log activities

  Scenario: Setting up a new youth leader
    Given the "Youth Leader" role exists in our organization
    When I create an account for "David Chen" with email "david.chen@ministry.org"
    And I assign David as a Youth Leader
    Then David should appear in the list of Youth Leaders
    And David should be ready to track youth ministry activities
