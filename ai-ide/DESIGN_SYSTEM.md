# AI-IDE Design System

A comprehensive design system for building consistent, accessible, and production-ready AI-IDE interfaces.

## 🎨 Design Philosophy

### Core Principles
- **Minimalist**: Clean, focused interface that puts content first
- **Accessible**: WCAG 2.1 AA compliant with keyboard navigation support
- **Consistent**: Unified design patterns across all components
- **Responsive**: Mobile-first design that works on all screen sizes
- **Dark-First**: Pure black theme optimized for developer workflows

### Color Palette

#### Pure Black Theme (Primary)
```css
--color-bg-primary: #000000;
--color-bg-secondary: #111111;
--color-bg-tertiary: #1a1a1a;
--color-bg-hover: #222222;
--color-border: #333333;
--color-border-focus: #444444;
```

#### Dark Theme (Alternative)
```css
--color-bg-primary: #0d1117;
--color-bg-secondary: #161b22;
--color-bg-tertiary: #21262d;
--color-bg-hover: #30363d;
--color-border: #30363d;
--color-border-focus: #1f6feb;
```

#### Light Theme (Alternative)
```css
--color-bg-primary: #ffffff;
--color-bg-secondary: #f6f8fa;
--color-bg-tertiary: #f0f2f5;
--color-bg-hover: #e6e9ed;
--color-border: #d0d7de;
--color-border-focus: #0969da;
```

#### Accent Colors
```css
--color-primary: #1f6feb;
--color-primary-hover: #0969da;
--color-success: #1a7f37;
--color-warning: #9a6700;
--color-error: #cf222e;
--color-info: #0969da;
```

#### Text Colors
```css
--color-text-primary: #f0f6fc;
--color-text-secondary: #8b949e;
--color-text-tertiary: #656d76;
--color-text-inverse: #000000;
```

### Typography

#### Font Stack
```css
font-family: 'Fira Code', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
```

#### Font Sizes
```css
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
```

#### Line Heights
```css
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### Spacing System

Based on 8px grid system:

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### Border Radius

```css
--radius-none: 0;
--radius-sm: 0.125rem;   /* 2px */
--radius-md: 0.375rem;   /* 6px */
--radius-lg: 0.5rem;     /* 8px */
--radius-xl: 0.75rem;    /* 12px */
--radius-full: 9999px;
```

### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
```

## 🎯 Components

### Buttons

#### Primary Button
```tsx
<Button variant="primary" size="md">
  Primary Action
</Button>
```

**Variants:**
- `primary` - Main action buttons
- `secondary` - Secondary actions
- `outline` - Outline style buttons
- `ghost` - Minimal action buttons
- `danger` - Destructive actions

**Sizes:**
- `sm` - Small buttons (height: 28px)
- `md` - Medium buttons (height: 36px) 
- `lg` - Large buttons (height: 44px)
- `xl` - Extra large buttons (height: 52px)

**States:**
- Default
- Hover
- Focus (with outline)
- Active
- Disabled
- Loading

#### Usage Guidelines
- Use primary buttons for main actions (Save, Create, Deploy)
- Secondary buttons for complementary actions (Cancel, Skip)
- Danger buttons only for destructive actions (Delete, Remove)
- Never use more than one primary button per view
- Always provide accessible labels

### Forms

#### Input Fields
```tsx
<div className="form-group">
  <label htmlFor="email" className="form-label">
    Email Address
  </label>
  <input
    type="email"
    id="email"
    className="form-input"
    placeholder="Enter your email"
  />
</div>
```

#### Select Dropdown
```tsx
<div className="form-group">
  <label htmlFor="language" className="form-label">
    Programming Language
  </label>
  <select id="language" className="form-select">
    <option value="javascript">JavaScript</option>
    <option value="typescript">TypeScript</option>
    <option value="python">Python</option>
  </select>
</div>
```

#### Form Validation
```tsx
<div className="form-group">
  <label htmlFor="password" className="form-label">
    Password
  </label>
  <input
    type="password"
    id="password"
    className="form-input form-input-error"
    aria-invalid="true"
  />
  <div className="form-error">
    Password must be at least 8 characters long
  </div>
</div>
```

### File Explorer

#### Tree Structure
```tsx
<FileExplorer>
  <FileTreeItem
    name="src"
    type="directory"
    expanded={true}
    icon={FolderIcon}
  >
    <FileTreeItem
      name="components"
      type="directory"
      expanded={false}
      icon={FolderIcon}
    />
    <FileTreeItem
      name="App.tsx"
      type="file"
      icon={FileIcon}
      selected={true}
    />
  </FileTreeItem>
</FileExplorer>
```

#### Features
- Lazy loading for large directories
- Inline rename functionality
- Context menu support
- Keyboard navigation
- Drag & drop support
- File type icons

### Editor

#### CodeMirror Integration
```tsx
<Editor
  value={code}
  language="typescript"
  theme="pure-black"
  onChange={setCode}
  onSave={handleSave}
  readOnly={false}
  lineNumbers={true}
  wordWrap={true}
  autoComplete={true}
/>
```

#### Editor Features
- Multi-language syntax highlighting
- Auto-completion
- Error highlighting
- Code folding
- Search and replace
- Multiple cursors
- Vim/Emacs keybindings support

### Tabs

#### Tab System
```tsx
<TabGroup>
  <TabList>
    <Tab>Files</Tab>
    <Tab>Settings</Tab>
    <Tab>Git</Tab>
  </TabList>
  <TabPanel>Files content</TabPanel>
  <TabPanel>Settings content</TabPanel>
  <TabPanel>Git content</TabPanel>
</TabGroup>
```

#### Tab Variants
- `default` - Standard tabs
- `pills` - Rounded tab buttons
- `segmented` - Button group style

### Modal Dialogs

#### Settings Modal
```tsx
<Modal open={isOpen} onClose={handleClose} size="lg">
  <ModalHeader>
    <h2>Settings</h2>
    <Button variant="ghost" onClick={handleClose}>
      <XIcon />
    </Button>
  </ModalHeader>
  <ModalBody>
    <SettingsContent />
  </ModalBody>
  <ModalFooter>
    <Button variant="primary" onClick={handleSave}>
      Save Changes
    </Button>
  </ModalFooter>
</Modal>
```

#### Modal Sizes
- `sm` - 384px
- `md` - 512px
- `lg` - 768px
- `xl` - 1024px
- `full` - Full screen

### Toast Notifications

#### Toast System
```tsx
const { addToast } = useToast();

const handleSuccess = () => {
  addToast({
    type: 'success',
    title: 'Success',
    message: 'File saved successfully',
    duration: 3000
  });
};
```

#### Toast Types
- `success` - Green with check icon
- `error` - Red with error icon  
- `warning` - Orange with warning icon
- `info` - Blue with info icon

### Loading States

#### Skeleton Loader
```tsx
<SkeletonLoader>
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-1/2" />
  <Skeleton className="h-4 w-5/6" />
</SkeletonLoader>
```

#### Spinner
```tsx
<Spinner size="md" />
```

**Sizes:**
- `sm` - 16px
- `md` - 24px
- `lg` - 32px
- `xl` - 48px

## 🎯 Layout System

### Grid System

#### CSS Grid
```css
.grid-container {
  display: grid;
  grid-template-columns: 250px 1fr 300px;
  grid-template-rows: auto 1fr;
  gap: var(--space-4);
  height: 100vh;
}
```

#### Responsive Grid
```css
.responsive-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);
}
```

### Container System

#### Max Widths
```css
.container-sm { max-width: 640px; }
.container-md { max-width: 768px; }
.container-lg { max-width: 1024px; }
.container-xl { max-width: 1280px; }
.container-2xl { max-width: 1536px; }
.container-full { max-width: 100%; }
```

### Breakpoints

```css
/* Mobile First Approach */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

## ♿ Accessibility

### WCAG 2.1 AA Compliance

#### Keyboard Navigation
- All interactive elements are keyboard accessible
- Focus indicators are clearly visible
- Logical tab order throughout the application
- Skip links for main content areas

#### Screen Reader Support
- Semantic HTML structure
- ARIA labels and descriptions
- Live regions for dynamic content
- Alt text for all images

#### Color Contrast
- Minimum 4.5:1 contrast ratio for normal text
- Minimum 3:1 contrast ratio for large text
- Never rely on color alone to convey information

### Focus Management

```tsx
// Focus trap for modals
const focusRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (isOpen && focusRef.current) {
    focusRef.current.focus();
  }
}, [isOpen]);
```

## 🎭 Motion & Animation

### Animation Principles
- Subtle and purposeful animations
- Respect user's motion preferences
- Performance-first approach
- Consistent easing functions

### Easing Functions
```css
--ease-linear: linear;
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
```

### Transition Durations
```css
--duration-75: 75ms;
--duration-100: 100ms;
--duration-150: 150ms;
--duration-200: 200ms;
--duration-300: 300ms;
--duration-500: 500ms;
--duration-700: 700ms;
--duration-1000: 1000ms;
```

### Hover Effects
```css
.button {
  transition: all var(--duration-200) var(--ease-out);
}

.button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}
```

## 🧩 Component Patterns

### Compound Components
```tsx
<Modal>
  <Modal.Trigger>
    <Button>Open Modal</Button>
  </Modal.Trigger>
  <Modal.Content>
    <Modal.Header>Modal Title</Modal.Header>
    <Modal.Body>Modal content</Modal.Body>
    <Modal.Footer>
      <Button variant="primary">Confirm</Button>
    </Modal.Footer>
  </Modal.Content>
</Modal>
```

### Controlled/Uncontrolled Components
```tsx
// Controlled
<Input
  value={value}
  onChange={onChange}
/>

// Uncontrolled
<Input
  defaultValue="initial value"
  ref={inputRef}
/>
```

### Render Props Pattern
```tsx
<AsyncData
  render={({ data, loading, error }) => {
    if (loading) return <Spinner />;
    if (error) return <ErrorMessage />;
    return <DataList items={data} />;
  }}
/>
```

## 🛠️ Development Guidelines

### CSS Architecture
- Use CSS custom properties for theming
- Follow BEM naming convention for classes
- Keep specificity low and predictable
- Use utility classes for spacing and layout

### TypeScript Integration
- Strong typing for all component props
- Generic types for reusable components
- Type guards for runtime validation
- Discriminated unions for variant patterns

### Testing Strategy
- Unit tests for all utility functions
- Integration tests for component behavior
- E2E tests for critical user flows
- Visual regression tests for UI changes

### Performance Optimization
- Lazy loading for large components
- Memoization for expensive calculations
- Virtual scrolling for large lists
- Code splitting by route and feature

## 📚 Storybook Integration

### Component Documentation
All components are documented in Storybook with:

#### Basic Usage
```tsx
// Basic.stories.tsx
export const Basic: Story = {
  args: {
    children: 'Button Text'
  }
};
```

#### Variant Stories
```tsx
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
};

export const Secondary: Story = {
  args: {
    variant: 'secondary', 
    children: 'Secondary Button'
  }
};
```

#### Interactive Controls
```tsx
// Interactive controls for component props
export const Interactive: Story = {
  render: (args) => <Button {...args} />,
  parameters: {
    controls: { expanded: true }
  }
};
```

## 🔄 Theming System

### CSS Custom Properties
```css
:root {
  /* Light theme */
  --color-bg: #ffffff;
  --color-text: #000000;
}

[data-theme="dark"] {
  /* Dark theme overrides */
  --color-bg: #0d1117;
  --color-text: #f0f6fc;
}

[data-theme="pure-black"] {
  /* Pure black theme */
  --color-bg: #000000;
  --color-text: #f0f6fc;
}
```

### JavaScript Theme Switching
```tsx
const { theme, setTheme } = useTheme();

const handleThemeChange = (newTheme: Theme) => {
  setTheme(newTheme);
  document.documentElement.setAttribute('data-theme', newTheme);
};
```

### Dynamic Theming
```css
/* Support for custom user themes */
.user-theme-1 {
  --color-primary: #1f6feb;
  --color-secondary: #1a7f37;
  --color-accent: #cf222e;
}
```

## 📱 Mobile Responsiveness

### Mobile-First Approach
- Design for mobile devices first
- Progressive enhancement for larger screens
- Touch-friendly interaction targets
- Optimized loading for mobile networks

### Responsive Patterns
```css
/* Mobile first */
.mobile-layout {
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .mobile-layout {
    flex-direction: row;
  }
}
```

### Touch Targets
- Minimum 44px × 44px for interactive elements
- Adequate spacing between touch targets
- Swipe gestures for mobile interactions

## 🚀 Performance Guidelines

### Critical Rendering Path
- Inline critical CSS
- Preload important resources
- Optimize font loading
- Minimize reflows and repaints

### Bundle Optimization
- Code splitting by route
- Dynamic imports for large libraries
- Tree shaking for unused code
- Asset optimization and compression

### Runtime Performance
- Avoid unnecessary re-renders
- Use React.memo for pure components
- Debounce expensive operations
- Virtualize long lists

## 🧪 Quality Assurance

### Design Review Checklist
- [ ] Follows established design patterns
- [ ] Maintains consistent spacing and typography
- [ ] Accessible to keyboard and screen reader users
- [ ] Responsive across all target screen sizes
- [ ] Works in all supported browsers
- [ ] Follows the established color palette
- [ ] Proper focus management
- [ ] Loading states and error handling

### Accessibility Checklist
- [ ] WCAG 2.1 AA compliant
- [ ] Keyboard navigation works throughout
- [ ] Screen reader compatibility
- [ ] Color contrast ratios meet requirements
- [ ] Focus indicators are visible
- [ ] No motion for users who prefer reduced motion
- [ ] Alt text for all images
- [ ] ARIA labels where needed

This design system ensures consistent, accessible, and performant user experiences across the entire AI-IDE application.