# ColorCraft Paint Visualizer

A web application for visualizing paint colors on building regions. Upload your own images or select from preset buildings to paint specific regions with realistic colors while preserving textures.

## Features

- **Dual Input Modes**: Upload your own images or select from preset buildings
- **File & URL Support**: Upload image files directly or load from URLs
- **Region Selection**: Click to select regions with visual highlighting (blue outline)
- **Two Modes**:
  - **Select Mode**: Click regions to highlight them without painting
  - **Paint Mode**: Click regions to apply paint color while preserving texture
- **Paint All**: Apply the selected color to all regions at once
- **Preset Buildings**: Choose from sample buildings for quick testing
- **Realistic Rendering**: Paint colors blend with original textures using intensity maps

## Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
# Using npm
npm install

# Using pnpm
pnpm install

# Using yarn
yarn install
```

### Development

```bash
# Using npm
npm run dev

# Using pnpm
pnpm dev

# Using yarn
yarn dev
```

The app will be available at `http://localhost:3000`

### Building

```bash
# Using npm
npm run build

# Using pnpm
pnpm build

# Using yarn
yarn build
```

## Image Requirements

The application requires three images to work:

| Image | Required | Description |
|-------|----------|-------------|
| **Cleaned Image** | Yes | The base image to display and paint on |
| **Edge Detection Image** | Yes | Black and white image showing region boundaries |
| **Normal Map Image** | Yes | RGB image representing surface normals for lighting |
| **Original Image** | No | Optional reference image |

### Image Specifications

- All images must have the same dimensions
- Recommended size: 512x512 to 2048x2048
- Formats: PNG, JPEG, WebP
- Edge image: Regions should be uniform color with clear boundaries
- Normal map: Standard RGB normal map format

## Adding Preset Images

To add your own preset buildings, follow these steps:

### 1. Add Image Files

Place your image files in the `public/assignment_testing_images/{building-id}/` directory:

```
public/
└── assignment_testing_images/
    └── {building-id}/
        ├── original.png    # Optional
        ├── cleaned.png     # Required
        ├── edge.png        # Required
        └── normals.png     # Required
```

Example for building 7:
```
public/
└── assignment_testing_images/
    └── 7/
        ├── original.png
        ├── cleaned.png
        ├── edge.png
        └── normals.png
```

### 2. Update Image Sets

Edit `src/lib/image-sets.ts` to add your building to the preset list:

```typescript
export const IMAGE_SETS: BuildingImageSet[] = [
  // ... existing presets ...
  {
    id: "7",
    original: "/assignment_testing_images/7/original.png",
    cleaned: "/assignment_testing_images/7/cleaned.png",
    normals: "/assignment_testing_images/7/normals.png",
    edge: "/assignment_testing_images/7/edge.png",
  },
];
```

### 3. Rebuild the Application

If running in production mode, rebuild the application:

```bash
pnpm build
```

Your preset will now appear in the Preset dropdown alongside the default buildings.

### Image Preparation Tips

- **Cleaned Image**: Should be a clear, well-lit image of the building facade
- **Edge Detection**: Use edge detection software (like Sobel, Canny, or Photoshop) on the cleaned image
  - Regions should be clearly separated with distinct boundaries
  - Background should be a solid color different from building regions
- **Normal Map**: Can be generated from depth information or manually created
  - Blue represents flat surfaces (128, 128, 255)
  - Red/green represent angled surfaces
- **Consistency**: Ensure all four images have exactly the same dimensions and pixel alignment

## Usage

### Using Preset Buildings

1. Click "Preset" button in the Image Source card
2. Select a building from the dropdown
3. The images will load automatically

### Uploading Custom Images

1. Click "Upload" button in the Image Source card
2. For each required image, either:
   - Click the file input to select an image file
   - Paste an image URL and click the link icon
3. Ensure all required images (cleaned, edge, normals) are loaded

### Painting Regions

1. Select a color using the color picker or quick colors
2. Choose "Select Mode" to preview regions (blue outline highlights)
3. Choose "Paint Mode" to apply paint
4. Click on regions to select/paint them
5. Hold Shift + click in Paint Mode to paint multiple regions
6. Use "Paint All" button to paint all regions at once
7. Use "Reload Image" to reset to original state

## Project Structure

```
paint-visualizer/
├── src/
│   ├── components/
│   │   └── canvas.tsx      # Main canvas component with painting logic
│   ├── lib/
│   │   ├── image-sets.ts   # Preset building definitions
│   │   ├── mask-generator.ts # Region mask generation
│   │   ├── types.d.ts      # TypeScript type definitions
│   │   └── utils.ts        # Utility functions
│   ├── routes/
│   │   └── index.tsx       # Main application page
│   └── styles.css          # Global styles
├── dist/                   # Production build output
├── package.json
└── vite.config.ts
```

## How It Works

1. **Region Detection**: Uses edge detection image to identify and label distinct regions
2. **Intensity Mapping**: Normal map is processed to create an intensity map for realistic lighting
3. **Texture Preservation**: When painting, the selected color is blended with the original texture pixels
4. **Region Selection**: Click coordinates are mapped to region labels for selection
5. **Highlighting**: Selected regions are outlined in blue using edge pixel detection

## Tech Stack

- React 19
- TanStack Router
- TypeScript
- Vite
- Tailwind CSS
- Radix UI Components
- Lucide Icons

