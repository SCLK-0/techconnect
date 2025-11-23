# Agile Kanban Methodology for TechConnect Development

## Table of Contents
1. [Overview](#overview)
2. [Kanban Board Structure](#kanban-board-structure)
3. [Work Item Types](#work-item-types)
4. [Workflow Process](#workflow-process)
5. [Sprint Planning](#sprint-planning)
6. [Daily Standups](#daily-standups)
7. [Definition of Done](#definition-of-done)
8. [Metrics and Monitoring](#metrics-and-monitoring)
9. [Team Roles and Responsibilities](#team-roles-and-responsibilities)
10. [Best Practices](#best-practices)

---

## Overview

TechConnect follows an **Agile Kanban methodology** to manage the development of a web-based peer tutoring platform for the College of Industrial Technology (CIT) at Southern Luzon State University (SLSU). This methodology emphasizes continuous delivery, visual workflow management, and iterative improvement.

### Why Kanban?

- **Continuous Flow**: Features are developed and deployed continuously rather than in fixed sprints
- **Visual Management**: Clear visibility of work progress through board visualization
- **Flexibility**: Ability to reprioritize work based on changing requirements
- **Limit Work in Progress (WIP)**: Focus on completing tasks before starting new ones
- **Incremental Improvement**: Regular retrospectives to optimize the development process

---

## Kanban Board Structure

### Board Columns

Our Kanban board consists of the following columns:

```
┌─────────────┬─────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│   BACKLOG   │    TODO     │ IN PROGRESS │   REVIEW    │   TESTING   │    DONE     │
│             │             │             │             │             │             │
│  (No Limit) │  (Max: 10)  │  (Max: 5)   │  (Max: 3)   │  (Max: 3)   │  (Archive)  │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

#### 1. **BACKLOG**
- All identified features, bugs, and improvements
- Prioritized from top (highest) to bottom (lowest)
- No WIP limit
- Items are refined and estimated before moving to TODO

#### 2. **TODO** (WIP Limit: 10)
- Ready to be worked on
- Fully defined with acceptance criteria
- Dependencies resolved
- Assigned priority level

#### 3. **IN PROGRESS** (WIP Limit: 5)
- Currently being developed
- Assigned to specific team member(s)
- Includes active coding, database migrations, UI design
- Daily updates required

#### 4. **REVIEW** (WIP Limit: 3)
- Code review in progress
- Pull request created
- Awaiting peer feedback
- Must pass code quality checks

#### 5. **TESTING** (WIP Limit: 3)
- Functional testing
- User acceptance testing (UAT)
- Bug fixes if issues found
- Performance and security checks

#### 6. **DONE**
- Deployed to production (Vercel)
- Meets Definition of Done criteria
- Documented in PATCH-NOTES.md
- Archived after 2 weeks

---

## Work Item Types

### 1. **User Story**
Format: `As a [role], I want [feature] so that [benefit]`

**Example:**
```
Title: Learner can bookmark favorite tutors
Description: As a learner, I want to bookmark my favorite tutors 
so that I can quickly find and book sessions with them again.

Acceptance Criteria:
- [ ] Heart icon appears on tutor cards
- [ ] Clicking heart adds/removes from favorites
- [ ] Favorites page shows all bookmarked tutors
- [ ] Favorites persist across sessions
- [ ] Real-time sync with database

Priority: High
Estimate: 5 story points
```

### 2. **Bug**
Format: `[Component] - Brief description`

**Example:**
```
Title: [Video Session] - Whiteboard not syncing after reconnection
Description: When a user disconnects and reconnects, whiteboard 
drawings are not restored.

Steps to Reproduce:
1. Join video session
2. Draw on whiteboard
3. Disconnect internet
4. Reconnect
5. Whiteboard is blank

Expected: Whiteboard state should be restored
Actual: Whiteboard is empty

Priority: Critical
Affected Users: All
```

### 3. **Technical Task**
Format: `[Tech] - Description`

**Example:**
```
Title: [Tech] - Add database migration for donation QR codes
Description: Create migration to add donation_qr_code column 
to tutor_profiles table

Tasks:
- [ ] Create migration file
- [ ] Add column with TEXT type
- [ ] Add comment documentation
- [ ] Test migration locally
- [ ] Deploy to production

Priority: Medium
Estimate: 2 story points
```

### 4. **Enhancement**
Format: `[Enhancement] - Description`

**Example:**
```
Title: [Enhancement] - Add rating tags to feedback system
Description: Allow learners to add descriptive tags when rating 
tutors (e.g., "clear explanations", "patient & friendly")

Benefits:
- More detailed feedback
- Better tutor profiles
- Helps learners choose tutors

Priority: Medium
Estimate: 8 story points
```

### 5. **Documentation**
Format: `[Docs] - Description`

**Example:**
```
Title: [Docs] - Update USER-MANUAL.md with new features
Description: Document the favorite tutors feature and rating 
tags in the user manual

Tasks:
- [ ] Add screenshots
- [ ] Write step-by-step guide
- [ ] Update table of contents
- [ ] Review for clarity

Priority: Low
Estimate: 3 story points
```

---

## Workflow Process

### Moving Cards Between Columns

#### BACKLOG → TODO
**Criteria:**
- User story is fully defined
- Acceptance criteria are clear
- Dependencies identified and resolved
- Estimated (story points)
- Prioritized by Product Owner

**Actions:**
- Assign priority label (Critical, High, Medium, Low)
- Add story point estimate
- Tag with feature area (Video, Auth, Admin, etc.)

#### TODO → IN PROGRESS
**Criteria:**
- Developer has capacity (check WIP limit)
- No higher priority items in TODO
- All prerequisites completed

**Actions:**
- Assign to team member
- Move card to IN PROGRESS
- Update status in daily standup
- Create feature branch: `feature/[card-number]-brief-description`

#### IN PROGRESS → REVIEW
**Criteria:**
- Code is complete and tested locally
- All acceptance criteria met
- No known bugs
- Code follows style guidelines

**Actions:**
- Create pull request (PR)
- Link PR to card
- Request code review from peer
- Run automated checks (linting, type checking)
- Move card to REVIEW

#### REVIEW → TESTING
**Criteria:**
- Code review approved
- All review comments addressed
- PR merged to main branch
- Deployed to staging/preview environment

**Actions:**
- Notify QA/tester
- Provide test credentials if needed
- Share preview URL
- Move card to TESTING

#### TESTING → DONE
**Criteria:**
- All test cases passed
- No critical bugs found
- Deployed to production (Vercel)
- Documentation updated

**Actions:**
- Update PATCH-NOTES.md
- Close related issues
- Notify stakeholders
- Move card to DONE
- Archive after 2 weeks

---

## Sprint Planning

While Kanban emphasizes continuous flow, we use **weekly planning sessions** to:

### Weekly Planning Meeting (Every Monday, 1 hour)

**Agenda:**
1. **Review Last Week** (15 min)
   - What was completed?
   - What's still in progress?
   - Any blockers?

2. **Prioritize Backlog** (20 min)
   - Review new items
   - Re-prioritize based on feedback
   - Identify dependencies

3. **Capacity Planning** (15 min)
   - Check team availability
   - Assign high-priority items
   - Set weekly goals

4. **Risk Assessment** (10 min)
   - Identify potential blockers
   - Plan mitigation strategies
   - Assign backup resources

**Output:**
- Top 10 prioritized items in TODO
- Clear assignments for the week
- Documented blockers and solutions

---

## Daily Standups

### Format (15 minutes max, Daily at 9:00 AM)

Each team member answers:

1. **What did I complete yesterday?**
   - Specific tasks/cards moved
   - Any deployments made

2. **What will I work on today?**
   - Specific cards to progress
   - Expected completion time

3. **Any blockers or help needed?**
   - Technical issues
   - Waiting on reviews
   - Need clarification

**Example:**
```
Developer 1:
✅ Yesterday: Completed favorite tutors feature, moved to TESTING
🎯 Today: Fix whiteboard sync bug, start rating tags migration
🚧 Blockers: Need design approval for rating tags UI

Developer 2:
✅ Yesterday: Reviewed 2 PRs, deployed donation QR feature
🎯 Today: Work on admin analytics dashboard
🚧 Blockers: None

Developer 3:
✅ Yesterday: Updated user manual, tested video session features
🎯 Today: Test favorite tutors feature, document findings
🚧 Blockers: Waiting for staging environment access
```

---

## Definition of Done

A work item is considered **DONE** when:

### Code Quality
- [ ] Code follows TypeScript/React best practices
- [ ] No ESLint errors or warnings
- [ ] Type safety maintained (no `any` types without justification)
- [ ] Code is properly commented
- [ ] Reusable components created where appropriate

### Functionality
- [ ] All acceptance criteria met
- [ ] Feature works as expected in all scenarios
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] Loading states added

### Testing
- [ ] Manually tested in development
- [ ] Tested in different browsers (Chrome, Firefox, Safari, Edge)
- [ ] Tested on mobile devices (responsive design)
- [ ] No console errors
- [ ] Performance is acceptable (no lag)

### Database
- [ ] Migrations created and tested
- [ ] RLS policies implemented
- [ ] Indexes added for performance
- [ ] Database functions documented
- [ ] Rollback plan exists

### Security
- [ ] Authentication/authorization checked
- [ ] Input validation implemented
- [ ] SQL injection prevention (using Supabase safely)
- [ ] XSS prevention
- [ ] Sensitive data protected

### Documentation
- [ ] Code comments added
- [ ] PATCH-NOTES.md updated
- [ ] USER-MANUAL.md updated (if user-facing)
- [ ] README.md updated (if needed)
- [ ] API changes documented

### Deployment
- [ ] Deployed to Vercel production
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] No breaking changes (or communicated)
- [ ] Rollback tested

### Review
- [ ] Code reviewed by at least one peer
- [ ] All review comments addressed
- [ ] Product Owner approved (if major feature)
- [ ] Stakeholders notified

---

## Metrics and Monitoring

### Key Performance Indicators (KPIs)

#### 1. **Cycle Time**
- **Definition**: Time from TODO → DONE
- **Target**: < 5 days for medium tasks
- **Measurement**: Track card movement timestamps

#### 2. **Lead Time**
- **Definition**: Time from BACKLOG → DONE
- **Target**: < 10 days for medium tasks
- **Measurement**: Track from card creation to completion

#### 3. **Throughput**
- **Definition**: Number of cards completed per week
- **Target**: 8-12 cards per week (team of 3)
- **Measurement**: Count DONE cards weekly

#### 4. **Work in Progress (WIP)**
- **Definition**: Number of cards in IN PROGRESS
- **Target**: ≤ 5 cards
- **Measurement**: Daily count at standup

#### 5. **Blocked Items**
- **Definition**: Cards waiting on external dependencies
- **Target**: < 2 blocked items at any time
- **Measurement**: Track blocked label usage

#### 6. **Bug Escape Rate**
- **Definition**: Bugs found in production vs. testing
- **Target**: < 10% escape to production
- **Measurement**: Track bug source (testing vs. production)

### Weekly Metrics Review

Every Friday, review:
- Cumulative flow diagram
- Cycle time trends
- Blocked items resolution time
- Team velocity (story points completed)

---

## Team Roles and Responsibilities

### Product Owner
**Responsibilities:**
- Prioritize backlog
- Define acceptance criteria
- Approve completed features
- Communicate with stakeholders
- Make scope decisions

**Time Commitment:** 5-10 hours/week

### Development Team (3 Developers)
**Responsibilities:**
- Develop features
- Write clean, maintainable code
- Conduct code reviews
- Fix bugs
- Update documentation
- Participate in standups and planning

**Time Commitment:** Full-time

### QA/Tester (Can be rotating developer)
**Responsibilities:**
- Test new features
- Report bugs with clear reproduction steps
- Verify bug fixes
- Perform regression testing
- Update test documentation

**Time Commitment:** 10-15 hours/week

### Scrum Master/Facilitator
**Responsibilities:**
- Facilitate meetings
- Remove blockers
- Track metrics
- Ensure process adherence
- Continuous improvement initiatives

**Time Commitment:** 5-10 hours/week

---

## Best Practices

### 1. **Limit Work in Progress**
- Respect WIP limits strictly
- Finish tasks before starting new ones
- Help teammates complete their work

### 2. **Pull, Don't Push**
- Team members pull work from TODO when ready
- Don't assign work without consent
- Respect individual capacity

### 3. **Make Work Visible**
- Update cards daily
- Add comments for progress updates
- Use labels for quick identification
- Attach screenshots/links

### 4. **Continuous Improvement**
- Weekly retrospectives
- Experiment with process changes
- Measure impact of changes
- Celebrate successes

### 5. **Focus on Flow**
- Identify and remove bottlenecks
- Balance work across columns
- Prioritize unblocking teammates
- Maintain steady pace

### 6. **Quality Over Speed**
- Don't rush to meet arbitrary deadlines
- Ensure Definition of Done is met
- Refactor when needed
- Write maintainable code

### 7. **Collaborate Actively**
- Pair programming for complex features
- Quick code reviews (< 24 hours)
- Share knowledge in standups
- Help teammates when blocked

### 8. **Maintain Documentation**
- Update docs as you code
- Keep PATCH-NOTES.md current
- Document decisions in cards
- Create runbooks for complex features

---

## Kanban Board Example

### Current Sprint (Week of Nov 18-24, 2024)

```
┌─────────────────────────────────────────────────────────────────────────┐
│ BACKLOG (15 items)                                                      │
├─────────────────────────────────────────────────────────────────────────┤
│ 🔴 [Bug] Video freezes on poor connection                              │
│ 🟡 [Enhancement] Add tutor certification badges                        │
│ 🟢 [Feature] Email reminders for upcoming sessions                     │
│ 🔵 [Tech] Optimize database queries for tutor search                   │
│ 📄 [Docs] Create API documentation                                     │
│ ... (10 more items)                                                     │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ TODO (7 items) - WIP Limit: 10                                         │
├─────────────────────────────────────────────────────────────────────────┤
│ 🔴 [Bug] Whiteboard not syncing after reconnect (Dev1) - 3 pts        │
│ 🟡 [Enhancement] Add session recording feature (Unassigned) - 13 pts   │
│ 🟢 [Feature] Tutor can set custom session rates (Dev2) - 8 pts        │
│ 🔵 [Tech] Migrate to new Supabase realtime API (Dev3) - 5 pts         │
│ 📄 [Docs] Update deployment guide (Dev1) - 2 pts                       │
│ 🟡 [Enhancement] Dark mode improvements (Unassigned) - 5 pts           │
│ 🟢 [Feature] Bulk session scheduling (Unassigned) - 8 pts             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ IN PROGRESS (4 items) - WIP Limit: 5                                   │
├─────────────────────────────────────────────────────────────────────────┤
│ 🟢 [Feature] Favorite tutors (Dev1) - Day 3/5                         │
│   └─ 80% complete, testing locally                                     │
│                                                                         │
│ 🟡 [Enhancement] Rating tags system (Dev2) - Day 2/4                  │
│   └─ Database migration done, working on UI                            │
│                                                                         │
│ 🔴 [Bug] Session timer not stopping (Dev3) - Day 1/2                  │
│   └─ Root cause identified, implementing fix                           │
│                                                                         │
│ 📄 [Docs] User manual update (Dev1) - Day 1/2                         │
│   └─ Adding screenshots for new features                               │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ REVIEW (2 items) - WIP Limit: 3                                        │
├─────────────────────────────────────────────────────────────────────────┤
│ 🟢 [Feature] Donation QR code (Dev2)                                   │
│   └─ PR #145 - Awaiting Dev1 review                                    │
│                                                                         │
│ 🔵 [Tech] Auto cleanup past time slots (Dev3)                         │
│   └─ PR #146 - Approved, needs final check                             │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ TESTING (2 items) - WIP Limit: 3                                       │
├─────────────────────────────────────────────────────────────────────────┤
│ 🟡 [Enhancement] Disconnect reason tracking (QA)                       │
│   └─ Testing on staging, found 1 minor issue                           │
│                                                                         │
│ 🟢 [Feature] Admin live monitoring (QA)                               │
│   └─ All test cases passed, ready for production                       │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ DONE (This Week: 6 items)                                              │
├─────────────────────────────────────────────────────────────────────────┤
│ ✅ [Feature] Registered year tracking - Deployed Nov 17                │
│ ✅ [Enhancement] Improved video controls - Deployed Nov 18             │
│ ✅ [Bug] Fixed camera overlay visibility - Deployed Nov 19             │
│ ✅ [Tech] Database performance optimization - Deployed Nov 20          │
│ ✅ [Docs] Updated README with new features - Deployed Nov 21           │
│ ✅ [Feature] Session reschedule functionality - Deployed Nov 22        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Retrospective Template

### Weekly Retrospective (Every Friday, 30 minutes)

#### What Went Well? 👍
- List positive outcomes
- Celebrate wins
- Acknowledge good practices

#### What Didn't Go Well? 👎
- Identify problems
- Discuss challenges
- Note frustrations

#### What Can We Improve? 💡
- Propose solutions
- Suggest process changes
- Identify learning opportunities

#### Action Items 🎯
- Specific, measurable actions
- Assign owners
- Set deadlines
- Track in next retrospective

**Example:**
```
Date: November 22, 2024

👍 What Went Well:
- Deployed 6 features this week (above target)
- Code reviews completed within 24 hours
- No production bugs reported
- Good collaboration on whiteboard feature

👎 What Didn't Go Well:
- Testing phase took longer than expected
- Some cards lacked clear acceptance criteria
- Staging environment was down for 2 hours
- Documentation updates lagged behind features

💡 What Can We Improve:
- Add acceptance criteria checklist to card template
- Set up automated staging environment health checks
- Allocate dedicated time for documentation
- Improve test case coverage

🎯 Action Items:
1. Create card template with acceptance criteria (Owner: Dev1, Due: Nov 25)
2. Set up staging monitoring (Owner: Dev3, Due: Nov 27)
3. Block 2 hours/week for documentation (Owner: All, Start: Nov 25)
4. Write test cases before coding (Owner: All, Ongoing)
```

---

## Tools and Technologies

### Recommended Kanban Tools

1. **GitHub Projects** (Recommended for TechConnect)
   - Integrated with repository
   - Free for public/private repos
   - Automation rules
   - Custom fields

2. **Trello**
   - Simple and visual
   - Power-ups for automation
   - Mobile app

3. **Jira**
   - Enterprise-grade
   - Advanced reporting
   - Agile metrics

4. **Notion**
   - All-in-one workspace
   - Flexible databases
   - Documentation integration

### Integration with Development Tools

- **Git Branches**: `feature/[card-id]-description`
- **Commit Messages**: `[Card-123] Add favorite tutors feature`
- **Pull Requests**: Link to card number
- **Deployment**: Auto-update card status on merge

---

## Conclusion

This Agile Kanban methodology provides a flexible, visual, and efficient framework for developing TechConnect. By following these practices, the team can:

- Deliver features continuously
- Maintain high code quality
- Respond quickly to changes
- Improve processes iteratively
- Keep stakeholders informed

**Remember:** The methodology should serve the team, not the other way around. Adapt and evolve these practices based on what works best for your specific context.

---

**Document Version:** 1.0  
**Last Updated:** November 23, 2024  
**Next Review:** December 23, 2024
