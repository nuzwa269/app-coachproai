# CoachPro AI - Design System

This document contains the color palette, typography, and styling guidelines extracted from the CoachProAi website. These will be used to configure Tailwind CSS for the SaaS application.

## 🎨 Color Palette

### Primary Colors
*   **Primary Orange:** `#FF8A00` (Used for primary buttons like "Explore More", "Login/Sign Up", and accents)
*   **Primary Orange Hover:** `#E67A00` (Slightly darker for button hover states)

### Secondary/Highlight Colors
*   **Highlight Purple:** `#8A2BE2` or `#9333EA` (Used for text highlights like "Connecting Teachers", "Smart Solutions", and vibrant section backgrounds)
*   **Vibrant Gradient (Purple to Blue):** `linear-gradient(135deg, #8A2BE2, #4F46E5)` (Seen in the "Endless Possibilities" section)

### Background Colors
*   **Main Background (Light):** `#FAFAFA` or `#FFFFFF` (Clean white for main body)
*   **Section Background (Off-white):** `#F3F4F6` (For slight contrast in alternate sections)
*   **Dark Background:** `#0A0A0A` (Used for the footer and dark thematic sections)

### Text Colors
*   **Heading Text (Dark):** `#111827` (Very dark blue/gray for high contrast)
*   **Body Text (Muted):** `#4B5563` (Standard gray for readable paragraphs)
*   **Light Text:** `#FFFFFF` (Used on dark backgrounds or vibrant buttons)

---

## ✍️ Typography

Based on the design, the website uses clean, modern Sans-Serif fonts.

*   **Headings (Primary Font):** `Poppins` or `Montserrat` (Bold, geometric, used for section titles like "Prompting Wonders").
*   **Body (Secondary Font):** `Inter` or `Open Sans` (Clean, highly readable for standard text and paragraphs).

---

## 💻 Tailwind CSS Configuration (`tailwind.config.ts`)

When setting up the Next.js project, use this configuration to inject the brand colors:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#FF8A00",
          orangeHover: "#E67A00",
          purple: "#9333EA",
          dark: "#0A0A0A",
          light: "#FAFAFA",
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        heading: ['var(--font-poppins)', 'sans-serif'],
      },
      backgroundImage: {
        'purple-gradient': 'linear-gradient(135deg, #8A2BE2, #4F46E5)',
      }
    },
  },
  plugins: [],
};
export default config;
```

## 📄 Standard CSS Variables (`globals.css`)

If using standard CSS variables alongside Tailwind:

```css
:root {
  --color-primary-orange: #FF8A00;
  --color-secondary-purple: #9333EA;
  --color-text-main: #111827;
  --color-text-muted: #4B5563;
  --color-bg-main: #FAFAFA;
  --color-bg-dark: #0A0A0A;
}
```