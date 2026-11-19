/**
 * NexFlow ERP - Official Centralized Design Tokens
 * Generated via UI UX Pro Max Skill
 * Domain: Enterprise Manufacturing & Production Planning (B2B SaaS)
 * Visual Density: 9/10 (High Information Density)
 * Accessibility: WCAG 2.2 AA Compliant
 */

export const tokens = {
  // 1. Color Palette & Semantic System
  colors: {
    // Brand & Primary
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb', // Core interactive blue
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
      DEFAULT: '#2563eb',
    },

    // Neutral Surfaces & Canvas
    neutral: {
      canvas: '#f8fafc',      // Workspace slate-50 background
      surface: '#ffffff',     // Card and table background
      surfaceSubtle: '#f1f5f9', // Table header, inactive tab, badge background
      surfaceHover: '#f8fafc',  // Row hover state
      borderSubtle: '#f1f5f9',
      border: '#e2e8f0',       // Standard structural 1px border
      borderStrong: '#cbd5e1', // Input hover / focused divider
      sidebar: '#0f172a',      // Primary navy navigation sidebar
      sidebarSubtle: '#1e293b',// Sidebar header / grouped container
      sidebarHover: '#334155', // Sidebar active / hover items
      sidebarBorder: '#1e293b',
    },

    // Typography Text Contrast
    text: {
      primary: '#0f172a',    // High-contrast primary headings and cell text (15.8:1 contrast on white)
      secondary: '#334155',  // Readable body copy and form labels (8.9:1 contrast)
      muted: '#64748b',      // Subtitles, table captions, units (4.6:1 WCAG AA compliant)
      inverted: '#ffffff',   // Text on dark buttons / dark sidebar
      invertedMuted: '#94a3b8',
    },

    // Semantic Status Matrix
    status: {
      success: {
        bg: '#ecfdf5',
        border: '#a7f3d0',
        text: '#047857',
        dot: '#10b981',
        solid: '#10b981',
        label: 'Completed / In-Stock / Passed',
      },
      warning: {
        bg: '#fffbeb',
        border: '#fde68a',
        text: '#b45309',
        dot: '#f59e0b',
        solid: '#f59e0b',
        label: 'Pending / Reorder / Low-Stock',
      },
      danger: {
        bg: '#fff1f2',
        border: '#fecdd3',
        text: '#be123c',
        dot: '#ef4444',
        solid: '#ef4444',
        label: 'Critical Shortage / Rejected / Blocked',
      },
      info: {
        bg: '#eff6ff',
        border: '#bfdbfe',
        text: '#1d4ed8',
        dot: '#3b82f6',
        solid: '#3b82f6',
        label: 'Active / In-Progress / Released',
      },
      neutral: {
        bg: '#f8fafc',
        border: '#e2e8f0',
        text: '#475569',
        dot: '#64748b',
        solid: '#64748b',
        label: 'Draft / Inactive / Archived',
      },
      purple: {
        bg: '#faf5ff',
        border: '#e9d5ff',
        text: '#7e22ce',
        dot: '#a855f7',
        solid: '#a855f7',
        label: 'Shift / Special Allocation',
      }
    },

    // Data Visualization & Chart Tokens
    charts: {
      output: '#2563eb',       // Actual production volume
      target: '#f59e0b',       // Benchmark target quota
      quality: '#10b981',      // First-pass yield %
      scrap: '#ef4444',        // Scrap variance
      capacity: '#6366f1',     // Line capacity utilization
      secondary: '#06b6d4',    // Ancillary telemetry
      grid: '#e2e8f0',         // Chart grid lines
      tooltipBg: '#0f172a',    // Dark high-contrast tooltip
      tooltipText: '#ffffff',
    }
  },

  // 2. Typography Hierarchy
  typography: {
    fonts: {
      sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: '"Fira Code", "Roboto Mono", SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    },
    sizes: {
      xs: { size: '0.75rem', lineHeight: '1rem', letterSpacing: '0.025em' },      // 12px
      sm: { size: '0.8125rem', lineHeight: '1.125rem', letterSpacing: '0.015em' }, // 13px
      base: { size: '0.875rem', lineHeight: '1.25rem', letterSpacing: '0' },       // 14px (standard ERP body)
      lg: { size: '1rem', lineHeight: '1.5rem', letterSpacing: '-0.01em' },        // 16px
      xl: { size: '1.125rem', lineHeight: '1.625rem', letterSpacing: '-0.015em' }, // 18px
      '2xl': { size: '1.5rem', lineHeight: '2rem', letterSpacing: '-0.02em' },     // 24px (KPI hero metrics)
      '3xl': { size: '1.875rem', lineHeight: '2.25rem', letterSpacing: '-0.025em' },// 30px
    },
    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    }
  },

  // 3. Spacing Scale (Density 9/10: Compact, High Information Density)
  spacing: {
    xs: '4px',    // 1
    sm: '8px',    // 2
    md: '12px',   // 3
    lg: '16px',   // 4
    xl: '20px',   // 5
    '2xl': '24px',// 6
    '3xl': '32px',// 8
    layout: {
      sidebarWidthExpanded: '260px',
      sidebarWidthCollapsed: '72px',
      topbarHeight: '64px',
      tableRowHeight: '44px',
      inputHeight: '38px',
      cardPadding: '20px',
      containerMax: '1600px',
    }
  },

  // 4. Border Radius Tokens
  radius: {
    none: '0px',
    sm: '4px',      // Small badges, micro tags
    md: '6px',      // Buttons, inputs, chips
    lg: '8px',      // Cards, dropdown menus, table containers
    xl: '12px',     // Modal dialogs, major feature cards
    '2xl': '16px',  // Toast banners, overlay sheets
    full: '9999px', // Circular status dots, pill badges
  },

  // 5. Elevation & Box Shadows (Soft Depth without muddy gradients)
  shadows: {
    none: 'none',
    '2xs': '0 1px 2px 0 rgba(15, 23, 42, 0.04)',
    xs: '0 1px 2px 0 rgba(15, 23, 42, 0.06)',
    sm: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)',
    md: '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',
    lg: '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.08)',
    xl: '0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
    dropdown: '0 10px 15px -3px rgba(15, 23, 42, 0.1), 0 4px 6px -4px rgba(15, 23, 42, 0.05)',
  },

  // 6. Transitions & Micro-Interactions (Motion 2/10: Fast, Functional)
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // 7. Z-Index Management
  zIndex: {
    base: 0,
    dropdown: 30,
    stickyHeader: 40,
    drawer: 50,
    modalBackdrop: 60,
    modalContent: 70,
    toast: 80,
    tooltip: 90,
  }
};

export default tokens;

