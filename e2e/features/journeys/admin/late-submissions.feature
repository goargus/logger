@journey @late-submissions
Feature: Handling Late Activity Submissions
  As an administrator
  I want to grant exceptions for late submissions
  So that team members can log activities they missed before the deadline

  Background:
    Given I am logged in as an administrator
    And a reporting period exists that has been locked

  Scenario: A missionary returns from travel and needs to log activities
    Given Carlos was traveling and missed the submission deadline
    When I grant Carlos an exception for the locked period
    Then Carlos can log his activities from the trip
    And other team members still cannot modify the period

  Scenario: Revoking an exception after activities are submitted
    Given Carlos has an exception for the current period
    And Carlos has finished submitting his late activities
    When I revoke Carlos's exception
    Then Carlos can no longer add activities to the period
    And his submitted activities remain in the system

  Scenario: Viewing who has exceptions for a period
    Given multiple team members have been granted exceptions
    When I review the exceptions for this period
    Then I should see a list of all team members with exceptions
    And I can manage each exception individually
