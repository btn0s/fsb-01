# Comparison: Current Roy App vs OLA Goals & Principles

**Date:** December 14, 2025  
**Purpose:** Gap analysis between current implementation and OLA design goals

---

## ✅ Alignments

### 1. Agent-Driven Workflows

- **Current:** ✅ Chat interface handles all interactions, workflows run async
- **OLA Goal:** ✅ "All complex tasks handled through chat interface"
- **Status:** Aligned - Roy uses conversational interface for all interactions

### 2. Task Management Philosophy

- **Current:** ✅ Tasks are agent workflows (design/engineering), view-only during execution, show progress
- **OLA Goal:** ✅ "Tasks are agent workflows, not user to-dos. View-only for users during execution"
- **Status:** Aligned - Implementation matches the philosophy

### 3. Minimal CTAs, Natural Language

- **Current:** ✅ Single chat input, no complex UI navigation
- **OLA Goal:** ✅ "Minimal CTAs - most interactions via natural language"
- **Status:** Aligned - Clean, minimal interface

### 4. Voice + Text Support

- **Current:** ✅ Text input supported (voice could be added as transcript layer)
- **OLA Goal:** ✅ "Voice and text input supported with Hero app-style simplicity"
- **Status:** Partially aligned - Text works, voice not yet implemented

### 5. Workflow Status & Results

- **Current:** ✅ Shows workflow status, duration, results with links
- **OLA Goal:** ✅ "Show duration and progress, complete tasks show results"
- **Status:** Aligned - Task display matches requirements

---

## ⚠️ Partial Alignments / Gaps

### 1. Proactive Suggestions & Context

- **Current:** ❌ No proactive suggestions, no "up next" calendar
- **OLA Goal:** ✅ "Proactive, contextual, agent-driven experience. Auto-generated suggestions based on schedule"
- **Gap:** Missing contextual home screen with calendar anchor and quick actions
- **Impact:** Medium - Core to OLA's value proposition

### 2. Calendar Integration

- **Current:** ❌ No calendar integration, no "up next" display
- **OLA Goal:** ✅ "Up next as anchor point" showing next 2 calendar events
- **Gap:** No calendar data or display
- **Impact:** High - Calendar is central to workplace concierge positioning

### 3. Quick Actions

- **Current:** ❌ No quick actions section
- **OLA Goal:** ✅ "Quick actions section (may be relocated to agent flow)" for immediate productivity needs
- **Gap:** No contextual quick actions based on calendar/location
- **Impact:** Medium - Reduces friction for common tasks

### 4. Memory System

- **Current:** ❌ No memory system UI or management
- **OLA Goal:** ✅ Three-tier memory model (System/Admin/User), memory management screens needed
- **Gap:** No memory architecture, no preference management
- **Impact:** High - Critical differentiator vs Copilot

### 5. Feature Scope

- **Current:** ✅ Design/engineering workflows, context search
- **OLA Goal:** ✅ Room booking, coffee/food ordering, event discovery
- **Gap:** Different feature set - Roy is dev-focused, OLA is workplace-focused
- **Impact:** High - Different use cases entirely

### 6. Form Patterns

- **Current:** ❌ No forms implemented (chat-only)
- **OLA Goal:** ✅ Three form types: multi-select, single select, smart search. Pre-fill from natural language
- **Gap:** No adaptive form system
- **Impact:** Medium - Needed for complex inputs (room booking, food ordering)

### 7. Home vs Discover Strategy

- **Current:** ❌ Single chat interface, no home/discover split
- **OLA Goal:** ✅ Home (proactive) vs Discover (traditional UI fallback, buried deeper)
- **Gap:** No dual-mode interface
- **Impact:** Low - Could be added later

### 8. Contextual Notifications

- **Current:** ❌ No notification area
- **OLA Goal:** ✅ "Contextual notifications area" for time-sensitive info
- **Gap:** No notification system
- **Impact:** Medium - Important for workplace concierge

---

## ❌ Major Misalignments

### 1. Use Case Focus

- **Current:** Developer productivity tool (design/engineering workflows, code generation)
- **OLA Goal:** Workplace concierge (room booking, food ordering, event discovery)
- **Gap:** Fundamentally different products
- **Note:** This appears intentional - Roy is the platform, OLA is a specific implementation

### 2. Desktop App vs Mobile-First

- **Current:** ✅ Desktop app window (macOS-style)
- **OLA Goal:** ✅ Mobile-first (Hero app-style), but desktop overlay mentioned for personal context
- **Gap:** Current is desktop-only, OLA needs mobile
- **Impact:** Medium - Different form factors

### 3. Calendar as Anchor

- **Current:** ❌ No calendar integration
- **OLA Goal:** ✅ Calendar is the anchor point ("up next" showing 2 events)
- **Gap:** Missing core OLA feature
- **Impact:** High - Calendar is central to workplace experience

### 4. Room Booking Intelligence

- **Current:** ❌ Not implemented
- **OLA Goal:** ✅ Automated room selection (same floor → adjacent → building), no user choice unless requested
- **Gap:** Complete feature missing
- **Impact:** High - One of three primary OLA features

### 5. Food Ordering

- **Current:** ❌ Not implemented
- **OLA Goal:** ✅ Coffee ordering (90% of usage), menu browsing
- **Gap:** Complete feature missing
- **Impact:** High - One of three primary OLA features

### 6. Event Discovery

- **Current:** ❌ Not implemented
- **OLA Goal:** ✅ Event discovery and browsing
- **Gap:** Complete feature missing
- **Impact:** High - One of three primary OLA features

---

## 🎯 Key Insights

### What Roy Does Well (Platform Foundation)

1. **Conversational Interface** - Clean, minimal chat UI ✅
2. **Async Workflows** - Background task execution matches OLA philosophy ✅
3. **Context Search** - Can search OKRs, PRDs, transcripts (institutional memory foundation) ✅
4. **Workflow Status** - Clear progress and result display ✅
5. **Thread Management** - Conversation history and organization ✅

### What OLA Needs That Roy Doesn't Have

1. **Calendar Integration** - "Up next" anchor point
2. **Memory System** - Three-tier architecture (System/Admin/User)
3. **Quick Actions** - Contextual suggestions based on schedule/location
4. **Workplace Features** - Room booking, food ordering, event discovery
5. **Proactive Suggestions** - Auto-generated based on context
6. **Form System** - Adaptive forms (multi-select, single select, smart search)
7. **Notification Area** - Contextual, time-sensitive information

### Architecture Alignment

- **Roy as Platform:** ✅ Makes sense - Roy provides the agentic framework
- **OLA as Implementation:** ✅ Uses Roy platform for workplace-specific features
- **Gap:** Need to bridge Roy's dev-focused tools to OLA's workplace features

---

## 📋 Recommendations

### Immediate Priorities (OLA MVP)

1. **Add Calendar Integration**

   - Display "up next" with 2 events
   - Use as anchor point for home screen
   - Integrate with MS Graph

2. **Implement Memory System**

   - Three-tier architecture
   - Memory management UI
   - Preference storage and retrieval

3. **Add Quick Actions**

   - Contextual suggestions based on calendar
   - Common workplace tasks (room booking, coffee ordering)
   - Location-aware recommendations

4. **Build Form System**
   - Three form types (multi-select, single select, smart search)
   - Pre-fill from natural language parsing
   - Agent-driven form selection

### Medium-Term (Post-MVP)

1. **Proactive Suggestions**

   - Auto-generate based on schedule/time
   - Morning: parking, afternoon: events, lunch: food options

2. **Notification Area**

   - Time-sensitive contextual information
   - Room booking reminders, event notifications

3. **Home vs Discover**
   - Split interface (proactive vs manual browsing)
   - Bury Discover deeper (two swipes)

### Long-Term (Platform Evolution)

1. **Workplace Feature Integration**

   - Room booking with automated selection
   - Food ordering (coffee first, then lunch)
   - Event discovery and browsing

2. **Voice Mode**
   - Transcript layer over text
   - Seamless voice/text oscillation

---

## 🎨 Design Pattern Comparison

### Current Roy App

- **Layout:** Sidebar (threads) + Main (chat/tasks)
- **Navigation:** Tabs (Chat/Tasks)
- **Interaction:** Single chat input
- **Focus:** Developer productivity

### OLA Vision

- **Layout:** Home (up next + quick actions + notifications) + Chat (agent interface)
- **Navigation:** Swipe-based (like Perplexity), Discover buried deeper
- **Interaction:** Natural language + quick actions + forms
- **Focus:** Workplace concierge

### Bridge Strategy

- Keep Roy's clean chat interface ✅
- Add calendar "up next" as header/anchor
- Add quick actions panel (collapsible)
- Add notification area (time-sensitive)
- Integrate workplace features as workflows
- Build memory system as foundation

---

## Conclusion

**Roy is well-positioned as a platform** but needs workplace-specific features for OLA:

- ✅ Strong foundation: conversational interface, async workflows, context search
- ⚠️ Missing: Calendar integration, memory system, quick actions
- ❌ Different focus: Dev productivity vs workplace concierge

**Recommendation:** Use Roy as the agentic platform, add OLA-specific UI components (calendar anchor, quick actions, notifications) and integrate workplace features as specialized workflows.
