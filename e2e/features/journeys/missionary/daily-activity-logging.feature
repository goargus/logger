@journey @activity-logging
Feature: Logging Ministry Activities
  As a missionary
  I want to record my daily ministry activities
  So that my work is documented and reportable

  Background:
    Given I am logged in as a missionary
    And there is an active reporting period

  Scenario: Logging a home visit
    When I log a "Home Visit" activity
    And I add details about the visit
    Then the activity should be saved successfully
    And it should appear in my activity list for this period

  Scenario: Logging multiple activities in one session
    When I log a "Home Visit" activity
    And I log a "Bible Study" activity
    And I log a "Community Event" activity
    Then I should have 3 activities recorded for this period
    And each activity should have the correct type

  Scenario: Viewing my activity history for the current period
    Given I have logged several activities this period
    When I view my activities for the current period
    Then I should see all my logged activities
    And they should be organized by date

  Scenario: Editing an activity before the period locks
    Given I have logged a "Home Visit" activity with incorrect details
    When I update the activity details
    Then the activity changes should be saved
    And the activity should reflect the corrections

  Scenario: Cannot edit activities after period locks
    Given I have logged activities in a period
    And the reporting period has been locked
    When I try to edit one of my activities
    Then the edit should be rejected
    And I should be informed the period is locked

  Scenario: Deleting an activity I logged by mistake
    Given I have logged an activity by mistake
    When I delete the activity
    Then it should be removed from my activity list
    And my activity count should decrease by one
