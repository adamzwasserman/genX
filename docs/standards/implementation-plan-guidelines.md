# Implementation Plan Guidelines
**Document Version**: 2.0
**Date**: 2025-01-13
**Status**: MANDATORY FOR ALL IMPLEMENTATION TASKS

## Overview

This document defines comprehensive guidelines for creating detailed implementation plans that ensure test-driven development (TDD), behavior-driven development (BDD), accurate time tracking, and consistent quality across all development efforts.

## 🔴 CRITICAL: The MANDATORY 8-Step Implementation Process

This document defines the **mandatory 8-step process** that MUST be followed for every single implementation task in any implementation plan. This process ensures test-driven development (TDD), behavior-driven development (BDD), accurate time tracking, and consistent quality across all development efforts.

## The 8 Steps (NON-NEGOTIABLE)

### Step 1: Capture Start Time
```bash
echo "Task X.X Start: $(date '+%Y-%m-%d %H:%M:%S')" >> docs/Implementation/[plan-name].md
```
- Records exact start time for metrics
- Enables accurate duration calculations
- Creates accountability

### Step 2: Create BDD Feature File
```bash
# MUST be in test folder at project root (NOT in uv packages)
touch tests/features/[feature_name].feature
```

Example feature file:
```gherkin
Feature: [Feature Name]
  As a [user/system]
  I want [functionality]
  So that [business value]

  Scenario: [Happy path scenario]
    Given [initial context]
    When [action taken]
    Then [expected outcome]

  Scenario: [Edge case scenario]
    Given [edge case context]
    When [edge action]
    Then [edge outcome]

  Scenario: [Error scenario]
    Given [error context]
    When [invalid action]
    Then [error handling]
```

**Requirements**:
- Write scenarios BEFORE any implementation code
- Cover happy path, edge cases, and error conditions
- Define clear acceptance criteria in Given/When/Then format

### Step 3: Create Test Fixtures
```python
# tests/fixtures/[feature]_fixtures.py
import pytest
from unittest.mock import Mock
from typing import Set, Dict, Any

@pytest.fixture
def sample_data() -> Dict[str, Any]:
    """Create test data for scenarios"""
    return {
        "workspace_id": "test-ws",
        "user_id": "test-user",
        "cards": generate_test_cards()
    }

@pytest.fixture
def mock_database():
    """Mock database connection"""
    return Mock()

@pytest.fixture
def mock_external_service():
    """Mock external API calls"""
    mock = Mock()
    mock.call.return_value = {"status": "success"}
    return mock
```

**Requirements**:
- Create all necessary mocks for external dependencies
- Set up test data generators
- Prepare database fixtures (use in-memory SQLite)
- Ensure fixtures are reusable and isolated

### Step 4: Run Red Test
```bash
uv run pytest tests/features/[feature_name].feature -v
# EXPECTED OUTPUT: Tests fail (red state)
# This validates that tests are actually testing something
```

**Purpose**:
- Verify tests fail before implementation
- Confirms test correctness
- Ensures we're testing the right functionality
- Validates that tests will catch regressions

### Step 5: Write Implementation Code
```python
# packages/[module]/[component].py

def implement_feature(
    param1: str,
    param2: Set[str]
) -> Dict[str, Any]:
    """
    Implement feature following architecture principles.

    MUST follow:
    - Function-based architecture (no classes except approved)
    - Pure set operations for filtering
    - Patent specifications compliance
    - Minimal code to make tests pass
    """
    # Implementation here
    pass
```

**Architecture Requirements**:
- Function-based design (NO classes except Pydantic/SQLAlchemy)
- Pure set theory operations for filtering
- No JavaScript except approved spatial manipulation code
- HTMX for all interactivity
- Follow patent specifications

### Step 6: Run Green Test - Block Until 100% Pass
```bash
uv run pytest tests/features/[feature_name].feature -v
# MUST achieve 100% pass rate before proceeding
# This is a hard quality gate - do not continue with failures

# Also run with coverage
uv run pytest tests/features/[feature_name].feature --cov=[module] --cov-report=term-missing
# Target: >90% coverage for new code
```

**Requirements**:
- ALL tests must pass (100% success rate)
- Block progress until achieved
- Fix any failures before continuing
- Verify coverage targets met
- This is a non-negotiable quality gate

### Step 7: Commit and Push Using Commit Agent
```bash
# Stage all changes
git add -A

# Commit with proper message format
git commit -m "[Type]: [Clear description]

- [Detailed change 1]
- [Detailed change 2]
- [Tests added/modified]
- [Architecture compliance verified]


# Push to feature branch
git push origin feature/[feature-name]
```

**Commit Message Types**:
- `feat`: New feature
- `fix`: Bug fix
- `test`: Adding tests
- `refactor`: Code refactoring
- `docs`: Documentation
- `perf`: Performance improvement

### Step 8: Capture End Time and Calculate Duration
```bash
echo "Task X.X End: $(date '+%Y-%m-%d %H:%M:%S')" >> docs/Implementation/[plan-name].md

# Calculate duration (example)
START="2025-01-13 10:00:00"
END="2025-01-13 11:30:00"
# Duration: 1 hour 30 minutes
```

**Purpose**:
- Records exact completion time
- Enables duration calculation
- Provides data for future estimates
- Tracks productivity metrics

## Why This Process is Mandatory

### Quality Assurance
- **BDD-First**: Defines acceptance criteria before code
- **TDD Cycle**: Red-Green-Refactor ensures correctness
- **100% Pass Rate**: Hard quality gate prevents defects
- **Coverage Requirements**: Ensures comprehensive testing

### Accountability
- **Time Tracking**: Every task has measurable duration
- **Git History**: Shows test-driven development
- **Commit Standards**: Clear change documentation
- **Metrics**: Data for continuous improvement

### Consistency
- **Same Process**: All developers follow identical steps
- **Predictable Output**: Consistent quality across tasks
- **Architecture Compliance**: Enforced at every step
- **Review Ready**: Code always has tests

### Scalability
- **Works for Any Size**: From small fixes to large features
- **Team Coordination**: Clear handoffs between developers
- **Parallel Development**: Independent tasks can run simultaneously
- **Context Management**: Each task is self-contained

---

## Common Pitfalls to Avoid

### ❌ DO NOT:
- Write code before feature files
- Proceed with failing tests
- Skip the red state verification
- Commit without running tests
- Ignore time tracking
- Use classes for business logic
- Add custom JavaScript
- Put tests in package directories

### ✅ DO:
- Write comprehensive Gherkin scenarios first
- Block until 100% tests pass
- Verify red state before implementing
- Use commit agent for consistency
- Track time for every task
- Use function-based architecture
- Use HTMX for interactivity
- Put tests in project root tests/ folder

## Implementation Plan Creation Guidelines

### Purpose
Create detailed execution plans from architecture documents with data-driven time estimates

### Target Audience
Project managers and development leads creating implementation roadmaps

### Output Goal
Systematic, measurable implementation plans with predictable timelines

## Plan Structure Requirements

### 1. Header Section
```markdown
# [Module] Implementation Plan

## Overview
Brief description of goals and scope from architecture document

## Current State Analysis
Assessment of existing code and identified issues

## Success Metrics
- Quantitative targets from architecture (response times, test coverage)
- Functional requirements
- Performance benchmarks
```

### 2. Phase Organization (Use 3-7 phases)

#### Standard Phase Structure:
- **Phase 1**: Foundation (domain layer, core models)
- **Phase 2**: Business Logic (services, repositories)
- **Phase 3**: API Integration (routes, authentication)
- **Phase 4**: UI/Templates (Jinja2, HTMX components)
- **Phase 5**: Performance & Testing (optimization, load testing)
- **Phase 6**: Documentation & Deployment

### 3. Task Breakdown Format

#### Standard Task Template:
```markdown
### Task X.X: Task Name ✅/⏸️/🔄
**Duration**: X hours Y minutes
**Dependencies**: Task Y.Z completion
**Risk Level**: Low/Medium/High

**Implementation Process** (MANDATORY 8-step process):

1. **Capture Start Time**
   ```bash
   echo "Task X.X Start: $(date '+%Y-%m-%d %H:%M:%S')" >> docs/Implementation/[plan-name].md
   ```

2. **Create BDD Feature File**
   ```gherkin
   # tests/features/[feature_name].feature
   Feature: [Feature Name]
     As a [user]
     I want [functionality]
     So that [business value]

     Scenario: [Happy path scenario]
       Given [initial context]
       When [action taken]
       Then [expected outcome]
   ```

3. **Create Test Fixtures**
   ```python
   # tests/fixtures/[feature]_fixtures.py
   @pytest.fixture
   def test_data():
       return {"key": "value"}
   ```

4. **Run Red Test**
   ```bash
   uv run pytest tests/features/[feature_name].feature -v
   # Tests fail - red state verified ✓
   ```

5. **Write Implementation**
   ```python
   # packages/[module]/[component].py
   def feature_function(param: str) -> Dict[str, Any]:
       # Implementation following architecture
       pass
   ```

6. **Run Green Test**
   ```bash
   uv run pytest tests/features/[feature_name].feature -v
   # All tests pass - 100% success rate ✓
   ```

7. **Commit and Push**
   ```bash
   git add -A
   git commit -m "feat: Implement [feature]

   - Added BDD tests for [scenarios]
   - Implemented [functionality]
   - Architecture compliance verified


   git push origin feature/[feature-name]
   ```

8. **Capture End Time**
   ```bash
   echo "Task X.X End: $(date '+%Y-%m-%d %H:%M:%S')" >> docs/Implementation/[plan-name].md
   # Duration: X hours Y minutes
   ```

**Validation Criteria**:
- All BDD tests pass with 100% success rate
- Test coverage >90% for new code
- Performance meets specified thresholds
- No regression in existing functionality
- Architecture compliance verified

**Rollback Procedure**:
1. Revert commits in reverse order
2. Verify system stability
3. Update stakeholders
```

## Time Estimation Framework

### Base Timing Data (From TableV2 Implementation):

#### Proven Implementation Metrics:
- **Domain Layer**: 49 minutes 21 seconds (1,000 LOC, 57 functions)
- **Service Layer**: 32 minutes 25 seconds (1,853 LOC, 23 functions)
- **Template System**: 2 hours 15 minutes (4,841 LOC, 52 functions)
- **Repository Pattern**: 58 minutes 25 seconds (3,399 LOC, 68 functions)
- **Plugin Architecture**: 33 minutes 10 seconds (4,756 LOC, 88 functions)

#### Estimation Formula:
```
See:
Business Docs/2. Buckler Expert-Guided AI Development/Statistical Analysis - Implementation Metrics Baseline.md
Business Docs/2. Buckler Expert-Guided AI Development/TRUE_FEEDBACK_LOOP_README.md
Business Docs/2. Buckler Expert-Guided AI Development/update_metrics_analysis.py
```

### Implementation Metrics Tracking

#### Required Metrics Template:
```markdown
**Task X.X Implementation Metrics**
- **Duration**: Started YYYY-MM-DD HH:MM:SS, Ended YYYY-MM-DD HH:MM:SS (X minutes Y seconds)
- **Production Code**: X lines across Y files (Z functions, W classes)
- **Test Code**: X lines across Y test files (Z scenarios, W test functions)
- **Quality**: X validation functions, Y error handlers, Z docstring lines
- **Architecture Compliance**: ✅ Function-based, ✅ No unnecessary classes, ✅ Clean separation
```

## Document Structure

### 1. Implementation Overview
- Scope and objectives
- Success criteria
- Timeline estimates
- Resource requirements

### 2. Prerequisite Analysis
- Dependencies identification
- Environment setup requirements
- Access and permissions needed
- Knowledge prerequisites

### 3. Phase Breakdown

#### Phase Structure Template
```markdown
## Phase X: [Phase Name]
**Duration**: X days/weeks
**Dependencies**: Phase Y completion, Resource Z availability
**Risk Level**: Low/Medium/High

### Objectives
- [ ] Specific measurable outcome 1
- [ ] Specific measurable outcome 2

### Tasks
#### Task X.1: [Task Name]
**Duration**: X hours
**Assignee**: Role/Person
**Dependencies**: None / Task Y.Z

**Implementation Process** (MANDATORY 8-step process - see detailed steps above):
- [ ] Step 1: Capture start time with CLI command
- [ ] Step 2: Create BDD feature file in tests/ folder
- [ ] Step 3: Create test fixtures with mocks
- [ ] Step 4: Run red test (verify failure)
- [ ] Step 5: Write implementation code (function-based)
- [ ] Step 6: Run green test (block until 100% pass)
- [ ] Step 7: Commit and push using commit agent
- [ ] Step 8: Capture end time and calculate duration

**Validation Criteria**:
- All BDD tests pass with 100% success rate
- Test coverage >90% for new code
- Performance meets specified threshold
- No regression in existing functionality
- Architecture compliance verified

**Rollback Procedure**:
1. Revert commits in reverse order
2. Verify rollback success
3. Communicate to stakeholders
```

### 4. Task Sequencing

#### Critical Path
- Identify tasks that cannot be parallelized
- Mark blocking dependencies explicitly
- Calculate minimum completion time

#### Parallel Tracks
- Group independent tasks
- Identify resource conflicts
- Define merge points

### 5. Milestone Definitions

#### Milestone Template
```markdown
### Milestone X: [Milestone Name]
**Target Date**: YYYY-MM-DD
**Success Criteria**:
- [ ] Deliverable 1 complete and tested
- [ ] Deliverable 2 deployed to environment
- [ ] Documentation updated
- [ ] Stakeholder sign-off received

**Go/No-Go Decision Points**:
- If criteria not met: [Contingency plan]
- If blocking issues found: [Escalation path]
```

### 6. Risk Management

#### Risk Register Template
```markdown
### Risk: [Risk Name]
**Probability**: Low/Medium/High
**Impact**: Low/Medium/High
**Category**: Technical/Operational/Resource

**Description**: Detailed risk description

**Mitigation Strategy**:
- Preventive action 1
- Preventive action 2

**Contingency Plan**:
- If risk materializes, execute steps:
  1. Immediate action
  2. Communication plan
  3. Recovery procedure

**Early Warning Signs**:
- Indicator 1
- Indicator 2
```

### 7. Testing Strategy

#### The 8-Step Process Enforces TDD/BDD
The mandatory 8-step process ensures proper test-driven development:

- **Step 2-4**: BDD-first approach (feature files → fixtures → red tests)
- **Step 5**: Minimal implementation to pass tests
- **Step 6**: Green state achievement (100% pass rate)
- **Step 7-8**: Proper version control and metrics

#### Test Plan Per Phase
- BDD feature files for all functionality
- pytest-BDD step definitions with mocks
- Integration test scenarios
- Performance benchmarks embedded in tests
- User acceptance criteria as Gherkin scenarios

#### Test Environment Requirements
- Test folder at project root (not in packages)
- pytest-bdd for behavior-driven testing
- Mock fixtures for all external dependencies
- In-memory SQLite for database tests
- Test data generators for edge cases

#### Testing Integration Standards
```bash
# Example test execution pattern
uv run pytest tests/features/[feature_name].feature -v --cov=[module] --cov-report=term-missing
# Target: >90% coverage, 100% pass rate
```

### 8. Communication Plan
- Stakeholder updates schedule
- Progress reporting format
- Escalation procedures
- Documentation requirements

### 9. Rollback Procedures

#### Rollback Decision Matrix
| Scenario | Trigger | Decision Maker | Rollback Steps |
|----------|---------|----------------|----------------|
| Test failure | >10% tests fail | Tech Lead | Execute rollback-plan-A |
| Performance degradation | >20% slower | Tech Lead | Execute rollback-plan-B |
| Data corruption | Any corruption | Immediate | Execute emergency-rollback |

### 10. Progress Tracking

#### Metrics to Track
- Tasks completed vs planned
- Test coverage percentage
- Performance benchmarks
- Defect discovery rate
- Documentation completeness

#### Tracking Format
```markdown
### Day X Progress Update
**Date**: YYYY-MM-DD HH:MM:SS
**Tasks Completed**: X of Y
**Blockers**: None / [Blocker description]
**Next Actions**:
- [ ] Task X.Y.Z
- [ ] Task A.B.C

**Metrics**:
- Test Coverage: X%
- Performance: Xms average
- Lines of Code: +X / -Y
- Functions Created: X
```

### 11. Completion Criteria

#### Task-Level Completion Requirements
Each task is ONLY considered complete when ALL 8 steps are executed:
- [ ] Step 1: Start time captured with CLI command
- [ ] Step 2: BDD feature file created in tests/ folder
- [ ] Step 3: Test fixtures implemented with mocks
- [ ] Step 4: Red test state verified (tests fail initially)
- [ ] Step 5: Implementation code written following architecture
- [ ] Step 6: Green test state achieved (100% pass rate)
- [ ] Step 7: Code committed and pushed using commit agent
- [ ] Step 8: End time captured and duration calculated

#### Phase-Level Completion Requirements
- [ ] All tasks in phase marked complete
- [ ] All BDD tests passing (100% success rate)
- [ ] Test coverage >90% for new code
- [ ] Performance benchmarks met
- [ ] Architecture compliance verified
- [ ] Documentation updated

#### Project-Level Completion Requirements
- [ ] All phases marked complete
- [ ] All tests passing (100% of test suite)
- [ ] Overall test coverage >90%
- [ ] Performance targets achieved
- [ ] Security review passed
- [ ] Architecture compliance verified
- [ ] Stakeholder acceptance received
- [ ] Production deployment successful

### 12. Post-Implementation Review
- Lessons learned
- Actual vs estimated timeline
- Issues encountered and resolutions
- Process improvements identified
- Knowledge transfer completed

## Quality Checklist

### Process Compliance
- [ ] Every task includes complete 8-step implementation process
- [ ] All tasks specify BDD feature file creation in tests/ folder
- [ ] Test fixtures defined with mocks for each feature
- [ ] Red/Green test states explicitly mentioned and enforced
- [ ] Commit agent usage specified with proper attribution
- [ ] Time tracking commands included (start and end)
- [ ] CLI commands provided for timestamp capture
- [ ] 100% pass rate requirement stated as quality gate

### Planning Quality
- [ ] All tasks have clear dependencies
- [ ] Critical path identified
- [ ] Risks assessed with mitigation plans
- [ ] Rollback procedures for each phase
- [ ] Test criteria specified (100% pass rate)
- [ ] Communication plan defined
- [ ] Progress tracking mechanism in place
- [ ] Completion criteria measurable
- [ ] Resource requirements identified
- [ ] Timeline realistic with buffer

### Test-Driven Development
- [ ] BDD-first approach enforced (Step 2 before Step 5)
- [ ] Feature files precede implementation (Step 2 → Step 5)
- [ ] Test fixtures properly defined (Step 3)
- [ ] Red-Green cycle specified (Step 4 → Step 6)
- [ ] 100% pass rate requirement stated as hard quality gate
- [ ] Coverage targets defined (>90%)
- [ ] Tests in project root tests/ folder (not packages)
- [ ] Blocking until green state achieved

## Metrics and Reporting

### Task Metrics Template
```markdown
**Task X.X Metrics**
- **Start Time**: YYYY-MM-DD HH:MM:SS
- **End Time**: YYYY-MM-DD HH:MM:SS
- **Duration**: X hours Y minutes
- **Tests Written**: X scenarios, Y step definitions
- **Test Coverage**: X% (target >90%)
- **Lines of Code**: X production, Y test
- **Functions Created**: X functions
- **Commits**: X commits
- **Architecture Compliance**: ✅ Verified
```

### Phase Summary Template
```markdown
**Phase X Summary**
- **Total Duration**: X hours Y minutes
- **Tasks Completed**: X of Y
- **Average Task Duration**: X hours
- **Total Tests**: X scenarios
- **Overall Coverage**: X%
- **Architecture Violations**: 0
```

## Enforcement and Compliance

### Review Checklist
Every task MUST be reviewed against:
- [ ] Start time captured
- [ ] BDD feature file created first
- [ ] Test fixtures implemented
- [ ] Red state verified
- [ ] Implementation follows architecture
- [ ] Green state achieved (100% pass)
- [ ] Proper commit with agent
- [ ] End time captured

### Compliance Monitoring
- **Git History**: Shows test files committed before implementation
- **Timestamps**: Verify sequential execution of steps
- **Test Results**: CI/CD validates 100% pass rate
- **Coverage Reports**: Automated coverage checking
- **Architecture Scans**: Detect class usage violations

## Example Task Implementation

### Task 2.1: Implement User Authentication
```markdown
**Duration**: 2 hours
**Dependencies**: Task 1.3

**Implementation Process**:

1. **Capture Start Time**
   ```bash
   echo "Task 2.1 Start: 2025-01-13 14:00:00" >> docs/Implementation/auth-implementation-plan.md
   ```

2. **Create BDD Feature File**
   ```gherkin
   # tests/features/user_authentication.feature
   Feature: User Authentication
     As a user
     I want to authenticate with the system
     So that I can access my workspace

     Scenario: Successful login
       Given I have valid credentials
       When I submit the login form
       Then I should be authenticated
       And I should see my workspace

     Scenario: Invalid credentials
       Given I have invalid credentials
       When I submit the login form
       Then I should see an error message
       And I should not be authenticated
   ```

3. **Create Test Fixtures**
   ```python
   # tests/fixtures/auth_fixtures.py
   @pytest.fixture
   def valid_user():
       return {"username": "test", "password": "hashed_pass"}
   ```

4. **Run Red Test**
   ```bash
   uv run pytest tests/features/user_authentication.feature -v
   # Tests fail - red state verified ✓
   ```

5. **Write Implementation**
   ```python
   # packages/shared/src/backend/auth.py
   def authenticate_user(username: str, password: str) -> Dict[str, Any]:
       # Implementation following architecture
       pass
   ```

6. **Run Green Test**
   ```bash
   uv run pytest tests/features/user_authentication.feature -v
   # All tests pass - 100% success rate ✓
   ```

7. **Commit and Push**
   ```bash
   git add -A
   git commit -m "feat: Implement user authentication

   - Added BDD tests for login scenarios
   - Implemented authenticate_user function
   - Added password hashing with bcrypt
   - Created session management


   git push origin feature/user-auth
   ```

8. **Capture End Time**
   ```bash
   echo "Task 2.1 End: 2025-01-13 15:45:00" >> docs/Implementation/auth-implementation-plan.md
   # Duration: 1 hour 45 minutes
   ```
```

## Template Implementation Plan Structure

```markdown
# [Module] Implementation Plan

## Overview
[Goals, scope, business value]

## Current State Analysis
[Existing code assessment]

## Success Metrics
[Quantitative targets]

## Phase 1: Foundation
### Task 1.1: [Foundation Task]
[Complete 8-step process breakdown]

## Phase 2: Business Logic
### Task 2.1: [Service Task]
[Complete 8-step process breakdown]

## Phase 3: API Integration
### Task 3.1: [Route Task]
[Complete 8-step process breakdown]

## Phase 4: UI/Templates
### Task 4.1: [Template Task]
[Complete 8-step process breakdown]

## Phase 5: Performance & Testing
### Task 5.1: [Performance Task]
[Complete 8-step process breakdown]

## Implementation Time Summary
[Complete time analysis with 8-step metrics]

## Success Criteria
[Final validation requirements]
```

## Key Success Factors

### The 8-Step Process Ensures Success:
1. **Time Accountability**: Start/end times for every task
2. **Test Coverage**: BDD-first approach guarantees quality
3. **Consistent Execution**: Same process for all tasks
4. **Measurable Progress**: Duration tracking enables accurate estimates
5. **Quality Gates**: 100% test pass requirement
6. **Version Control**: Proper commit practices with agent
7. **Architecture Compliance**: Function-based design enforced
8. **Continuous Improvement**: Metrics enable process refinement

### Data-Driven Estimates:
- Use actual implementation data from similar projects
- Account for complexity multipliers
- Include BDD/TDD testing overhead (40% for comprehensive testing)
- Track accuracy for continuous improvement
- Factor in time for 8-step process execution
- Add buffer for test fixture creation and red/green cycles

## Conclusion

The 8-step process is not optional—it's the foundation of our development methodology. By following these steps exactly, we ensure:

1. **Quality**: Every feature has comprehensive tests
2. **Predictability**: Accurate time estimates from historical data
3. **Maintainability**: Clean, tested, documented code
4. **Scalability**: Consistent process across all teams
5. **Compliance**: Architecture principles enforced

This process has been proven to deliver high-quality software on predictable timelines. Deviation from this process requires explicit architectural approval and must be documented with justification.

---

**Remember**: The 8 steps are your path to success. Follow them exactly, every time, for every task.
