@journey @reports
Feature: Reviewing Ministry Reports
  As a pastor or administrator
  I want to view aggregated activity reports
  So that I can track ministry effectiveness and team engagement

  Background:
    Given I am logged in as an administrator
    And there are completed reporting periods with activities

  Scenario: Viewing activity summary for a period
    When I request the summary report for my entity
    Then I should see total activities logged
    And I should see total hours worked
    And I should see the number of active team members

  Scenario: Breaking down activities by type
    When I request the breakdowns report
    Then I should see activities grouped by activity type
    And I should see activities grouped by entity
    And I should see activities grouped by user

  Scenario: Checking team engagement
    When I request the engagement report
    Then I should see the list of users with engagement data
    And I should see the engagement summary

  Scenario: Viewing activity trends over time
    Given there are multiple completed reporting periods
    When I request the trends report
    Then I should see how activity counts changed over periods
    And I should be able to identify patterns in ministry work

  Scenario: Comparing current period with previous
    Given there is a previous completed period
    When I request the comparison report
    Then I should see the difference in activity counts
    And I should see which metrics improved or declined

  Scenario: Identifying top performers and areas of concern
    When I request the rankings report
    Then I should see the top performing team members
    And I should see team members with lowest engagement
    And I should see inactive users who need follow-up

  Scenario: Reviewing expense reports
    Given team members have logged activities with expenses
    When I request the expenses report
    Then I should see expenses broken down by activity type
    And I should see expenses broken down by entity
    And I should see total expenses for the period
