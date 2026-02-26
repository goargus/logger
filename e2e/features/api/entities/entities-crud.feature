@api @entities
Feature: Entities CRUD Operations
  As an administrator
  I want to manage organizational entities
  So that I can maintain the organizational hierarchy

  Background:
    Given I am authenticated as "admin"

  # === READ ===
  @smoke
  Scenario: List entities I can see
    When I request my visible entities
    Then the response status should be 200
    And the response should be an array

  @smoke
  Scenario: Get my primary entity
    When I request my profile
    Then the response status should be 200
    And the response should have property "primary_entity"

  Scenario: Get entity by ID
    Given I have an entity ID
    When I request the entity by id
    Then the response status should be 200
    And the response should have property "id"
    And the response should have property "name"
    And the response should have property "type"

  # === HIERARCHY ===
  Scenario: Get entity tree
    Given I have an entity with children
    When I request the entity tree
    Then the response status should be 200
    And the response should have property "children"

  Scenario: Get entity descendants
    Given I have an entity with children
    When I request the entity descendants
    Then the response status should be 200
    And the response should be an array

  Scenario: Get entity children
    Given I have an entity with children
    When I request the entity children
    Then the response status should be 200
    And the response should be an array

  # === CREATE ===
  @permission @skip @requires-system-admin
  Scenario: Admin creates a child entity
    Given I have a parent entity
    When I create a child entity with:
      | name       | Test Field       |
      | entityType | FIELD            |
    Then the response status should be 201
    And the response should have property "id"
    And the response should have property "parent"

  @permission
  Scenario: Non-admin cannot create entities
    Given I am authenticated as "missionary"
    And I have a parent entity ID
    When I try to create a child entity
    Then the response status should be 403

  # === UPDATE ===
  @permission @skip @requires-system-admin
  Scenario: Admin updates an entity
    Given I have an entity ID
    When I update the entity with:
      | name | Updated Entity Name |
    Then the response status should be 200
    And the response should have property "name" with value "Updated Entity Name"

  @permission
  Scenario: Non-admin cannot update entities
    Given I am authenticated as "missionary"
    And I have an entity ID
    When I try to update the entity
    Then the response status should be 403

  # === ERROR CASES ===
  @skip @requires-system-admin
  Scenario: Cannot create entity with invalid type
    Given I have a parent entity
    When I create a child entity with:
      | name       | Invalid Entity |
      | entityType | INVALID        |
    Then the response status should be 400

  @skip @requires-system-admin
  Scenario: Cannot create entity without parent
    When I create an entity without parent:
      | name       | Orphan Entity |
      | entityType | ASSOCIATION   |
    Then the response status should be 400
