# Color System Refactor

## Overview

The color system in Stylixir has been refactored from individual color variables in each template to a centralized color palette system. This provides better consistency, easier color management, and more flexibility for users.

## Key Changes

### 1. Centralized Color Palettes

Instead of defining colors individually in each template, colors are now managed through predefined and custom color palettes:

- **Predefined Palettes**: 10 carefully curated color palettes (Sunset, Ocean, Forest, Desert, Neon, Pastel, Monochrome, Warm, Cool, Earth)
- **Custom Palettes**: Users can create their own palettes with up to 4 colors
- **Palette Management**: Users can edit, delete, and randomize custom palettes

### 2. Unified Color Variable System

All templates now use a unified color variable naming system:

- **c1**: Primary color (main pattern color)
- **c2**: Secondary color (accent or secondary pattern color)
- **c3**: Tertiary color (additional accent color)
- **c4, c5, c6**: Additional colors as needed

This replaces the previous system where each template had its own color variable names (like `colorOne`, `colorTwo`, `colorBase`, `colorLight`, etc.).

### 3. Simplified Color Management

- **No Color Mapping**: The complex color mapping system has been removed
- **No Template Variables**: Color variables are no longer defined in template variables objects
- **Direct Index Access**: Colors are accessed directly by their index (c1 = index 0, c2 = index 1, etc.)
- **Dynamic Detection**: Color variables are automatically detected from template strings
- **Consistent Interface**: All templates now use the same color variable names

### 4. New Components

#### ColorPaletteSelector.vue
- Displays all available palettes in a grid
- Shows active palette with color swatches
- Allows creating and editing custom palettes
- Provides randomization functionality

#### Updated Controls.vue
- Removed individual color inputs
- Added ColorPaletteSelector component
- Only shows non-color variable controls

### 5. Updated Stores

#### colorPalette.ts (New)
- Manages active palette selection
- Handles custom palette creation and editing
- Provides color retrieval for templates
- Integrates with URL state management

#### activeTemplate.ts (Updated)
- Removed color-specific logic
- Uses color palette store for color values
- Only manages non-color variables
- Updated randomization to use palette system

## Benefits

1. **Consistency**: All patterns use colors from the same palette with unified naming
2. **Simplicity**: No complex color mapping system to maintain
3. **Efficiency**: Change one palette to update all patterns instantly
4. **Flexibility**: Easy to create custom palettes or randomize existing ones
5. **User Experience**: Simplified interface with fewer controls
6. **Maintainability**: Centralized color management makes the codebase easier to maintain

## Technical Implementation

### Unified Color Variables
All templates now use the same color variable names:
- `c1` = palette index 0 (primary)
- `c2` = palette index 1 (secondary)
- `c3` = palette index 2 (tertiary)
- `c4` = palette index 3 (additional)
- `c5` = palette index 4 (additional)
- `c6` = palette index 5 (additional)

### Dynamic Color Detection
Color variables are automatically detected from template strings using regex pattern matching. This eliminates the need to define color variables in template objects.

### Fallback System
If a template requires more colors than available in a palette, the system falls back to black (#000000) for missing colors.

### URL State
Palette selection is persisted in the URL, allowing users to share specific color combinations.

### Custom Palettes
Custom palettes are stored in the store's state and can be edited or deleted. They're automatically saved as new palettes when randomized.

## Usage

1. **Select a Palette**: Choose from predefined palettes or create a custom one
2. **Edit Colors**: For custom palettes, click on color swatches to change individual colors
3. **Randomize**: Use the randomize button to generate new color combinations
4. **Create Custom**: Build your own palette with up to 4 colors
5. **Share**: Palette selections are saved in the URL for easy sharing

## Migration Notes

- All existing templates have been updated to use the unified c1, c2, c3, c4, etc. system
- Color variables are no longer defined in template variables objects
- Color variables are automatically detected from template strings
- Color variables in templates are now automatically mapped to palette colors by index (c1 = index 0, c2 = index 1, etc.)
- The randomization behavior is now palette-based instead of individual color-based
- URL parameters for individual colors have been replaced with palette selection
- The color mapping system has been completely removed for simplicity
- Palettes now support up to 6 colors to accommodate more complex patterns
