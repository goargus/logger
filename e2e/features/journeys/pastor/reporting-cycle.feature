@journey @reporting-cycle
Feature: Monthly Reporting Cycle
  As an administrator
  I want to manage the reporting cycle for my organization
  So that we can track and review ministry activities systematically

  Background:
    Given I am logged in as an administrator
    And my organization has team members who log activities

  Scenario: Opening a new reporting period for the month
    Given there are no active reporting periods
    When I create a reporting period for "January 2025"
    Then team members should be able to start logging activities
    And the period should be visible to all team members

  Scenario: Closing the month and reviewing activities
    Given the "January 2025" reporting period is active
    And team members have logged their activities
    When I lock the reporting period
    Then no more activities can be added to this period
    And I can review all activities that were logged

  Scenario: Reopening a period to allow corrections
    Given the "January 2025" reporting period has been locked
    When I unlock the reporting period
    Then team members can make corrections to their activities
    And the period returns to active status

  @wip
  Scenario: Permanently closing a period for archival
    # Note: This scenario describes a desired feature not yet implemented
    # Currently 'close' just calls 'lock' and locked periods can be unlocked
    Given the "January 2025" reporting period has been reviewed
    When I close the reporting period permanently
    Then the period cannot be reopened
    And it becomes part of the historical record
