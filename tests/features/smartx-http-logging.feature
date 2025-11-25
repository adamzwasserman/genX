Feature: SmartX HTTP Logging with Rate Limiting
  As a SmartX user
  I want to send low-confidence detections to an analytics endpoint
  So that I can collect and analyze detection failures centrally

  Background:
    Given the SmartX module is loaded
    And a mock analytics endpoint is available

  Scenario: logTarget with URL enables HTTP logging
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    When an element has confidence below threshold
    Then the log should be queued for HTTP transmission
    And no console warnings should be logged

  Scenario: HTTP endpoint URL validation - HTTPS required
    When SmartX.configure({logTarget: 'http://analytics.example.com/log'}) is called
    Then a console warning should be logged about insecure URL
    And logTarget should remain at current value
    And HTTP logging should not be enabled

  Scenario: HTTP endpoint URL validation - valid HTTPS accepted
    When SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    Then no warnings should be logged
    And logTarget should be set to the URL
    And HTTP logging should be enabled

  Scenario: Rate limiting - maximum 10 requests per second
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And 25 low-confidence elements are processed within 100ms
    When SmartX flushes the log queue
    Then exactly 3 HTTP requests should be sent
    And the requests should contain 10, 10, and 5 logs respectively
    And requests should be spaced at least 100ms apart

  Scenario: Batching logs into single request
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And 10 low-confidence elements are processed
    When SmartX flushes the log queue
    Then 1 HTTP request should be sent
    And the request body should be a JSON array with 10 entries
    And each entry should have structured log data

  Scenario: Request payload structure
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And a low-confidence element is processed
    When SmartX sends the HTTP request
    Then the request should use POST method
    And Content-Type should be application/json
    And the body should be a JSON array of log objects
    And each log should have: timestamp, value, confidence, threshold, detected, applied, element

  Scenario: PII sanitization - email addresses
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And an element has value "user@example.com"
    When the log is queued
    Then the value should be sanitized to "***@example.com"
    And the PII sanitization should be logged

  Scenario: PII sanitization - phone numbers
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And an element has value "(555) 123-4567"
    When the log is queued
    Then the value should be sanitized to "(**) ***-4567"
    And only last 4 digits should be visible

  Scenario: PII sanitization - credit card numbers
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And an element has value "4111-1111-1111-1111"
    When the log is queued
    Then the value should be sanitized to "****-****-****-1111"
    And only last 4 digits should be visible

  Scenario: PII sanitization disabled for short values
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And an element has value "test"
    When the log is queued
    Then the value should NOT be sanitized
    And "test" should be sent as-is

  Scenario: Failed request retry logic
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And the analytics endpoint returns 500 error
    And 5 logs are queued
    When SmartX attempts to send the request
    Then the request should be retried up to 3 times
    And logs should remain in queue if all retries fail
    And a console warning should be logged about failure

  Scenario: Network timeout handling
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And the analytics endpoint times out
    When SmartX attempts to send the request
    Then the request should timeout after 5 seconds
    And logs should remain in queue
    And a console warning should be logged

  Scenario: Queue size limit - maximum 100 entries
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And 150 low-confidence elements are processed
    When the queue size exceeds 100
    Then oldest entries should be dropped
    And only most recent 100 should be retained
    And a console warning should be logged about queue overflow

  Scenario: Automatic flush on queue full
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And 10 logs are queued
    When the 10th log is added
    Then the queue should automatically flush
    And an HTTP request should be sent immediately

  Scenario: Manual flush via SmartX.flushLogs()
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And 5 logs are queued
    When SmartX.flushLogs() is called
    Then all queued logs should be sent immediately
    And the queue should be empty after flush

  Scenario: Multiple batches sent sequentially
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And 25 logs are queued
    When SmartX flushes the log queue
    Then batch 1 should be sent first (logs 1-10)
    And batch 2 should be sent after 100ms (logs 11-20)
    And batch 3 should be sent after another 100ms (logs 21-25)
    And batches should not overlap

  Scenario: HTTP 4xx errors stop retries
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And the analytics endpoint returns 400 Bad Request
    When SmartX attempts to send the request
    Then retries should be skipped
    And the logs should be dropped
    And a console error should be logged

  Scenario: HTTP 2xx success clears queue
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And 5 logs are queued
    When the analytics endpoint returns 200 OK
    Then the queue should be cleared
    And no retries should be attempted
    And no errors should be logged

  Scenario: Request headers include User-Agent
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    When an HTTP request is sent
    Then the User-Agent header should include "SmartX/1.0"
    And the request should identify itself

  Scenario: CORS preflight handling
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And the endpoint requires CORS preflight
    When an HTTP request is sent
    Then the preflight OPTIONS request should be handled
    And the actual POST should follow if allowed

  Scenario: Switch from console to HTTP logging
    Given SmartX.configure({logTarget: 'console'}) was called
    And console warnings were being logged
    When SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    Then subsequent logs should go to HTTP
    And console warnings should stop

  Scenario: Switch from HTTP to console logging
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) was called
    And logs were being queued for HTTP
    When SmartX.configure({logTarget: 'console'}) is called
    Then pending logs should be flushed
    And subsequent logs should go to console

  Scenario: Disable logging by switching to 'none'
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) was called
    And 3 logs are queued
    When SmartX.configure({logTarget: 'none'}) is called
    Then pending logs should be flushed
    And subsequent logs should not be queued or logged

  Scenario: Log payload includes SmartX version
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    When logs are sent to the endpoint
    Then the payload should include metadata
    And metadata should contain SmartX version number
    And metadata should contain browser info

  Scenario: Batch timestamp represents batch creation time
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And 10 logs are queued over 5 seconds
    When the batch is sent
    Then the batch should have a batch_timestamp
    And the batch_timestamp should be when flush was called
    And individual logs should retain their own timestamps

  Scenario: Empty queue does not send request
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And the log queue is empty
    When SmartX.flushLogs() is called
    Then no HTTP request should be sent
    And no errors should occur

  Scenario: URL with query parameters preserved
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log?app=smartx&v=1'}) is called
    When an HTTP request is sent
    Then the URL should include query parameters
    And the request should be sent to the full URL

  Scenario: Relative URLs not allowed
    When SmartX.configure({logTarget: '/api/logs'}) is called
    Then a console warning should be logged about invalid URL
    And logTarget should remain at current value
    And HTTP logging should not be enabled

  Scenario: Rate limiter state persists across flushes
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And 10 logs are sent (1st batch)
    And 100ms has not passed
    When 10 more logs are queued and flushed
    Then the 2nd batch should wait for rate limit
    And at least 100ms should pass between batches

  Scenario: Concurrent requests limited to 1
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And a batch is currently being sent
    When flush is called again
    Then the 2nd flush should wait for 1st to complete
    And requests should not overlap

  Scenario: Request timeout does not block queue
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And the first request times out
    When new logs are queued
    Then new logs should still be processed
    And the queue should continue functioning

  Scenario: PII sanitization for SSN pattern
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And an element has value "123-45-6789"
    When the log is queued
    Then the value should be sanitized to "***-**-6789"
    And SSN pattern should be detected

  Scenario: Log includes element attributes
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And an element has fx-smart-types="currency,date"
    And the element has low confidence
    When the log is queued
    Then the log should include allowedTypes: ["currency", "date"]
    And element configuration should be captured

  Scenario: Performance overhead less than 2ms per log
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And 100 logs are queued
    When performance is measured
    Then queue operations should average less than 2ms per log
    And HTTP operations should not block processing

  Scenario: getConfig returns logTarget URL
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) was called
    When SmartX.getConfig() is called
    Then it should return { logTarget: 'https://analytics.example.com/log', ... }
    And the URL should be accessible

  Scenario: Batch size exactly 10 logs
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And 23 logs are queued
    When batches are sent
    Then batch 1 should have exactly 10 logs
    And batch 2 should have exactly 10 logs
    And batch 3 should have exactly 3 logs

  Scenario: Failed PII sanitization does not block logging
    Given SmartX.configure({logTarget: 'https://analytics.example.com/log'}) is called
    And PII sanitization throws an error
    When a log is queued
    Then the original value should be used
    And a console warning should be logged
    And the log should still be sent

  Scenario: HTTPS validation case insensitive
    When SmartX.configure({logTarget: 'HTTPS://analytics.example.com/log'}) is called
    Then no warnings should be logged
    And the URL should be accepted
    And HTTPS should be recognized

  Scenario: URL validation rejects invalid formats
    When SmartX.configure({logTarget: 'not-a-url'}) is called
    Then a console warning should be logged
    And logTarget should remain at current value
    And HTTP logging should not be enabled

  Scenario: Localhost allowed for development
    When SmartX.configure({logTarget: 'http://localhost:3000/log'}) is called
    Then no warnings should be logged
    And the URL should be accepted for localhost
    And HTTP logging should be enabled
