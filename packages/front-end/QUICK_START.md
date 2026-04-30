# Quick Start Guide

## 🚀 Getting Started with the Feed Component

### Prerequisites
- Node.js installed
- pnpm package manager

### Installation & Running

1. **Navigate to the front-end directory**:
   ```bash
   cd packages/front-end
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   pnpm install
   ```

3. **Start the development server**:
   ```bash
   pnpm dev
   ```

4. **Open your browser**:
   - The app will typically run at `http://localhost:5173`
   - You'll see the complete feed interface

### What You'll See

The component displays a mobile-sized feed (375px × 812px) with:

1. **Header Section** (top)
   - "New" title
   - Visit statistics
   - User avatar

2. **Stories Section** (middle)
   - 5 circular story avatars
   - Some with orange gradient borders
   - Verified badges on select stories

3. **Published Posts** (bottom)
   - 6 post cards in a 2×3 grid
   - Each 163px × 163px with rounded corners
   - Various content indicators (video, 3D, multiple images)

### File Locations

```
📁 packages/front-end/
├── 📄 app/routes/home.tsx          ← Main component code
├── 📁 public/images/                ← All design assets
│   ├── header-avatar.png
│   ├── story-1.png → story-5.png
│   └── publish-1.png → publish-6.png
├── 📄 FEED_COMPONENT.md             ← Detailed documentation
├── 📄 IMPLEMENTATION_SUMMARY.md     ← Implementation details
└── 📄 VISUAL_GUIDE.md               ← Visual layout reference
```

### Customization Tips

#### Change Colors
Edit the Tailwind classes in `home.tsx`:
```tsx
// Example: Change background color
<div className="... bg-gray-900">  // Instead of bg-black

// Example: Change text color
<h1 className="... text-blue-500">  // Instead of text-white
```

#### Modify Dimensions
Adjust the width/height values:
```tsx
// Container size
<div className="w-[375px] h-[812px]">  // Change these values

// Card size
<div className="w-[163px] h-[163px]">  // Adjust card dimensions
```

#### Add More Posts
Extend the PublishedPosts grid:
```tsx
<PostCard image="/images/publish-7.png" />
<PostCard image="/images/publish-8.png" />
// ... add more as needed
```

#### Update Stories
Modify the Stories component:
```tsx
// Add new story
<img
  src="/images/story-6.png"
  alt="Story 6"
  className="w-[40px] h-[40px] rounded-full object-cover"
/>
```

### Troubleshooting

**Images not showing?**
- Verify images exist in `/public/images/`
- Check file names match exactly (case-sensitive)
- Ensure the dev server is running

**Styling issues?**
- Confirm Tailwind CSS v4 is properly configured
- Check that `@import "tailwindcss"` is in `app.css`
- Clear browser cache and reload

**Layout misaligned?**
- Don't modify the absolute positioning values unless you know the exact Figma coordinates
- Keep the container at 375px × 812px for proper scaling

### Building for Production

```bash
pnpm build
pnpm start
```

This creates an optimized production build.

### Next Steps

1. ✅ Review the component code in `home.tsx`
2. ✅ Check the visual guide for layout reference
3. ✅ Experiment with customizations
4. ✅ Integrate with your backend API for dynamic content
5. ✅ Add interactivity (click handlers, navigation, etc.)

### Need Help?

Refer to:
- `FEED_COMPONENT.md` - Complete technical documentation
- `IMPLEMENTATION_SUMMARY.md` - What was built and why
- `VISUAL_GUIDE.md` - ASCII diagrams and measurements

---

**Happy coding! 🎨**
