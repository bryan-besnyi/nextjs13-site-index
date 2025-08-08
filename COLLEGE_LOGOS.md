# College Logo Components

## Overview
The app now includes reusable logo components that display placeholder college logos. To complete the visual branding, you'll need to add the actual college logo files to the `public/` directory.

## Required Logo Files

Add these logo files to the `public/` directory:

### College of San Mateo
- `csm-logo.png` or `csm-logo.svg` 
- Recommended size: 200x200px or vector format

### Cañada College  
- `canada-logo.png` or `canada-logo.svg`
- Recommended size: 200x200px or vector format

### Skyline College
- `skyline-logo.png` or `skyline-logo.svg` 
- Recommended size: 200x200px or vector format

## Update Components

Once you have the logo files, update the components in `src/app/components/CollegeLogos.tsx`:

### Before (current placeholder):
```tsx
export const CollegeOfSanMateoLogo: React.FC<{ className?: string; width?: number; height?: number }> = ({ 
  className = '', 
  width = 120, 
  height = 120 
}) => (
  <div className={`${className} w-[${width}px] h-[${height}px] bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center`}>
    <span className="text-white font-bold text-lg">CSM</span>
    {/* Replace with: <Image src="/csm-logo.png" alt="College of San Mateo Logo" width={width} height={height} /> */}
  </div>
);
```

### After (with actual logo):
```tsx
export const CollegeOfSanMateoLogo: React.FC<{ className?: string; width?: number; height?: number }> = ({ 
  className = '', 
  width = 120, 
  height = 120 
}) => (
  <Image 
    src="/csm-logo.png" 
    alt="College of San Mateo Logo" 
    width={width} 
    height={height}
    className={className}
  />
);
```

## Where Logos Appear

The logo components are used in:

1. **Homepage Hero Section** - Artistic floating logos in background
2. **Admin Pages** - Subtle background patterns
3. **Footer** - Small logos next to campus names
4. **Search Results** - Background watermarks

## Logo Variants

The system includes several logo display options:

- `variant="hero"` - Large, semi-transparent for hero backgrounds
- `variant="page"` - Medium opacity for page backgrounds  
- `variant="subtle"` - Very light for subtle backgrounds
- Individual college logos in footer and navigation

## Accessibility

All logo components include:
- Proper alt text for screen readers
- `aria-hidden="true"` for decorative background usage
- Appropriate focus states where interactive