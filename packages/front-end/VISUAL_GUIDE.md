# Visual Layout Guide

## Component Hierarchy and Positioning

```
┌─────────────────────────────────────┐
│         Feed Container              │
│      (375px × 812px, Black)        │
│                                     │
│  ┌───────────────────────────────┐  │
│  │       Header Section          │  │
│  │   (Left: 20px, Top: 54px)    │  │
│  │                               │  │
│  │  Since last visit: 24 new...  │  │
│  │  New                    [👤]  │  │
│  │  ─────────────────────────    │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │      Stories Section          │  │
│  │   (Top: 125px, Height: 80px)  │  │
│  │                               │  │
│  │  [●] [●] [●] [●] [●]      →  │  │
│  │   1   2   3   4   5           │  │
│  │  ─────────────────────────    │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │    Published Posts Grid       │  │
│  │  (Left: 20px, Top: 221px)    │  │
│  │   (335px × 507px)            │  │
│  │                               │  │
│  │  ┌─────────┐ ┌─────────┐     │  │
│  │  │ Post 1  │ │ Post 2  │     │  │
│  │  │  [📷]   │ │  [3D]   │     │  │
│  │  └─────────┘ └─────────┘     │  │
│  │  ┌─────────┐ ┌─────────┐     │  │
│  │  │ Post 3  │ │ Post 4  │     │  │
│  │  │  [📷]   │ │  [3D]   │     │  │
│  │  └─────────┘ └─────────┘     │  │
│  │  ┌─────────┐ ┌─────────┐     │  │
│  │  │ Post 5  │ │ Post 6  │     │  │
│  │  │         │ │         │     │  │
│  │  └─────────┘ └─────────┘     │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

## Story Avatar Variants

### Standard Avatar (40px)
```
   ┌──────┐
   │      │  ← 40px diameter
   │  ●   │     Circular image
   │      │
   └──────┘
```

### Avatar with Gradient Border (44px)
```
   ┌────────┐
   │ ////// │  ← 2px orange gradient
   │ /    / │     (#F58367 → #D96F55)
   │/ ●  / │
   │/    / │
   │////// │
   └────────┘
   44px total (40px + 2px border × 2)
```

### Avatar with Verified Badge
```
   ┌──────┐
   │      │
   │  ●   │     ✓ ← 16px badge
   │      │        (bottom-right)
   └──────┘
```

## Post Card Indicators

Positioned at bottom-left of each post card:

### Few Images Icon
```
┌──────────┐
│ □ ○      │  ← Semi-transparent black bg
└──────────┘   White outline icons
```

### Video Icon
```
┌──────────┐
│ ▶        │  ← Play triangle
└──────────┘
```

### 3D Icon
```
┌──────────┐
│ ⊙ ─      │  ← 3D symbol
└──────────┘
```

## Color Reference

```
Background:        #000000 (Black)
Primary Text:      #FFFFFF (White)
Secondary Text:    #AEBECE (Light Gray-Blue)
Orange Gradient:   #F58367 → #D96F55
Divider Lines:     #FFFFFF @ 15% opacity
Icon Backgrounds:  rgba(0, 0, 0, 0.5)
Story Gradient:    linear-gradient(180deg, 
                   rgba(0,0,0,0.2) 0%, 
                   rgba(0,0,0,0) 81%)
```

## Typography Scale

```
Title "New":
  - Font: SF Pro Display
  - Size: 34px
  - Weight: Bold (700)
  - Line Height: 41px
  - Letter Spacing: 1.21%

Subtitle:
  - Font: SF Pro Text
  - Size: 13px
  - Weight: Medium (500)
  - Line Height: 14px
  - Letter Spacing: -0.62%
  
"Since last visit:" (bold part):
  - Weight: Semibold (600)
  
"24 new publishes" (colored part):
  - Color: #AEBECE
```

## Shadow Effects

```
Published Posts Container:
  box-shadow: 0px 25px 30px 0px rgba(0, 0, 0, 0.2)
  
Creates a subtle depth effect making the
post grid appear to float above the background
```

## Grid Specifications

```
Post Grid:
  - Columns: 2
  - Rows: 3
  - Card Size: 163px × 163px
  - Gap: 2px (Tailwind gap-2)
  - Border Radius: 15px
  - Total Grid: 335px × 507px
  
Calculation:
  163px + 2px + 163px = 328px (content width)
  Plus padding/margins to reach 335px
```

## Spacing Map

```
Vertical Spacing:
  Top → Header: 54px
  Header → Stories: 71px (125px - 54px)
  Stories → Posts: 140.5px (221px - 80.5px)
  
Horizontal Spacing:
  Left margin: 20px
  Right margin: 20px
  Content width: 335px (375px - 40px)
  
Story Spacing:
  Between avatars: 23px
  First avatar from left: 18px
  Arrow from right: 30px
```

This layout ensures perfect alignment with the Figma design specifications.
