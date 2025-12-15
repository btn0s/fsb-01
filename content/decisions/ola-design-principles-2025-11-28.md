# Decision: OLA Design Principles

**Date:** November 28, 2025  
**Status:** Approved  
**Context:** Core design principles established for OLA agentic interface

---

## Primary Rule

**If it doesn't exist in the app today, we don't include it.**

- Focus on shipping hybrid version, not full Roy vision
- Avoid feature creep and scope expansion

## Agentic Approach

- Minimal clicks, proactive suggestions
- All features accessible through agent interface
- Quick actions based on calendar context and location

## Current Feature Scope

**Supported features (current version):**

- Food and beverage (cafes, menus)
- Room booking via MS Graph
- Events calendar
- Coffee ordering (only actionable item)

**Not included:**

- Lunch ordering
- Transportation
- Parking support

## Task Management Philosophy

"Tasks" are agent workflows, not user to-dos:

- View-only for users during execution
- Show duration and progress of automated processes
- Complete tasks show results with potential "order again" buttons

## Home vs Discover Strategy

**Home:** Proactive, contextual, agent-driven experience

- Auto-generated suggestions based on schedule
- Quick actions for immediate productivity needs

**Discover:** Traditional UI fallback

- Manual browsing of menus and events
- Compromise for stakeholders wanting familiar interfaces
- Buried deeper in app (requires two swipes)

## Form Patterns

Simplify to three core form types:

1. Multi-select (with/without images)
2. Single select
3. Smart search (for contacts/complex data)

- Abandon complex multi-step wizards
- Use standard form inputs instead of custom flows
- Pre-fill forms based on natural language parsing

## Voice Mode

- Voice as transcript layer over text experience
- Oscillate between voice and text seamlessly
- Default to transcript view for voice interactions
- Avoid designing separate voice-only experiences

## Rationale

These principles ensure we ship a focused MVP that demonstrates the agentic value proposition without over-engineering. The hybrid approach balances innovation with familiarity.
