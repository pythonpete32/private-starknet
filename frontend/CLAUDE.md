# CLAUDE.md - Frontend Implementation Guide

This file provides guidance to Claude Code when working with this frontend application built with Next.js and @inkonchain/ink-kit.

## Project Overview

This is a private DAI transfer application built on Starknet using zero-knowledge proofs. The frontend demonstrates two privacy systems:
- **Account System**: Starknet-native implementation with account abstraction
- **Commitment System**: Maximum privacy implementation inspired by Bitcoin/Zcash

## Library: @inkonchain/ink-kit

This project uses the `@inkonchain/ink-kit` component library exclusively. This is an onchain-focused SDK that provides ready-to-use app layout templates, themes, and animated components.

### Installation
```bash
npm install @inkonchain/ink-kit
# or  
pnpm install @inkonchain/ink-kit
```

### Usage
```jsx
// REQUIRED: Import styles first at the root of your project
import "@inkonchain/ink-kit/style.css";

// Import components as needed
import { Button, Card, Typography, Input, InkLayout } from "@inkonchain/ink-kit";
```

## CRITICAL RULES - NO EXCEPTIONS

### ❌ NEVER DO THESE:
1. **NO DIRECT COLORS**: Never use color values directly (e.g., `rgb(10, 55, 10)`, `#ff0000`)
2. **NO TAILWIND COLORS**: Never use `text-gray-600`, `bg-blue-500`, etc.
3. **NO CUSTOM COMPONENTS**: Use only ink-kit provided components
4. **NO CUSTOM CSS**: Do not add custom CSS rules or style={{}} props
5. **NO INCORRECT INK PREFIX**: The `ink:` prefix is ONLY for theme classes and specific color/typography/shadow classes
6. **NO MIXING SYSTEMS**: Don't mix Typography component with typography classes

### ✅ ALWAYS DO THESE:
1. **USE COMPONENT VARIANTS**: Use variant props on components (e.g., `variant="primary"`)
2. **USE INK COMPONENTS**: Use only the components listed in the components section
3. **USE THEME CLASSES CORRECTLY**: Apply themes via `ink:THEME_ID` on root element only
4. **USE TYPOGRAPHY COMPONENT**: Use `<Typography variant="h1">` not classes
5. **USE SEMANTIC COLORS**: Use the provided color classes from the design system

## Complete Component Reference

### Alert
```jsx
import { Alert } from "@inkonchain/ink-kit";

<Alert
  title="Required title"              // string (required)
  description="Optional description"  // ReactNode
  variant="info"                     // "success" | "error" | "warning" | "info" (default: "info")
  icon={<CustomIcon />}              // ReactNode
  className=""                       // string
  id="alert-1"                      // string (required if dismissible)
  dismissible={false}                // boolean
  onDismiss={() => {}}               // () => void
/>
```

### Button
```jsx
import { Button } from "@inkonchain/ink-kit";

<Button
  onClick={() => {}}                 // function
  variant="primary"                  // "primary" | "secondary" | "wallet" | "transparent" (default: "primary")
  size="md"                         // "lg" | "md" (default: "md")
  rounded="default"                 // "full" | "default" (default: "default")
  asChild={false}                   // boolean - render as a slot
  iconLeft={<Icon />}               // ReactNode
  iconRight={<Icon />}              // ReactNode
  className=""                      // string
>
  Button Text
</Button>
```

### Card
```jsx
import { Card } from "@inkonchain/ink-kit";

<Card
  image={<CardImage />}             // ReactNode
  imageLocation="top"               // "left" | "right" | "top" | null
  size="default"                    // "default" | "small" | "noPadding" | null
  variant="default"                 // "secondary" | "default" | "light-purple" | null
  clickable={false}                 // boolean
  asChild={false}                   // boolean
  className=""                      // string
>
  <CardContent />
</Card>

// Special Card content components:
<CardContent.Tagline />
<CardContent.Link />
```

### Checkbox
```jsx
import { Checkbox } from "@inkonchain/ink-kit";

<Checkbox
  checked={false}                   // boolean
  indeterminate={false}             // boolean
  onChange={(enabled) => {}}        // (enabled: boolean) => void
/>
```

### Input
```jsx
import { Input } from "@inkonchain/ink-kit";

<Input
  placeholder="Enter text"          // string
  type="text"                      // string
  iconLeft={<Icon />}              // ReactNode
  iconRight={<Icon />}             // ReactNode
  className=""                     // string
/>
```

### Listbox
```jsx
import { Listbox } from "@inkonchain/ink-kit";

<Listbox
  value={selectedValue}            // T (required)
  onChange={(value) => {}}         // (value: T) => void (required)
  multiple={false}                 // boolean - if true, value/onChange use arrays
>
  <Listbox.Options>
    <Listbox.Option value="1">Option 1</Listbox.Option>
    <Listbox.Option value="2" disabled>Option 2</Listbox.Option>
  </Listbox.Options>
</Listbox>
```

### Modal
```jsx
import { Modal } from "@inkonchain/ink-kit";

<Modal
  id="modal-id"                    // string (required)
  title="Modal Title"              // string
  hasBackdrop={true}               // boolean
  size="lg"                        // "lg" | "md" (default: "lg")
  openOnMount={false}              // boolean
  onClose={(props) => {}}          // (props?: TOnCloseProps) => void
>
  {/* Modal content */}
</Modal>
```

### Popover
```jsx
import { Popover } from "@inkonchain/ink-kit";

<Popover className="">
  {/* Popover content */}
</Popover>
```

### RadioGroup
```jsx
import { RadioGroup } from "@inkonchain/ink-kit";

<RadioGroup
  value="option1"                  // string (required)
  onChange={(value) => {}}         // (value: string) => void (required)
>
  <RadioGroup.Option value="option1">First Option</RadioGroup.Option>
  <RadioGroup.Option value="option2">Second Option</RadioGroup.Option>
</RadioGroup>
```

### SegmentedControl
```jsx
import { SegmentedControl } from "@inkonchain/ink-kit";

<SegmentedControl
  options={[                       // SegmentedControlOption[] (required)
    { label: "Option 1", value: "1" },
    { label: "Option 2", value: "2" }
  ]}
  onOptionChange={(option, index) => {}} // (option, index) => void (required)
  variableTabWidth={false}         // boolean
  variant="default"                // "primary" | "default" | "tag" (default: "default")
/>
```

### Tag
```jsx
import { Tag } from "@inkonchain/ink-kit";

<Tag
  variant="fill"                   // "fill" | "outline" | "filter" | "featured" | "event" | null
  selected={false}                 // boolean | null
  icon={<Icon />}                  // ReactNode
>
  Tag Content
</Tag>
```

### Toggle
```jsx
import { Toggle } from "@inkonchain/ink-kit";

<Toggle
  checked={false}                  // boolean (required)
  onChange={(enabled) => {}}       // (enabled: boolean) => void (required)
/>
```



### Typography
```jsx
import { Typography } from "@inkonchain/ink-kit";

<Typography
  variant="h1"                     // Required - see variants below
  asChild={false}                  // boolean
  className=""                     // string
>
  Text content
</Typography>

// Available variants:
// "display-1" | "display-2" | "h1" | "h2" | "h3" | "h4" | "h5" | 
// "body-1" | "body-2-regular" | "body-2-bold" | "body-3-regular" | "body-3-bold" |
// "caption-1-regular" | "caption-1-bold" | "caption-2-regular" | "caption-2-bold"
```

### Layout Components

#### InkLayout
```jsx
import { InkLayout } from "@inkonchain/ink-kit";

<InkLayout
  headerContent={<Header />}       // ReactNode
  topNavigation={<TopNav />}       // ReactNode
  sideNavigation={<SideNav />}     // ReactNode
  mobileNavigation={<MobileNav />} // ReactNode
  mainIcon={<Logo />}              // ReactNode
  snug={false}                     // boolean - removes default padding
  className=""                     // string
>
  <InkPageLayout columns={1}>
    {/* Page content */}
  </InkPageLayout>
</InkLayout>
```

#### InkPageLayout
```jsx
import { InkPageLayout } from "@inkonchain/ink-kit";

<InkPageLayout 
  columns={1}                      // 1 | 2 | 3 (default: 1)
>
  {/* Must have same number of children as columns */}
  <div>Column 1</div>
  <div>Column 2</div>
</InkPageLayout>
```

#### InkHeader
```jsx
import { InkHeader } from "@inkonchain/ink-kit";

<InkHeader
  title="Page Title"               // ReactNode (required)
  icon={<Icon />}                  // ReactNode
/>
```

#### InkPanel
```jsx
import { InkPanel } from "@inkonchain/ink-kit";

<InkPanel
  size="auto"                      // "auto" | "lg" | "md" (default: "auto")
  centered={false}                 // boolean
  shadow={false}                   // boolean
  className=""                     // string
>
  <InkPanel.Header>Header</InkPanel.Header>
  <InkPanel.Content>Content</InkPanel.Content>
  <InkPanel.Footer>Footer</InkPanel.Footer>
</InkPanel>
```

#### InkLayoutMobileNav
```jsx
import { InkLayoutMobileNav } from "@inkonchain/ink-kit";

<InkLayoutMobileNav
  links={[                         // InkLayoutLink[] (required)
    { href: "/", label: "Home", icon: <HomeIcon /> }
  ]}
  onLinkClick={(e) => {}}          // MouseEventHandler
  bottom={<BottomContent />}       // ReactNode
/>
```

## Theming System

### Available Themes
Apply themes ONLY to the root HTML element:

```jsx
// In layout.tsx or _document.tsx
<html lang="en" className="ink:light-theme">
```

Available theme classes:
- `ink:light-theme` - Default light theme
- `ink:dark-theme` - Dark mode
- `ink:contrast-theme` - High contrast
- `ink:neo-theme` - Modern neon style
- `ink:morpheus-theme` - Matrix-inspired theme

### Programmatic Theme Switching
```jsx
import { useInkThemeClass } from "@inkonchain/ink-kit";

function ThemeSwitcher() {
  const isDark = useIsDarkMode();
  useInkThemeClass(isDark ? "ink:dark-theme" : "ink:light-theme");
}
```

## Color System

### Background Colors (use sparingly, prefer component variants)
- `ink:bg-button-primary` (use with `ink:text-text-on-primary`)
- `ink:bg-button-secondary` (use with `ink:text-text-on-secondary`)
- `ink:bg-background-dark`
- `ink:bg-background-dark-transparent`
- `ink:bg-background-light`
- `ink:bg-background-light-transparent`
- `ink:bg-background-light-invisible`
- `ink:bg-background-container`
- `ink:bg-status-success-bg` (use with `ink:text-status-success`)
- `ink:bg-status-error-bg` (use with `ink:text-status-error`)
- `ink:bg-status-alert-bg` (use with `ink:text-status-alert`)

### Theme-Independent Colors
- `ink:bg-ink-light-purple` (use with `ink:text-text-on-primary`)
- `ink:bg-ink-dark-purple` (use with `ink:text-text-on-primary`)

### Text Colors
- `ink:text-text-on-primary`
- `ink:text-text-on-secondary`
- `ink:text-status-success`
- `ink:text-status-error`
- `ink:text-status-alert`

### Shadow Classes
- `ink:shadow-xs`
- `ink:shadow-md`
- `ink:shadow-lg`

## Typography Classes (use only when Typography component isn't suitable)
- `ink:text-display-1`
- `ink:text-display-2`
- `ink:text-h1` through `ink:text-h5`
- `ink:text-body-1`
- `ink:text-body-2-regular`, `ink:text-body-2-bold`
- `ink:text-body-3-regular`, `ink:text-body-3-bold`
- `ink:text-caption-1-regular`, `ink:text-caption-1-bold`
- `ink:text-caption-2-regular`, `ink:text-caption-2-bold`

## Correct Usage Examples

### ✅ CORRECT - Page Layout
```jsx
export default function PageName() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="space-y-4">
        <Typography variant="h1">Page Title</Typography>
        <Typography variant="body-1" className="ink:text-muted">
          Page description using semantic color
        </Typography>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="default">
          <Typography variant="h3">Card Title</Typography>
          <Typography variant="body-2-regular">Card content</Typography>
        </Card>
      </div>
    </div>
  );
}
```

### ✅ CORRECT - Form Pattern
```jsx
<Card size="default" className="p-6 space-y-4">
  <Typography variant="h3">Form Title</Typography>
  <div className="space-y-4">
    <div>
      <Typography variant="caption-1-bold" className="mb-2">
        Field Label
      </Typography>
      <Input 
        placeholder="Enter value"
        type="text"
      />
    </div>
    <Button variant="primary" className="w-full">
      Submit Action
    </Button>
  </div>
</Card>
```

### ✅ CORRECT - Using Status Colors
```jsx
<Alert 
  variant="success" 
  title="Success!"
  description="Your transaction was completed"
/>

// Or for custom status indicators:
<div className="ink:bg-status-success-bg ink:text-status-success p-2 rounded">
  Custom success message
</div>
```

### ❌ WRONG - Common Mistakes
```jsx
// WRONG: Using ink: prefix on regular classes
<div className="ink:max-w-6xl ink:p-6">

// WRONG: Using Tailwind colors
<div className="bg-blue-500 text-white">

// WRONG: Mixing Typography component with text classes
<Typography variant="h1" className="ink:text-h1">

// WRONG: Using custom colors
<Button style={{ backgroundColor: '#ff0000' }}>

// CORRECT versions:
<div className="max-w-6xl p-6">
<Button variant="primary">
<Typography variant="h1">
```

## Important Implementation Notes

1. **Component First**: Always check if there's an ink-kit component for your use case
2. **Variant Over Classes**: Use component variants instead of color classes
3. **Theme Consistency**: Test your implementation across all 5 themes
4. **Semantic Colors**: Use status colors for their intended purpose
5. **No Style Props**: Never use style={{}} or inline styles
6. **Typography Component**: Always use Typography component for text, not classes

## Development Commands

```bash
# Start development server
bun run dev

# Build for production  
bun run build

# Run linting
bun run lint
```

## Resources

- **Storybook Documentation**: https://ink-kit.inkonchain.com/
- **GitHub Repository**: https://github.com/inkonchain/ink-kit
- **Theme Variables**: https://github.com/inkonchain/ink-kit/tree/main/src/styles/theme

## Debugging Checklist

If something isn't working:
1. ✓ Is `@inkonchain/ink-kit/style.css` imported first?
2. ✓ Are you using a component variant instead of custom classes?
3. ✓ Is the theme class applied to the root HTML element?
4. ✓ Are you using Typography component instead of text classes?
5. ✓ Are you avoiding the `ink:` prefix except for themes and specific color classes?