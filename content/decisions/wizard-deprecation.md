# Decision Record: Deprecate Onboarding Wizard

**Date:** December 10, 2025  
**Decision Maker:** Sarah (PM)  
**Status:** Approved

## Context

The v1 onboarding wizard launched in May 2025 with the goal of improving user activation by collecting preferences upfront.

## Problem

- Activation rate dropped to 32% (from 45% baseline)
- 68% of users abandoned at step 3 (department selection)
- Mobile completion rate was only 18%
- User feedback consistently negative about "too many questions"

## Decision

Deprecate the wizard approach entirely. Move to a contextual, progressive profiling model.

## Alternatives Considered

### Option A: Simplify the Wizard

- Reduce to 3 steps
- Make more fields optional
- **Rejected:** Still forces users through flow before value

### Option B: Skip for Now

- Remove onboarding entirely
- Rely on help docs
- **Rejected:** Leaves users confused, doesn't solve activation

### Option C: Contextual Profiling (Chosen)

- Immediate app access
- Ask questions in context when needed
- Infer preferences from behavior
- **Accepted:** Aligns with activation OKR, follows industry best practices

## Consequences

- Need to redesign empty states
- Need to build contextual prompt system
- May collect less data initially (acceptable tradeoff)
- Aligns with Roy conversational UI direction

## Follow-up Actions

- Prototype 3 approaches (Lisa)
- User test by Dec 19
- Ship new approach in January
