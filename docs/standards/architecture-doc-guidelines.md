# Architecture Document Guidelines

## Document Structure

### 1. Executive Summary (200-300 words)
- Problem statement and business context
- Proposed solution overview
- Key architectural decisions
- Expected outcomes and benefits

### 2. System Context
- Current state architecture
- Integration points and dependencies
- Data flow patterns
- Security boundaries

### 3. Technical Design

#### 3.0 Diagram Standards

**REQUIRED**: All diagrams MUST use Mermaid syntax for version control compatibility and maintainability.

**Rationale**:
- Text-based diagrams enable git diff and proper version control
- No external tools required - renders in GitHub, GitLab, and modern markdown viewers
- Easy to update and maintain alongside code
- Supports all necessary diagram types for architecture documentation
- Prevents binary image files from bloating repository

**Supported Mermaid Diagram Types**:

1. **Component/Architecture Diagrams** (use `graph` or `flowchart`)
   ```mermaid
   graph TB
       Client[Client Browser]
       API[API Server]
       DB[(Database)]
       Cache[(Redis Cache)]

       Client -->|HTTPS| API
       API -->|Query| DB
       API -->|Read/Write| Cache
   ```

2. **Sequence Diagrams** (for interaction flows)
   ```mermaid
   sequenceDiagram
       participant User
       participant Browser
       participant Server
       participant Database

       User->>Browser: Drag tag to cell
       Browser->>Server: POST /api/cards/filter
       Server->>Database: Execute set operation
       Database-->>Server: Return UUIDs
       Server-->>Browser: Render cards
       Browser-->>User: Display filtered cards
   ```

3. **Entity Relationship Diagrams** (for data models)
   ```mermaid
   erDiagram
       CARD ||--o{ CARD_TAG : has
       TAG ||--o{ CARD_TAG : references
       WORKSPACE ||--|| USER : owns

       CARD {
           uuid card_id PK
           uuid workspace_id FK
           uuid user_id FK
           text content
           jsonb metadata
       }

       TAG {
           uuid tag_id PK
           uuid workspace_id FK
           string name
           string color
       }
   ```

4. **State Diagrams** (for workflows)
   ```mermaid
   stateDiagram-v2
       [*] --> Normal
       Normal --> Privacy: Enable Privacy Mode
       Privacy --> Normal: Disable Privacy Mode
       Normal --> Offline: Lose Connection
       Offline --> Normal: Restore Connection
       Privacy --> Offline: Lose Connection
       Offline --> Privacy: Restore in Privacy
   ```

5. **Class Diagrams** (for Protocol definitions)
   ```mermaid
   classDiagram
       class DataLoader~T~ {
           <<Protocol>>
           +load(context: LoadContext) frozenset~T~
       }

       class SpatialMapper~T,U~ {
           <<Protocol>>
           +map(data: frozenset~T~) U
       }

       class Renderer~T~ {
           <<Protocol>>
           +render(spatial_data: T) Any
       }

       DataLoader~T~ --> SpatialMapper~T,U~
       SpatialMapper~T,U~ --> Renderer~U~
   ```

**Diagram Requirements**:
- All diagrams MUST be embedded directly in markdown using triple-backtick mermaid code blocks
- Complex diagrams MAY be split into multiple simpler diagrams for clarity
- Each diagram MUST have a descriptive caption explaining its purpose
- Component names in diagrams MUST match actual code module/class names
- Data flow direction MUST be clearly indicated with arrows
- External dependencies MUST be visually distinguished (e.g., different shape/color)

**Forbidden Practices**:
- ❌ PNG/JPG/SVG image files committed to repository
- ❌ Diagrams created in external tools (draw.io, Lucidchart, etc.) without Mermaid source
- ❌ Screenshots of diagrams
- ❌ Hand-drawn diagrams (unless for initial brainstorming, not final docs)

**Exception**: Architecture diagrams MAY include external tool exports ONLY IF:
1. Mermaid equivalent is also provided as source of truth
2. External diagram is clearly marked as "illustrative only"
3. Justification is documented for why Mermaid is insufficient

#### 3.1 Component Architecture
- Component diagram with clear boundaries
- Responsibilities and interfaces
- Communication patterns (sync/async)
- Data ownership model

#### 3.2 Data Architecture
- Entity relationships
- Storage patterns and partitioning
- Consistency requirements
- Migration strategies

#### 3.3 Polymorphic Architecture Mandates

**Core Principle**: "Maximum functionality with minimal code through polymorphic design"

**REQUIRED**: All rendering and data processing systems MUST use polymorphic architecture with Protocol-based interfaces. This enables:
- Single codebase supporting cards, charts, n-dimensional views, and future visualizations
- Implementation swapping without paradigm changes
- Extensibility through interface compliance rather than inheritance
- Zero-configuration addition of new rendering types

**Polymorphic Design Pattern**:
```python
from typing import Protocol, TypeVar, Generic
from abc import abstractmethod

T = TypeVar('T')
U = TypeVar('U')

class DataLoader(Protocol[T]):
    @abstractmethod
    async def load(self, context: LoadContext) -> frozenset[T]: ...

class SpatialMapper(Protocol[T, U]):
    @abstractmethod
    async def map(self, data: frozenset[T]) -> U: ...

class Renderer(Protocol[T]):
    @abstractmethod
    async def render(self, spatial_data: T) -> Any: ...
```

**Implementation Requirements**:
- All data loading MUST use Protocol-based DataLoader implementations
- All spatial organization MUST use Protocol-based SpatialMapper implementations
- All output generation MUST use Protocol-based Renderer implementations
- NO direct coupling between layers - only through Protocol interfaces
- Factory functions MUST enable runtime implementation selection

#### 3.4 Code Organization Standards

**File Size Guidelines**:
- **Target Size**: 500 lines per file
- **Acceptable Range**: 300-700 lines
- **Rationale**: Balances code cohesion with cognitive complexity
- **Split Criteria**: Logical boundaries over arbitrary line counts

**File Organization Strategy**:
```
# Good: Domain-driven organization
domain/
├── core_operations.py     # ~500 lines: Primary domain logic
├── optimization.py        # ~400 lines: Performance enhancements
├── validation.py          # ~300 lines: Input/output validation
└── utilities.py           # ~250 lines: Helper functions

# Bad: Size-driven splits
domain/
├── operations_1.py        # 350 lines: Arbitrary split
├── operations_2.py        # 350 lines: No logical boundary
└── monolith.py           # 1500 lines: Too complex
```

**Split Decision Framework**:
1. **Domain Boundaries**: Different business concerns
2. **Abstraction Levels**: Core logic vs utilities
3. **Change Frequency**: Stable vs evolving code
4. **Testing Scope**: Unit vs integration concerns
5. **Dependency Patterns**: High vs low coupling

**Quality Metrics**:
- Files >700 lines require architectural review
- Files <200 lines should justify separate existence
- Average file size target: 400-500 lines
- No single file should exceed 1000 lines

#### 3.5 Card Multiplicity Architecture

**Core Principle**: Cards are instances that can proliferate and exist in multiple spatial locations simultaneously, not normalized entities.

**Card Instance Requirements**:
- Cards represent semantic content, not IDs or abstract references
- Same semantic entity can have thousands of Card instances
- Each Card instance can exist in multiple spatial zones concurrently
- Card proliferation enables pattern discovery through spatial density

**Data Transformation Patterns**:
```python
# Operational data → Card transformation
def transform_operational_event(
    event: OperationalEvent,
    semantic_extractor: SemanticExtractor
) -> Card:
    """
    Transform operational data into semantic Cards.

    Card = semantic_content (human-readable meaning)
    Tags = selection attributes (for spatial filtering)
    Content = detailed data (for expansion)
    """
    semantic_content = semantic_extractor.extract_meaning(event)
    selection_tags = semantic_extractor.extract_attributes(event)
    detailed_content = semantic_extractor.extract_details(event)

    return Card(
        content=semantic_content,  # "Fix authentication bug"
        tags=selection_tags,       # {#bug, #auth-service, #P0}
        details=detailed_content   # Full description, IDs, metadata
    )
```

**Multiplicity Implementation**:
- A user with 1000 failed logins generates 1000 Card instances
- Each Card tagged with user identifier enables aggregation
- Spatial manipulation reveals patterns through Card density
- No normalized storage - embrace semantic duplication

#### 3.6 System Tags Implementation Requirements

**Three System Tag Categories**:

1. **Operator Tags** - Generate synthetic Cards through computation
   - `COUNT` + `#user-alice` → generates Card "alice: 47 failed logins"
   - `SUM` + `#payment-failed` → generates Card "Total: $3,847 failed"
   - `RANK` + `#performance` → generates ordered performance Cards

2. **Modifier Tags** - Transform display without changing data
   - `SORT_BY_TIME` → reorders Cards chronologically within cells
   - `ALPHABETICAL` → string ordering of Cards
   - `GROUP_BY_FREQUENCY` → clusters Cards by occurrence patterns

3. **Mutation Tags** - Permanently modify Card attributes
   - `MIGRATE_SPRINT` → move Cards from sprint 1 to sprint 2
   - `BULK_RETAG` → replace tags across Card sets
   - `ARCHIVE` → add #archived tag to Cards matching criteria

**System Tag Function Pattern**:
```python
from typing import Protocol

class SystemTagFunction(Protocol):
    @abstractmethod
    def apply(
        self,
        matrix: dict[str, dict[str, frozenset[Card]]],
        target_tags: frozenset[str],
        mutation_context: Optional[MutationContext] = None
    ) -> dict[str, dict[str, frozenset[Card]]]:
        """Apply system tag operation to Card matrix."""
        ...
```

#### 3.7 Poka-yoke Safety Mechanisms

**Two-Phase Spatial Confirmation for Mutations**:

Phase 1: Preview Mode (Staging Zone)
- Mutating system tags dragged to staging zone show diff overlay
- Cards display red/green changes (tags removed/added)
- Counter shows "N Cards will be modified"
- No actual changes applied - visual preview only

Phase 2: Commit Confirmation (Confirm Zone)
- Preview Card cluster dragged to dedicated confirm zone
- Only then are mutations actually applied
- Audit trail created for all committed mutations
- Irreversible operations require double confirmation

**Physical Safety Implementation**:
```python
class MutationPreview:
    cards_affected: frozenset[Card]
    changes_preview: dict[Card, TagDiff]  # Card → {added: set, removed: set}
    mutation_count: int

    def commit(self, confirm_zone: ConfirmZone, audit: AuditContext) -> MutationResult:
        """Only executes when preview dragged to confirm zone."""
        pass

class PokayokeZones:
    staging_zone: StagingZone      # For mutation previews
    confirm_zone: ConfirmZone      # For mutation commits
    read_only_zone: ReadOnlyZone   # For safe operations
```

**Safety Design Principles**:
- Wrong actions are physically impossible, not just forbidden
- Spatial interface geometry enforces safety
- Mutating tags cannot "stick" to read-only zones
- Visual feedback (red outline) for invalid operations
- Temporal staging prevents accidental bulk mutations

#### 3.8 Function Signatures
```python
# Example format for all critical functions
def function_name(
    param1: Type,
    param2: Type,
    *,  # Force keyword-only args for clarity
    optional_param: Optional[Type] = None
) -> ReturnType:
    """
    Brief description of function purpose.

    Args:
        param1: What this parameter represents
        param2: What this parameter represents
        optional_param: When and why to use this

    Returns:
        Description of return value and structure

    Raises:
        ExceptionType: When this exception occurs
    """
```

### 4. Architectural Principles Compliance

#### 4.0.1 Card Multiplicity Compliance Requirements

**Data Transformation Standards**:
- All operational data MUST transform to semantic Cards, not abstract entities
- Card content MUST be human-readable and immediately meaningful
- IDs and reference numbers become metadata, never primary Card content
- Card proliferation is encouraged - embrace semantic duplication over normalization

**Compliance Verification**:
- [ ] Cards represent semantic meaning ("Fix auth bug") not IDs ("PROJ-1234")
- [ ] Same entity can generate multiple Card instances
- [ ] Cards can exist in multiple spatial locations simultaneously
- [ ] Spatial density reveals patterns through Card proliferation
- [ ] No normalization constraints prevent Card duplication

**System Tags Compliance**:
- [ ] Three tag categories implemented: Operator, Modifier, Mutation
- [ ] System tag functions are pure and composable
- [ ] Mutating operations use two-phase confirmation
- [ ] Poka-yoke safety prevents accidental bulk changes
- [ ] System tags work with Card multiplicity model

#### 4.0 Polymorphic Excellence Requirements

**Protocol-First Design**: Every major system component MUST be defined as a Protocol first, implementations second. This ensures:
- Maximum flexibility for future requirements
- Clean separation between interface contracts and implementation details
- Ability to swap implementations without affecting dependent systems
- Clear documentation of expected behaviors

**NO Monolithic Functions**: Functions exceeding 100 lines or handling multiple concerns MUST be decomposed into polymorphic components. Example of FORBIDDEN pattern:
```python
# FORBIDDEN: Monolithic rendering function
def render_everything(data, format_type, spatial_config, output_target):
    # 500+ lines of mixed concerns
    if format_type == 'cards':
        # card-specific logic
    elif format_type == 'charts':
        # chart-specific logic
    # ... more conditionals
```

**REQUIRED Pattern**: Polymorphic decomposition
```python
# REQUIRED: Polymorphic architecture
async def render_data(
    data: frozenset[T],
    loader: DataLoader[T],
    mapper: SpatialMapper[T, U],
    renderer: Renderer[U]
) -> Any:
    loaded = await loader.load(data)
    spatial = await mapper.map(loaded)
    return await renderer.render(spatial)
```

**Factory Pattern Mandate**: All polymorphic implementations MUST be accessible through factory functions:
```python
def create_data_loader(loader_type: str, **config) -> DataLoader[Any]:
    """Factory for all DataLoader implementations."""

def create_spatial_mapper(mapper_type: str, **config) -> SpatialMapper[Any, Any]:
    """Factory for all SpatialMapper implementations."""

def create_renderer(renderer_type: str, **config) -> Renderer[Any]:
    """Factory for all Renderer implementations."""
```

#### 4.1 Set Theory Operations
- Document all filtering operations as pure set theory
- Provide mathematical notation for complex operations
- Example: `result = (A ∩ B) ∪ (C - D)`
- **Card Multiplicity Compliance**: Set operations work on Card instances, not normalized entities
- Intersection operations preserve Card multiplicity (multiple instances pass through filters)
- Union operations aggregate Cards from different sources while maintaining instance identity

#### 4.2 Function-Based Architecture
- NO classes except for approved types (Pydantic, SQLAlchemy, Protocols, Context managers)
- **EXCEPTION**: Protocol definitions and their implementations are mandatory for polymorphic architecture
- All business logic as pure functions with explicit dependencies
- State passed explicitly, never hidden
- Polymorphic implementations MUST use classes that conform to Protocol interfaces

#### 4.3 JavaScript Restrictions
- Document any required JavaScript (should be minimal)
- Justify why HTMX cannot achieve the requirement
- Limit to approved patterns (spatial manipulation, DOM properties)

### 5. Performance Considerations

#### 5.1 Polymorphic Performance Requirements
- Protocol method calls MUST NOT introduce measurable overhead (target: <1μs per call)
- Implementation selection through factories MUST be O(1) lookup
- Runtime type checking limited to development/debug modes only
- All polymorphic layers MUST support horizontal scaling independently
- Caching strategies MUST work transparently across all implementations
- Scalability analysis (horizontal scaling capability)
- Bottleneck identification
- Caching strategies using approved singleton patterns
- Resource utilization estimates

### 6. Security Architecture
- Authentication and authorization patterns
- Data isolation mechanisms
- Secret management approach
- Audit logging requirements

### 7. Error Handling
- Error classification and handling strategies
- Rollback procedures
- Recovery mechanisms
- User experience during failures

### 8. Testing Strategy
- Unit test requirements (100% coverage target)
- Integration test patterns
- Performance test criteria
- Migration test procedures

### 9. Deployment Architecture
- Environment configurations
- Rollout strategy
- Rollback procedures
- Monitoring and alerting

### 10. Risk Assessment
- Technical risks and mitigations
- Operational risks
- Security risks
- Business continuity plans

### 11. Polymorphic Implementation Verification

**Mandatory Checklist for All Architecture Documents**:
- [ ] All data processing layers use Protocol-based interfaces
- [ ] Factory functions provided for runtime implementation selection
- [ ] Zero coupling between polymorphic layers (only Protocol dependencies)
- [ ] Performance impact of polymorphic calls measured and acceptable
- [ ] Extension mechanism documented for adding new implementations
- [ ] Migration path from existing monolithic code documented
- [ ] Test strategy covers all Protocol implementations
- [ ] Chart rendering, N-dimensional views supported through same architecture

### 12. Decision Log
- Key decisions with rationale
- Alternatives considered
- Trade-offs accepted
- Future considerations

### 12. Appendices
- Glossary of terms
- Reference documentation links
- Detailed calculations
- Supporting research

## Quality Checklist
- [ ] All diagrams use Mermaid syntax (no binary image files)
- [ ] All diagrams have descriptive captions
- [ ] Component names in diagrams match code
- [ ] All functions have complete signatures
- [ ] Set theory operations documented mathematically
- [ ] No unauthorized classes or JavaScript
- [ ] Performance implications analyzed
- [ ] Security boundaries clearly defined
- [ ] Error scenarios comprehensively covered
- [ ] Testing approach specified
- [ ] Rollback procedures documented
- [ ] Risks identified and mitigated
- [ ] Decisions justified with rationale
