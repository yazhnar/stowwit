/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // --- stowwit token system ---
        // A cool charcoal base (not pure black) with a single warm amber
        // accent — evokes something valuable being archived/vaulted away,
        // deliberately avoiding both the cream/terracotta and near-black/
        // acid-green defaults.
        base: {
          DEFAULT: '#0D0E12',
          elevated: '#15171F',
          overlay: '#1C1F2A'
        },
        border: {
          DEFAULT: '#262832',
          subtle: '#1B1D26'
        },
        ink: {
          DEFAULT: '#EAEAF0',
          muted: '#8B8D9B',
          faint: '#5B5D6B'
        },
        amber: {
          DEFAULT: '#E0A85C',
          dim: '#8A6A3C'
        },
        diff: {
          add: '#1E2B22',
          addText: '#7FD99B',
          remove: '#2B1E1E',
          removeText: '#E39089'
        }
      },
      fontFamily: {
        sans: ['"Instrument Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace']
      }
    }
  },
  plugins: []
};
