# Rating Display Example

## Tutor Profile Dialog - Complete View

```
┌─────────────────────────────────────────────────────────────┐
│ Tutor Profile                                          [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────┐                                                     │
│  │ JD │  John Doe                                          │
│  └────┘  4th Year BS Computer Science                      │
│          ⚡ Online    ⭐ 4.5 (40 reviews)                   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Subject Expertise                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │
│  │ Math     │ │ Physics  │ │ Chemistry│                    │
│  └──────────┘ └──────────┘ └──────────┘                    │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Rating Breakdown                                           │
│  5 ⭐ ████████████████████████████ 45% (18)                │
│  4 ⭐ ████████████████████         30% (12)                │
│  3 ⭐ ████████████                 20% (8)                 │
│  2 ⭐ ████                         5%  (2)                 │
│  1 ⭐                              0%  (0)                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Top Qualities                                              │
│  ┌──────────────────────────────┐                          │
│  │ 🎯 Clear Explanations 85% (34)│                         │
│  └──────────────────────────────┘                          │
│  ┌──────────────────────────────┐                          │
│  │ 💬 Great Communication 70% (28)│                        │
│  └──────────────────────────────┘                          │
│  ┌──────────────────────────────┐                          │
│  │ ⏰ Always On Time 65% (26)    │                         │
│  └──────────────────────────────┘                          │
│  ┌──────────────────────────────┐                          │
│  │ 😊 Patient & Friendly 60% (24)│                         │
│  └──────────────────────────────┘                          │
│  ┌──────────────────────────────┐                          │
│  │ 🧠 Very Knowledgeable 55% (22)│                         │
│  └──────────────────────────────┘                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  About                                                      │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Passionate about teaching and helping students        │ │
│  │ understand complex concepts. I specialize in making   │ │
│  │ difficult topics easy to grasp through practical      │ │
│  │ examples and patient guidance.                        │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ⏰ Next available: Today at 3:00 PM                       │
│                                                             │
│  ┌──────────────────┐  ┌──────────────────────────┐       │
│  │  Book Session    │  │ ⚡ Start Instant Session │       │
│  └──────────────────┘  └──────────────────────────┘       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Key Features Explained

### 1. Rating Breakdown Section
Shows the distribution of star ratings:
- **Visual Progress Bar**: Proportional to percentage
- **Percentage**: Shows what % of reviews gave this rating
- **Count**: Shows actual number of reviews (in parentheses)
- **Order**: 5 stars to 1 star (best to worst)

### 2. Top Qualities Section
Shows the most mentioned rating tags:
- **Emoji**: Visual identifier for each quality
- **Label**: Descriptive name of the quality
- **Percentage**: What % of reviewers mentioned this (can exceed 100% total)
- **Count**: How many reviewers mentioned it (in parentheses)
- **Limit**: Shows top 5 qualities only

## Calculation Examples

### Star Rating Distribution
```
Total Reviews: 40

5-star reviews: 18
  → Percentage: (18 / 40) × 100 = 45%

4-star reviews: 12
  → Percentage: (12 / 40) × 100 = 30%

3-star reviews: 8
  → Percentage: (8 / 40) × 100 = 20%

2-star reviews: 2
  → Percentage: (2 / 40) × 100 = 5%

1-star reviews: 0
  → Percentage: (0 / 40) × 100 = 0%

Total: 100% ✓
```

### Rating Tags Percentage
```
Total Reviews: 40

"Clear Explanations" mentioned: 34 times
  → Percentage: (34 / 40) × 100 = 85%

"Great Communication" mentioned: 28 times
  → Percentage: (28 / 40) × 100 = 70%

"Always On Time" mentioned: 26 times
  → Percentage: (26 / 40) × 100 = 65%

Note: Learners can select multiple tags per review,
so percentages don't need to sum to 100%
```

## Real-World Interpretation

### Example 1: Excellent Tutor
```
Rating Breakdown:
5 ⭐ ████████████████████████████ 70% (28)
4 ⭐ ████████████                 25% (10)
3 ⭐ ██                           5%  (2)
2 ⭐                              0%  (0)
1 ⭐                              0%  (0)

Interpretation: 95% of reviews are 4-5 stars - highly recommended!
```

### Example 2: Good but Inconsistent Tutor
```
Rating Breakdown:
5 ⭐ ████████████                 30% (12)
4 ⭐ ████████████                 30% (12)
3 ⭐ ████████████                 30% (12)
2 ⭐ ████                         10% (4)
1 ⭐                              0%  (0)

Interpretation: Mixed reviews - quality may vary by subject/topic
```

### Example 3: New Tutor
```
Rating Breakdown:
5 ⭐ ████████████████████████████ 100% (3)
4 ⭐                              0%   (0)
3 ⭐                              0%   (0)
2 ⭐                              0%   (0)
1 ⭐                              0%   (0)

Interpretation: Perfect rating but limited reviews - promising start!
```

## Mobile View Adaptation

On smaller screens, the layout adjusts:
- Progress bars remain full width
- Badges wrap to multiple lines
- Font sizes adjust for readability
- Spacing optimized for touch targets

## Accessibility Features

- Screen reader friendly labels
- High contrast progress bars
- Clear percentage and count indicators
- Tooltips with additional context
- Keyboard navigation support
