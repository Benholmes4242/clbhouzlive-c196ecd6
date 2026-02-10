import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: {
				DEFAULT: '0px',
				sm: '0px',
				md: '2rem',
				lg: '2rem',
				xl: '2rem',
				'2xl': '2rem'
      },
      spacing: {
        'safe-area-inset-bottom': 'var(--safe-area-inset-bottom)',
      },
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
		fontFamily: {
			// SF Pro Text - For body text, buttons, labels, forms
			'sans': [
				'-apple-system',
				'BlinkMacSystemFont',
				'"SF Pro Text"',
				'"Segoe UI"',
				'Roboto',
				'"Helvetica Neue"',
				'Arial',
				'sans-serif',
			],
			// SF Pro Display - For headings and large text (text-xl and above)
			'display': [
				'-apple-system',
				'BlinkMacSystemFont',
				'"SF Pro Display"',
				'"Segoe UI"',
				'Roboto',
				'"Helvetica Neue"',
				'Arial',
				'sans-serif',
			],
			// League Spartan - Bold display font for special headings
			'league-spartan': [
				'"League Spartan"',
				'sans-serif',
			],
		},
			fontSize: {
				// CLBHOUZ SEMANTIC TYPE SCALE - 8 Roles
				'display-xl': ['2.125rem', { lineHeight: '1.15' }],   // 34px
				'display-lg': ['1.75rem',  { lineHeight: '1.2' }],    // 28px
				'heading-lg': ['1.375rem', { lineHeight: '1.3' }],    // 22px
				'heading-md': ['1.125rem', { lineHeight: '1.3' }],    // 18px
				'body-lg':    ['1rem',     { lineHeight: '1.5' }],    // 16px
				'body-md':    ['0.875rem', { lineHeight: '1.4' }],    // 14px
				'body-sm':    ['0.8125rem',{ lineHeight: '1.35' }],   // 13px
				'meta':       ['0.75rem',  { lineHeight: '1.25' }],   // 12px
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				clbhouzBg: 'var(--bg-page)',
				'surface-slate': 'var(--surface-slate)',
				'surface-card': 'var(--surface-card)',
				'surface-alt': 'var(--surface-alt)',
				'text-primary': 'var(--text-primary)',
				'text-secondary': 'var(--text-secondary)',
				'text-tertiary': 'var(--text-tertiary)',
				'icon-primary': 'var(--icon-primary)',
				'icon-secondary': 'var(--icon-secondary)',
				'icon-disabled': 'var(--icon-disabled)',
				'primary-accent': 'var(--primary-accent)',
				'cta-text': 'var(--cta-text-color)',
				'cta-text-dark': 'var(--cta-text-color-dark)',
				'border-subtle': 'var(--border-subtle)',
				'slate-secondary': 'var(--slate-secondary)',
				// Like heart active color - matches outstanding rating color
				'like': '#f59e0b',
				// Top 100 Club tier colors
				rookie: '#D9C7A3',
				fairway: '#8BBF5A',
				founders: '#2E5930',
				heritage: '#C8A44B',
				century: '#B7BCC6',
				elite: '#D9A441',
				legendary: '#5A3E8C',
				grandslam: '#0C0F14',
				// Top 100 Region colors
				region: {
					global: 'rgb(var(--region-global) / <alpha-value>)',
					gbi: 'rgb(var(--region-gbi) / <alpha-value>)',
					usa: 'rgb(var(--region-usa) / <alpha-value>)',
					europe: 'rgb(var(--region-europe) / <alpha-value>)',
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				'media-loading': 'hsl(var(--media-loading))',
				'brand-orange': 'hsl(var(--brand-orange))',
				'brand-orange-hover': 'hsl(var(--brand-orange-hover))',
				'brand-orange-light': 'hsl(var(--brand-orange-light))',
				'brand-black': 'hsl(var(--brand-black))',
				'hud-bg': 'var(--hud-bg)',
				'hud-border': 'var(--hud-border)',
				// Warning color token (amber)
				warning: {
					DEFAULT: 'hsl(var(--warning))',
				},
				// Top 100 trophy gold - matches Outstanding rating tier
				'trophy-gold': 'var(--rating-band-outstanding)',
			},
			backgroundImage: {
				'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				/**
				 * SQUIRCLE DESIGN SYSTEM (SDS) - Global border radius tokens
				 * ============================================================
				 * These tokens create a unified, premium visual language across the app.
				 * Based on ≈34% corner curvature matching our global squircle avatar.
				 * 
				 * USAGE GUIDE:
				 * - sq-xs (10px): Small pills, chips, tiny inputs, small badges
				 * - sq-sm (14px): Tabs, buttons, medium inputs, search bars
				 * - sq-md (18px): Standard cards, larger inputs, modals
				 * - sq-lg (24px): Hero cards, large panels, feature sections
				 * - sq-pill (999px): Full capsule for segmented controls & pills
				 * 
				 * DO NOT USE: rounded-lg, rounded-xl, rounded-2xl, rounded-3xl
				 * INSTEAD USE: rounded-sq-xs, rounded-sq-sm, rounded-sq-md, rounded-sq-lg, rounded-sq-pill
				 * EXCEPTION: rounded-full for truly circular elements (dots, avatar rings)
				 */
				'sq-xs': '10px',
				'sq-sm': '14px',
				'sq-md': '18px',
				'sq-lg': '24px',
				'sq-pill': '999px'
			},
			spacing: {
				'header-mobile': 'var(--header-h-mobile)',
				'header-desktop': 'var(--header-h-desktop)',
				'tag-offset': 'var(--tag-offset)',
				/**
				 * GLOBAL VERTICAL SPACING SYSTEM
				 * ================================
				 * These tokens create consistent vertical rhythm across all pages.
				 * 
				 * USAGE GUIDE:
				 * - space-section (24px): Between major sections/modules
				 * - space-block (16px): Header→content, card→card stacks
				 * - space-sub (8px): Title→subtitle, button→helper text
				 * - space-internal (12px): Inside cards, list row padding
				 * 
				 * DO NOT USE: mt-5, mt-7, gap-5, space-y-5, space-y-7, etc.
				 * INSTEAD USE: mt-section, gap-block, space-y-internal, etc.
				 */
				'section': '24px',   // Section → section
				'block': '16px',     // Header → content, card → card
				'sub': '8px',        // Title → subtitle
				'internal': '12px',  // Inside cards, list rows
			},
			height: {
				'header-mobile': 'var(--header-h-mobile)',
				'header-desktop': 'var(--header-h-desktop)',
				'screen-small': '100svh',
				'screen-dynamic': '100dvh'
			},
			minHeight: {
				'screen-small': '100svh',
				'screen-dynamic': '100dvh'
			},
			boxShadow: {
				'hud': 'var(--hud-shadow)'
			},
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'slide-in-up': {
					'0%': {
						transform: 'translateY(100%)',
						opacity: '0'
					},
					'80%': {
						transform: 'translateY(-5px)',
						opacity: '1'
					},
					'100%': {
						transform: 'translateY(0)',
						opacity: '1'
					}
				},
				'slide-in-right': {
					'0%': {
						transform: 'translateX(16px)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateX(0)',
						opacity: '1'
					}
				},
				'slide-out-left': {
					'0%': {
						transform: 'translateX(0)',
						opacity: '1'
					},
					'100%': {
						transform: 'translateX(-100%)',
						opacity: '0.5'
					}
				},
				'slide-in-from-right': {
					'0%': {
						transform: 'translateX(100%)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateX(0)',
						opacity: '1'
					}
				},
				'slide-out-right': {
					'0%': {
						transform: 'translateX(0)',
						opacity: '1'
					},
					'100%': {
						transform: 'translateX(100%)',
						opacity: '0.5'
					}
				},
				'slide-in-from-left': {
					'0%': {
						transform: 'translateX(-100%)',
						opacity: '0'
					},
					'100%': {
						transform: 'translateX(0)',
						opacity: '1'
					}
				},
				'slide-in-from-right-bounce': {
					'0%': {
						transform: 'translateX(100%)',
						opacity: '0'
					},
					'80%': {
						transform: 'translateX(-2%)',
						opacity: '1'
					},
					'100%': {
						transform: 'translateX(0)',
						opacity: '1'
					}
				},
				'slide-in-from-left-bounce': {
					'0%': {
						transform: 'translateX(-100%)',
						opacity: '0'
					},
					'80%': {
						transform: 'translateX(2%)',
						opacity: '1'
					},
					'100%': {
						transform: 'translateX(0)',
						opacity: '1'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'shake': {
					'0%, 100%': {
						transform: 'translateX(0)'
					},
					'10%, 30%, 50%, 70%, 90%': {
						transform: 'translateX(-4px)'
					},
					'20%, 40%, 60%, 80%': {
						transform: 'translateX(4px)'
					}
				},
				'shimmer': {
					'0%': {
						transform: 'translateX(-100%)'
					},
					'100%': {
						transform: 'translateX(100%)'
					}
				},
				'shimmer-slide': {
					'0%': {
						backgroundPosition: '-200% 0'
					},
					'100%': {
						backgroundPosition: '200% 0'
					}
				},
				'slow-spin': {
					'0%': {
						transform: 'rotate(0deg)'
					},
					'100%': {
						transform: 'rotate(360deg)'
					}
				},
				'slide-in-from-right-modal': {
					'0%': {
						transform: 'translateX(100%)'
					},
					'100%': {
						transform: 'translateX(0)'
					}
				},
				'slide-out-to-right-modal': {
					'0%': {
						transform: 'translateX(0)'
					},
					'100%': {
						transform: 'translateX(100%)'
					}
				},
				'echo-typing-dot': {
					'0%, 60%, 100%': {
						transform: 'scale(1)',
						opacity: '0.6'
					},
					'30%': {
						transform: 'scale(1.2)',
						opacity: '1'
					}
				},
				'slide-in-left': {
					'0%': {
						opacity: '0',
						transform: 'translateX(-16px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateX(0)'
					}
				},
				'ring-pulse': {
					'0%': {
						transform: 'scale(0.9)',
						boxShadow: '0 0 0 0 rgba(110,146,119,0.5)'
					},
					'60%': {
						transform: 'scale(1)',
						boxShadow: '0 0 0 18px rgba(110,146,119,0)'
					},
					'100%': {
						transform: 'scale(1)',
						boxShadow: '0 0 0 0 rgba(110,146,119,0)'
					}
				},
				'podium-glow': {
					'0%, 100%': {
						transform: 'scale(1)',
						boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 0 0 0 rgba(251, 191, 36, 0)'
					},
					'50%': {
						transform: 'scale(1.02)',
						boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 0 20px 4px rgba(251, 191, 36, 0.15)'
					}
				},
				// Podium pulse - subtle avatar ring pulse for 1st place (per spec)
				'podium-pulse': {
					'0%, 100%': {
						transform: 'scale(1)',
						boxShadow: '0 0 0 0 rgba(251, 191, 36, 0)'
					},
					'50%': {
						transform: 'scale(1.02)',
						boxShadow: '0 0 20px 4px rgba(251, 191, 36, 0.15)'
					}
				},
				'podium-flash': {
					'0%': {
						boxShadow: '0 0 0 0 rgba(251, 191, 36, 0.5)'
					},
					'50%': {
						boxShadow: '0 0 20px 8px rgba(251, 191, 36, 0.3)'
					},
					'100%': {
						boxShadow: '0 0 0 0 rgba(251, 191, 36, 0)'
					}
				},
				// Championship flame animations
				'flame-small': {
					'0%, 100%': { transform: 'scale(1) rotate(-2deg)', opacity: '0.8' },
					'50%': { transform: 'scale(1.1) rotate(2deg)', opacity: '1' }
				},
				'flame-medium': {
					'0%, 100%': { transform: 'scale(1) rotate(-3deg)', opacity: '0.9' },
					'50%': { transform: 'scale(1.15) rotate(3deg)', opacity: '1' }
				},
				'flame-large': {
					'0%, 100%': { transform: 'scale(1) rotate(-4deg)', opacity: '0.95' },
					'25%': { transform: 'scale(1.1) rotate(2deg)' },
					'50%': { transform: 'scale(1.2) rotate(4deg)', opacity: '1' },
					'75%': { transform: 'scale(1.1) rotate(-2deg)' }
				},
				'flame': {
					'0%, 100%': { transform: 'scale(1) rotate(-2deg)' },
					'50%': { transform: 'scale(1.15) rotate(2deg)' }
				},
				'pulse-subtle': {
					'0%, 100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)' },
					'50%': { boxShadow: '0 0 40px rgba(16, 185, 129, 0.2)' }
				},
				'slide-in-rank': {
					'0%': { opacity: '0', transform: 'translateY(-8px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'bounce-in': {
					'0%': { transform: 'scale(0.5)', opacity: '0' },
					'50%': { transform: 'scale(1.05)' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				// Shimmer-down animation for Watch tab standard skeletons
				'shimmer-down': {
					'0%': { 
						backgroundImage: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
						backgroundPosition: 'center -100%'
					},
					'100%': { 
						backgroundImage: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
						backgroundPosition: 'center 200%'
					}
				},
				'progress-fill': {
					'0%': { transform: 'scaleX(0)' },
					'100%': { transform: 'scaleX(1)' }
				}
			},
			transitionDuration: {
				'motion-ultrafast': 'var(--motion-ultrafast)',
				'motion-fast': 'var(--motion-fast)',
				'motion-medium': 'var(--motion-medium)',
				'motion-slow': 'var(--motion-slow)',
			},
			transitionTimingFunction: {
				'ease-standard': 'var(--ease-standard)',
				'ease-pop': 'var(--ease-pop)',
				'ease-out': 'var(--ease-out)',
				'ease-in': 'var(--ease-in)',
			},
			animation: {
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'slide-in-up': 'slide-in-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
				'slide-in-right': 'slide-in-right 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'slide-out-left': 'slide-out-left 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'slide-in-from-right': 'slide-in-from-right 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'slide-out-right': 'slide-out-right 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'slide-in-from-left': 'slide-in-from-left 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'slide-in-from-right-bounce': 'slide-in-from-right-bounce 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
				'slide-in-from-left-bounce': 'slide-in-from-left-bounce 350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
				'fade-in': 'fade-in 0.3s ease-out',
				'shake': 'shake 0.6s ease-in-out',
				'shimmer': 'shimmer 2s infinite',
				'shimmer-slide': 'shimmer-slide 1.5s ease-in-out infinite',
				'slow-spin': 'slow-spin 20s linear infinite',
				'slide-in-from-right-modal': 'slide-in-from-right-modal 250ms ease-out',
				'slide-out-to-right-modal': 'slide-out-to-right-modal 250ms ease-out',
				'echo-typing-dot': 'echo-typing-dot 1.4s ease-in-out infinite',
				'slide-in-left': 'slide-in-left 220ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'ring-pulse': 'ring-pulse 900ms ease-out 1',
				'podium-glow': 'podium-glow 6s ease-in-out infinite',
				'podium-pulse': 'podium-pulse 6s ease-in-out infinite',
				'podium-flash': 'podium-flash 700ms ease-out',
				// Championship flame animations
				'flame-small': 'flame-small 1.5s ease-in-out infinite',
				'flame-medium': 'flame-medium 1.2s ease-in-out infinite',
				'flame-large': 'flame-large 1s ease-in-out infinite',
				'flame': 'flame 1.2s ease-in-out infinite',
				'pulse-subtle': 'pulse-subtle 3s ease-in-out infinite',
				'slide-in-rank': 'slide-in-rank 0.3s ease-out',
				'bounce-in': 'bounce-in 0.4s ease-out',
				// Shimmer-down animation for Watch tab standard skeletons
				'shimmer-down': 'shimmer-down 1.5s ease-in-out infinite',
				'progress-fill': 'progress-fill 5s linear forwards'
			}
		}
	},
	safelist: [
		'w-1.5', 'w-5',
		'bg-white', 'bg-white/60', 'dark:bg-white', 'dark:bg-white/50',
		'h-1.5', 'rounded-full', 'transition-all', 'duration-200', 'ease-out',
	],
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
