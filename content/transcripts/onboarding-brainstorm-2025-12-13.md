# Meeting Transcript: Onboarding Brainstorm

**Date:** December 13, 2025  
**Attendees:** Sarah (PM), Mike (Eng Lead), Lisa (Design)

---

**Sarah:** Okay, so we need to revisit onboarding. The wizard clearly didn't work. What are we thinking?

**Mike:** I've been looking at what Notion and Linear do. They basically let you in immediately and show contextual tips as you explore.

**Lisa:** Yeah, the "empty state as onboarding" pattern. Instead of a wizard, you see placeholder content that teaches you the app.

**Sarah:** I like that. But how do we capture the preferences we need? Like department, location, dietary restrictions for the food features?

**Mike:** We could infer a lot from their calendar and badge data. If they're badging into Building A, we know their location.

**Lisa:** And for food, just ask the first time they order. "Hey, any dietary preferences we should know about?"

**Sarah:** Contextual, not upfront. I like it. What about the people who never engage with certain features?

**Mike:** Then we don't need that data from them. Only ask for what's needed, when it's needed.

**Lisa:** We should prototype a few approaches. Maybe:

1. Pure empty state with tips
2. Light questionnaire (2-3 questions max) then empty state
3. AI-assisted where Roy asks questions conversationally

**Sarah:** I love the Roy option. Feels more natural. But that might be more complex to build.

**Mike:** Not necessarily. If we have the conversational UI already, Roy can just guide them through. "Hey, I noticed you haven't set up your food preferences yet. Want to do that now?"

**Sarah:** Okay, let's prototype all three and test with users next week.

---

## Action Items

- [ ] Lisa: Create wireframes for all 3 approaches
- [ ] Mike: Check feasibility of badge/calendar data for inference
- [ ] Sarah: Set up user testing sessions for next week

