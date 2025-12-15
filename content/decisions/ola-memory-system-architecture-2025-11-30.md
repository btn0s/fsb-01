# Decision: OLA Memory System Architecture

**Date:** November 30, 2025  
**Status:** Approved  
**Context:** Three-tier memory model for OLA agentic system

---

## Memory System Architecture

**Three-tier memory model:**

1. **System rules** - Default Ola behavior
2. **Admin rules** - LinkedIn workplace preferences
3. **User memory** - Personal preferences

## Room Booking Intelligence

**Automated room selection philosophy:**

- System chooses closest available room based on location
- No user choice unless specific request made
- Addresses utilization problems (ghost meetings, oversized bookings)

**Default logic:**

- Same floor → adjacent floors → building level
- Edge case handling for special requests (specific rooms, buildings)

## Memory Requirements

**Required for implementation:**

- Onboarding flow questions document
- Memory management screen designs
- Clear API documentation for supported endpoints
- User preference data access
- Historical behavior tracking
- Contextual recommendation capabilities

## Rationale

The three-tier model allows for workplace-wide defaults while preserving individual customization. Automated room selection reduces friction and improves space utilization.

## Next Steps

- Document memory onboarding questions for food, events, scheduling features
- Design memory management screens
- Define API endpoints for memory access
