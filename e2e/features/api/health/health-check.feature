@api @smoke
Feature: API Health Check
  As a system operator
  I want to verify the API is running
  So that I can confirm the backend is healthy

  Scenario: Backend is reachable
    When I request the health endpoint
    Then the response status should be 200
    And the response should have property "status" with value "ok"
