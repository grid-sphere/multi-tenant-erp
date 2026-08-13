/** @type {import('tailwindcss').Config} */
/* Each token exists twice in index.css: --color-x as a hex colour (consumed by
 * the ~430 inline style={{ color: 'var(--color-x)' }} props and color-mix()
 * calls in the pages) and --color-x-rgb as bare channels. Tailwind uses the
 * channel form so slash-opacity (text-primary/70, bg-tertiary/5) can inject an
 * alpha. <alpha-value> is substituted at build time. */
const token = (name) => `rgb(var(--color-${name}-rgb) / <alpha-value>)`;

module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        /* ------------------------------------------------------------------
         * Semantic tokens — resolved from CSS custom properties in index.css
         * so light/dark switching is a single class on <html>.
         * ---------------------------------------------------------------- */
        /* Numeric shades exist because the codebase already references
         * text-primary-400 / hover:text-primary-300 in places. DEFAULT keeps
         * plain `bg-primary` working. */
        primary: {
          DEFAULT: token("primary"),
          200: "#aee2db",
          300: "#7ccfc5",
          400: "#45b3a7",
          500: "#17948a",
          600: "#0f766e",
          700: "#0d5f59",
        },
        "primary-container": token("primary-container"),
        "primary-fixed": token("primary-fixed"),
        secondary: token("secondary"),
        "secondary-container": token("secondary-container"),
        "on-secondary-container": token("on-secondary-container"),
        "secondary-fixed": token("secondary-fixed"),
        tertiary: token("tertiary"),
        "tertiary-container": token("tertiary-container"),
        "on-tertiary-container": token("on-tertiary-container"),
        "tertiary-fixed": token("tertiary-fixed"),
        "on-tertiary-fixed-variant": token("on-tertiary-fixed-variant"),
        background: token("background"),
        surface: token("surface"),
        "surface-container-low": token("surface-container-low"),
        "surface-container-lowest": token("surface-container-lowest"),
        "surface-container": token("surface-container"),
        "surface-container-high": token("surface-container-high"),
        "surface-container-highest": token("surface-container-highest"),
        "surface-variant": token("surface-variant"),
        "surface-tint": token("surface-tint"),
        "on-surface": token("on-surface"),
        "on-surface-variant": token("on-surface-variant"),
        "on-background": token("on-background"),
        "on-primary": token("on-primary"),
        "on-primary-container": token("on-primary-container"),
        "on-primary-fixed": token("on-primary-fixed"),
        outline: token("outline"),
        "outline-variant": token("outline-variant"),
        scrim: token("scrim"),
        error: token("error"),
        success: token("success"),
        warning: token("warning"),
        info: token("info"),

        /* Per-role accents — for tinting dashboards by audience. */
        "role-admin": token("role-admin"),
        "role-school": token("role-school"),
        "role-teacher": token("role-teacher"),
        "role-parent": token("role-parent"),
        "role-student": token("role-student"),

        /* ------------------------------------------------------------------
         * Palette overrides.
         *
         * The codebase carries ~5,000 literal utility classes (bg-slate-100,
         * text-blue-600, ...) alongside the semantic tokens above. Rather than
         * rewriting every call site, the underlying scales are redefined here
         * so existing markup inherits the warm palette automatically.
         *
         * slate / gray -> cool-neutral greys matching the surface family
         * blue  / indigo -> the muted teal used as primary
         * ---------------------------------------------------------------- */
        slate: {
          50: "#f7f8f8",
          100: "#f1f3f4",
          200: "#e4e8e9",
          300: "#d0d6d8",
          400: "#a4aeb2",
          500: "#7d888d",
          600: "#5b6770",
          700: "#454f55",
          800: "#2e373b",
          900: "#1c2124",
          950: "#101416",
        },
        gray: {
          50: "#f7f8f8",
          100: "#f1f3f4",
          200: "#e4e8e9",
          300: "#d0d6d8",
          400: "#a4aeb2",
          500: "#7d888d",
          600: "#5b6770",
          700: "#454f55",
          800: "#2e373b",
          900: "#1c2124",
          950: "#101416",
        },
        blue: {
          50: "#eefaf8",
          100: "#d6f0ec",
          200: "#aee2db",
          300: "#7ccfc5",
          400: "#45b3a7",
          500: "#17948a",
          600: "#0f766e",
          700: "#0d5f59",
          800: "#104b47",
          900: "#113f3c",
          950: "#042726",
        },
        indigo: {
          50: "#eefaf8",
          100: "#d6f0ec",
          200: "#aee2db",
          300: "#7ccfc5",
          400: "#45b3a7",
          500: "#17948a",
          600: "#0f766e",
          700: "#0d5f59",
          800: "#104b47",
          900: "#113f3c",
          950: "#042726",
        },
      },
      fontFamily: {
        headline: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      fontSize: {
        "3xs": ["var(--font-size-3xs)", { lineHeight: "1rem" }],
        "2xs": ["var(--font-size-2xs)", { lineHeight: "1rem" }],
        xs: ["var(--font-size-xs)", { lineHeight: "1.25rem" }],
        sm: ["var(--font-size-sm)", { lineHeight: "1.5rem" }],
        base: ["var(--font-size-base)", { lineHeight: "1.75rem" }],
        lg: ["var(--font-size-lg)", { lineHeight: "1.75rem" }],
        xl: ["var(--font-size-xl)", { lineHeight: "1.75rem" }],
        "2xl": ["var(--font-size-2xl)", { lineHeight: "2rem" }],
        "3xl": ["var(--font-size-3xl)", { lineHeight: "2.25rem" }],
        "4xl": ["var(--font-size-4xl)", { lineHeight: "2.5rem" }],
        "5xl": ["var(--font-size-5xl)", { lineHeight: "1.1" }],
      },
      transitionDuration: {
        400: "400ms",
      },
      /* Softer corners throughout — the single biggest lever on "warmth". */
      borderRadius: {
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      /* Shadows tinted with the cool neutral rather than pure black. */
      boxShadow: {
        sm: "0 1px 2px 0 rgba(28, 33, 36, 0.05)",
        DEFAULT: "0 1px 3px 0 rgba(28, 33, 36, 0.08), 0 1px 2px -1px rgba(28, 33, 36, 0.06)",
        md: "0 4px 8px -2px rgba(28, 33, 36, 0.08), 0 2px 4px -2px rgba(28, 33, 36, 0.05)",
        lg: "0 10px 20px -4px rgba(28, 33, 36, 0.09), 0 4px 8px -4px rgba(28, 33, 36, 0.05)",
        xl: "0 18px 32px -8px rgba(28, 33, 36, 0.12), 0 6px 12px -6px rgba(28, 33, 36, 0.06)",
      },
    },
  },
  plugins: [],
};
