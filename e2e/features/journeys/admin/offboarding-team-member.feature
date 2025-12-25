@journey @offboarding
Feature: Offboarding a Team Member
  As an administrator
  I want to properly remove departing team members
  So that access is revoked but historical data is preserved

  Background:
    Given I am logged in as an administrator

  Scenario: Suspending a team member temporarily
    Given "Maria Santos" is an active team member
    When I suspend Maria's account
    Then Maria should not be able to log in
    And Maria's historical activities remain visible
    And Maria should appear in the suspended users list

  Scenario: Archiving a departed team member
    Given "Juan Rodriguez" has left the organization
    When I archive Juan's account
    Then Juan's account should be marked as archived
    And Juan's archived_at date should be recorded
    And Juan's historical activities remain in the system

  Scenario: Reactivating a suspended user
    Given "Maria Santos" was temporarily suspended
    And Maria is returning to active duty
    When I reactivate Maria's account
    Then Maria should be able to log in again
    And Maria should be able to resume logging activities

  Scenario: Viewing a departed member's activity history
    Given "Juan Rodriguez" has been archived
    When I view Juan's profile and activity history
    Then I should see all activities Juan logged
    And the records should show Juan is no longer active

  Scenario: Reassigning responsibilities before departure
    Given "Pedro Garcia" is leaving but has ongoing responsibilities
    When I transfer Pedro's entity assignment to "Ana Martinez"
    And I archive Pedro's account
    Then Ana should now be associated with Pedro's former entity
    And Pedro's historical data remains unchanged

  Scenario: Bulk archiving inactive users
    Given there are multiple users who have not logged in for a year
    When I review the list of inactive users
    Then I should see users sorted by last activity date
    And I can archive multiple users at once
