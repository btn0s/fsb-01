# Meeting Transcript: OLA Review

**Date:** November 30, 2025  
**Attendees:** Anthony, Toby

---

## Ola Product Vision & Positioning

- Core positioning: workplace concierge/chief of staff vs. Copilot's generic productivity focus
- End-to-end workplace experience covering calendar, campus, personal preferences, physical workplace
- Differentiation through workplace-specific integration and memory system
- Copilot handles booking basics but fails at details (can't specify room B1)
- Ola aims for better accuracy with contextual memory

## Current Feature Constraints & Scope

**Three primary features for current version:**

- Room booking with automated selection
- Coffee/food ordering
- Event discovery

**Missing capabilities identified:**

- No full calendar view (only "up next" showing 2 items)
- No wayfinding control (third-party embedded solution)
- Limited memory system for current release

## Design System & User Experience Framework

**Flexible home screen layout:**

- "Up next" as anchor point
- Quick actions section (may be relocated to agent flow)
- Contextual notifications area

**Agent-driven workflows replacing traditional UI:**

- All complex tasks handled through chat interface
- Minimal CTAs - most interactions via natural language
- Voice and text input supported with Hero app-style simplicity

## Memory System Architecture (Priority Design Need)

**Three-tier memory model:**

- System rules (default Ola behavior)
- Admin rules (LinkedIn workplace preferences)
- User memory (personal preferences)

**Required for next Tuesday presentation:**

- Onboarding flow questions document
- Memory management screen designs
- Clear API documentation for supported endpoints

## Room Booking Intelligence

**Automated room selection philosophy:**

- System chooses closest available room based on location
- No user choice unless specific request made
- Addresses utilization problems (ghost meetings, oversized bookings)
- Default logic: same floor → adjacent floors → building level
- Edge case handling for special requests (specific rooms, buildings)

## Agent Workflow Integration

**Modular system for future workflow expansion:**

- Expense reporting agents
- Transportation coordination
- Custom departmental workflows

**Roy platform potential:**

- Memory as a service layer
- Workflow builder for enterprise clients
- Generic UI for non-custom implementations

## Transportation Feature Development

- Near-future high-value feature for differentiation

**End-to-end transportation agent capabilities:**

- Live traffic integration
- Bus schedule coordination
- Personalized commute preferences
- Meeting scheduled with transportation team (next two weeks)

## Next Steps

- Brendan: Design home screen variations with notification panel integration
- Anthony: Document memory onboarding questions for food, events, scheduling features
- Anthony: Hi-fi designs for locked wireframes with decision comments
- Anthony: Brain dump workplace priorities/metrics for design context
- Tuesday presentation: Complete design system + memory workflow demonstration
