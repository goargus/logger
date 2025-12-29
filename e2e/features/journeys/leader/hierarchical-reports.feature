@journey @hierarchy-reports
Feature: Hierarchical Reports Navigation
  As a Union President or executive leader
  I want to view aggregated reports from all downstream entities
  So that I can monitor ministry activities across my organizational scope

  Background:
    Given I am logged in as an administrator
    And the test hierarchy exists with Union -> Association -> Field structure
    And there are activities logged across multiple hierarchy entities

  # --- Hierarchy Navigation ---

  @hierarchy-tree
  Scenario: Viewing entity hierarchy tree
    When I request the hierarchy tree for my entity
    Then I should see a nested tree structure
    And I should see all descendant entities in the tree
    And the tree root should be my entity

  @hierarchy-tree
  Scenario: Drilling down to a child entity
    When I request the hierarchy tree for my entity
    And I select a child entity from the tree
    Then I should be able to request the tree for that child entity
    And the child tree should only contain its descendants

  @hierarchy-children
  Scenario: Level-by-level navigation via direct children
    When I request the direct children of my entity
    Then I should see only immediate children
    And each child should have its own entity details

  @hierarchy-descendants
  Scenario: Getting all descendants flat list
    When I request all descendants of my entity
    Then I should receive a flat list of all descendant entities
    And the list should include entities from all levels below

  # --- Aggregated Reports ---

  @hierarchy-reports
  Scenario: Viewing aggregated summary across hierarchy
    When I request the summary report with hierarchy breakdown enabled
    Then the response should be successful
    And I should see totals aggregated from all descendant entities
    And I should see a hierarchy breakdown array

  @hierarchy-reports
  Scenario: Hierarchy breakdown shows entity metrics
    When I request the summary report with hierarchy breakdown enabled
    Then each entity in the hierarchy breakdown should have:
      | field           |
      | entityId        |
      | entityName      |
      | entityType      |
      | activities      |
      | expenses        |
      | usersExpected   |
      | usersSubmitted  |
      | complianceRate  |

  @hierarchy-reports
  Scenario: Summary without hierarchy breakdown flag
    When I request the summary report without hierarchy breakdown
    Then the response should be successful
    And the response should not include hierarchy breakdown

  # --- Access Control ---

  @hierarchy-access
  Scenario: Users can only see their downstream entities in tree
    Given I am logged in as a user with limited entity scope
    When I request the hierarchy tree for my entity
    Then I should only see my entity and its descendants
    And I should not see parent or sibling entities

  @hierarchy-access
  Scenario: Cannot request tree for entity outside scope
    Given I am logged in as a user with limited entity scope
    When I request the hierarchy tree for an entity outside my scope
    Then I should receive a forbidden error
