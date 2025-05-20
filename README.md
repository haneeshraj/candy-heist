# Candy Heist

A Next.js application with SCSS modules, Framer Motion, and Anime.js.

## Features

- Next.js with App Router
- SCSS Modules for component styling
- Framer Motion for React animations
- Anime.js for JavaScript animations
- CLSX for conditional class names
- Google Fonts: Six Caps and Poppins
- Responsive design with SCSS mixins
- Custom color system

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `/src/app` - Next.js App Router files
- `/src/components` - Reusable React components
- `/src/styles` - SCSS files
  - `/styles/globals.scss` - Global styles
  - `/styles/colors.scss` - Color variables and utility classes
  - `/styles/mixins.scss` - SCSS mixins for responsive design
  - `/styles/components` - Component-specific SCSS modules
  - `/styles/pages` - Page-specific SCSS modules
- `/src/utils` - Utility functions including animations

## CSS Modules

The project is set up to use SCSS modules. Create your styles in `.module.scss` files:

```scss
// styles/components/example.module.scss
@use '../colors' as c;
@use '../mixins' as m;

.container {
  color: c.color("primary");

  @include m.media-up('md') {
    padding: 20px;
  }
}
}
```

Then import and use in your components:

```tsx
import styles from "@/styles/components/example.module.scss";
import clsx from "clsx";

export default function Example({ className }) {
  return <div className={clsx(styles.container, className)}>Content here</div>;
}
```

## Animations

### Framer Motion

```tsx
import { motion } from "framer-motion";

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  Content here
</motion.div>;
```

### Anime.js

The project includes utility functions in `/src/utils/animations.ts` for common animation patterns:

```tsx
import { useEffect } from "react";
import { textReveal, staggerFadeIn, loopAnimation } from "@/utils/animations";

useEffect(() => {
  // Animate text characters one by one
  textReveal(".my-text-element");

  // Fade in elements with staggered timing
  staggerFadeIn(".my-staggered-elements");

  // Create a looping animation
  const animation = loopAnimation(".my-floating-element");

  // Clean up
  return () => animation.pause();
}, []);
```

## Modern SCSS Syntax

This project uses the modern SCSS syntax with `@use` and `@forward` instead of `@import`:

```scss
// Import SCSS modules
@use "../colors" as c;
@use "../mixins" as m;

// Using modules
.element {
  color: c.color("primary");

  @include m.media-up("md") {
    padding: 20px;
  }
}
```

## Custom Colors

Add or modify colors in `/src/styles/colors.scss`:

```scss
$colors: (
  "primary": #your-color-here,
  // other colors...
);
```

## Adding Google Fonts

The project already includes Six Caps and Poppins fonts. They are loaded in `/src/styles/globals.scss`.
