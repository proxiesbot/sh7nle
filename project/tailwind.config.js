import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './vendor/laravel/jetstream/**/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
        './resources/js/**/*.js',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            colors: {
                // shadcn/ui theme colors
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))',
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))',
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))',
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))',
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))',
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))',
                },
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))',
                },
                // Hi Card Primary Colors (keeping existing)
                'hicard-blue': {
                    DEFAULT: '#4285F4',
                    50: '#EBF3FE',
                    100: '#D6E7FD',
                    200: '#AECFFB',
                    300: '#85B7F9',
                    400: '#5D9FF7',
                    500: '#4285F4',
                    600: '#1165EA',
                    700: '#0D4FB8',
                    800: '#093A87',
                    900: '#062456',
                },
                'hicard-orange': {
                    DEFAULT: '#FF6B35',
                    50: '#FFE8E1',
                    100: '#FFD1C3',
                    200: '#FFBA9F',
                    300: '#FFA37B',
                    400: '#FF8757',
                    500: '#FF6B35',
                    600: '#FF4F13',
                    700: '#E63A00',
                    800: '#B42D00',
                    900: '#822100',
                },
                'hicard-bg': {
                    light: '#F5F7FA',
                    lighter: '#FAFBFC',
                    DEFAULT: '#E8EFF8',
                },
            },
            backgroundImage: {
                'gradient-sidebar': 'linear-gradient(180deg, #4285F4 0%, #2962FF 100%)',
                'gradient-primary': 'linear-gradient(135deg, #4285F4 0%, #1976D2 100%)',
                'gradient-header': 'linear-gradient(90deg, #5E35B1 0%, #1E88E5 100%)',
            },
            boxShadow: {
                'card': '0 2px 8px rgba(0, 0, 0, 0.1)',
                'card-hover': '0 4px 16px rgba(0, 0, 0, 0.15)',
                'card-lg': '0 8px 24px rgba(0, 0, 0, 0.12)',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)',
                'card': '12px',
            },
        },
    },

    plugins: [forms, typography],
};
