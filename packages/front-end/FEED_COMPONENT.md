# Infinite Feed Component

This component is a pixel-perfect implementation of the Figma design for the "Infinite" social media feed interface.

## Design Specifications

### Layout Dimensions
- **Container**: 375px × 812px (mobile viewport)
- **Background**: Black (#000000)

### Sections

#### 1. Header Section
- **Position**: Left 20px, Top 54px
- **Size**: 335px × 71.5px
- **Elements**:
  - Title "New": 34px bold, white text
  - Subtitle: "Since last visit: 24 new publishes" (13px medium)
  - User avatar: 40px circular (top-right)
  - Divider line: 0.5px white with 15% opacity

#### 2. Stories Section
- **Position**: Full width, Top 125px
- **Height**: 80.5px
- **Background**: Gradient from black 20% opacity to transparent
- **Story Avatars**:
  - Standard: 40px diameter
  - With gradient border: 44px (2px orange gradient border)
  - Verified badge: 16px white circle with checkmark
- **Spacing**: 23px gap between stories
- **Arrow icon**: Right side for navigation

#### 3. Published Posts Grid
- **Position**: Left 20px, Top 221px
- **Size**: 335px × 507px
- **Layout**: 2-column grid
- **Card size**: 163px × 163px
- **Border radius**: 15px
- **Shadow**: 0px 25px 30px rgba(0, 0, 0, 0.2)
- **Gap**: 8px (2px grid gap)
- **Indicators**:
  - Few images icon
  - Video icon
  - 3D icon

## Color Palette

- **Primary Text**: #FFFFFF (White)
- **Secondary Text**: #AEBECE (Sub text)
- **Orange Gradient**: linear-gradient(153deg, #F58367 0%, #D96F55 100%)
- **Icons Background**: rgba(0, 0, 0, 0.5)

## Typography

- **Title**: SF Pro Display, 34px, Bold (700), 1.21% letter-spacing
- **Subtitle**: SF Pro Text, 13px, Medium (500), -0.62% letter-spacing

## Images

All images are stored in `/packages/front-end/public/images/`:
- `header-avatar.png` - User avatar in header
- `story-1.png` to `story-5.png` - Story avatars
- `publish-1.png` to `publish-6.png` - Post images

## Component Structure

```
Feed
├── Header
│   ├── Title ("New")
│   ├── Subtitle (visit info)
│   ├── Divider line
│   └── Avatar
├── Stories
│   ├── Background gradient
│   ├── Divider line
│   ├── Story items (5)
│   │   ├── Avatar (with optional gradient border)
│   │   └── Verified badge (optional)
│   └── Arrow icon
└── PublishedPosts
    └── Grid (2 columns × 3 rows)
        └── PostCard (6 items)
            ├── Image
            └── Indicators (optional)
                ├── FewImagesIcon
                ├── VideoIcon
                └── ThreeDIcon
```

## Running the Application

```bash
cd packages/front-end
pnpm dev
```

The feed will be available at the home route.
