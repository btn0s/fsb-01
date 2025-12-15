# Meeting Transcript: Anthony Sync 2

**Date:** November 28, 2025  
**Attendees:** Anthony, Brendan

---

## Core Design Principles for Ola Agentic

**Primary rule:** If it doesn't exist in the app today, we don't include it

- Focus on shipping hybrid version, not full Roy vision
- Avoid feature creep and scope expansion

**Agentic approach:** Minimal clicks, proactive suggestions

- All features accessible through agent interface
- Quick actions based on calendar context and location

**Current supported features limited to:**

- Food and beverage (cafes, menus)
- Room booking via MS Graph
- Events calendar
- Coffee ordering only actionable item

## Quick Actions and AI Logic

Quick action recommendations remain mysterious black box

- MS Graph and Lizel determining recommendation logic
- Historical behavior + calendar context + location factors
- Toby needs to define specific rule sets and decision trees

**Limited current capabilities:**

- Room booking notifications when no room reserved
- Coffee ordering (90% of usage according to Toby)
- Menu browsing (view-only, no ordering capability)
- No lunch ordering, transportation, or parking support

## Task Management System

"Tasks" are agent workflows, not user to-dos

- View-only for users during execution
- Show duration and progress of automated processes
- Complete tasks show results with potential "order again" buttons

**Task interaction requirements:**

- Cancel in-progress tasks (minimum viable feature)
- Bottom sheet for task details and results
- Timestamp and completion status
- Links to external systems (Outlook calendar, etc.)

## Discover vs Home Page Strategy

**Home:** Proactive, contextual, agent-driven experience

- Auto-generated suggestions based on schedule
- Quick actions for immediate productivity needs

**Discover:** Traditional UI fallback

- Manual browsing of menus and events
- Compromise for stakeholders wanting familiar interfaces
- Buried deeper in app (requires two swipes)

## Adaptive UI Form Patterns

Simplify to three core form types:

- Multi-select (with/without images)
- Single select
- Smart search (for contacts/complex data)

- Abandon complex multi-step wizards
- Use standard form inputs instead of custom flows
- Pre-fill forms based on natural language parsing
- Agent pulls relevant form, pre-populates known data

## Voice Mode Approach

- Voice as transcript layer over text experience
- Oscillate between voice and text seamlessly
- Voice limitations require fallback to visual forms
- Default to transcript view for voice interactions
- Can transition to text mode for complex inputs
- Avoid designing separate voice-only experiences

## Memory and Data Constraints

- Major gap: Toby hasn't defined available memory/data endpoints
- Current state vs. future Roy vision creates design conflicts

**Need clear definition of:**

- User preference data access
- Historical behavior tracking
- Contextual recommendation capabilities
- Design decisions blocked without memory specifications

## Next Steps

- Brendan: Create 3-5 wireframes for minimal form patterns (weekend)
- Anthony: Clean up in-between states, add reasoning/loading states, prototype flows
- Both: Develop unified principles document and voice UI stance
- Monday presentation: Simplified, consistent system with clear guardrails
- Establish recurring design sync separate from Toby meetings
