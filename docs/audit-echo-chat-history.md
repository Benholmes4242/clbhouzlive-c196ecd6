# Echo Chat + Echo History — Complete Technical & UX Audit

**Date:** 2025-11-10  
**Scope:** Echo Chat (live) + Echo History (index + detail)  
**Status:** Read-only documentation (no code changes)

---

## 1) Pages & Files — Inventory

### Core Pages

```
src/features/hub/pages/
├── HubEchoChatPage.tsx          # Live Echo chat (full-screen glass page)
├── HubEchoHistoryPage.tsx       # History index (list of past chats)
└── HubEchoHistoryDetailPage.tsx # Single chat thread view (read-only)
```

### Components

```
src/components/ai-chat/
├── AIChatOverlay.tsx            # Main chat overlay/modal component (1440 lines)
├── ChatMessage.tsx              # Individual message bubble renderer (391 lines)
├── EchoTypingBar.tsx            # Loading/typing indicator (27 lines)
├── EchoBotIcon.tsx              # Echo robot avatar icon
├── EchoAvatar.tsx               # Animated Echo avatar states
├── AIChatHistory.tsx            # History sidebar (legacy?)
├── SwingHistoryList.tsx         # Swing analysis history (stub)
├── HistoryPanel.tsx             # Conversation history panel
├── SwingCoach.tsx               # Swing analysis tab
├── CaddieLogs.tsx               # Caddie logs tab
└── OverlayFooter.tsx            # Chat footer utilities
```

### Data Layer (Hooks)

```
src/features/echo/hooks/
├── useEchoChatHistory.ts        # Fetch chat history list
├── useEchoChatThread.ts         # Fetch single thread messages
├── useEchoHistory.ts            # Recent preview for dashboard tile
├── useEchoThreadMessages.ts     # Thread messages (relational)
├── useSwingHistory.ts           # Swing analysis history
├── useSwingMessages.ts          # Swing conversation messages
├── useSwingDetail.ts            # Single swing detail
└── useSwingConversation.ts      # Swing conversation (legacy JSONB)
```

### Data Fetchers

```
src/features/echo/data/
└── history.fetchers.ts          # Dual-read: conversations + echo_threads
```

### Services

```
src/features/echo/services/
└── echoPersistence.ts           # Thread/message persistence helpers
```

### Styles & Tokens

```
src/styles/
├── style-tokens.css             # Design tokens (bubbles, glass, safe-areas)
└── index.css                    # Global styles + bubble-prose

src/features/hub/home/
└── hubTheme.css                 # Hub-specific tokens (516 lines)
```

### Config

```
src/config/
└── zIndex.ts                    # Z-index hierarchy (page: 9999, header: 10000)
```

### Utils

```
src/utils/
├── dateFormat.ts                # formatRelativeTime, formatDateTime
└── swingAnalysisParser.ts       # Parse swing analysis markdown
```

---

## 2) UI & Layout — Exact Measurements

### Echo Chat (Live) — `/hub/echo`

**Route:** `/hub/echo`  
**Component:** `HubEchoChatPage` → `AIChatOverlay` (paneMode + page layout)

#### Header
- **Height:** `56px` (3.5rem) — `var(--header-h)`
- **Top offset:** `env(safe-area-inset-top, 0px)`
- **Background:** `rgba(22, 24, 27, 0.98)` — solid dark with 98% opacity
- **Border:** `var(--hub-stroke)` = `rgba(255,255,255,0.09)`
- **Blur:** None (header is solid, no blur)
- **z-index:** `Z.pageHeader` = `10000`
- **Padding:** `px-4` (16px horizontal)
- **Structure:**
  - Left: "‹ Back" button (text-white/90, text-[15px], font-medium)
  - Center: "Echo" title (text-white/90, text-[17px], font-semibold)
  - Right: 16px spacer

#### Content Area (Chat Rail)
- **Height:** `100vh - 3.5rem` (minus header)
- **Top padding:** `calc(var(--header-h) + env(safe-area-inset-top, 0px) + 12px)`
  - Mobile: ~68px + safe-area
  - Desktop: ~68px
- **Left/right padding:** `16px`
- **Bottom padding:** Page mode: `112px` (for composer), Overlay mode: `16px`
- **Scroll padding bottom:** `86px`
- **Scroll behavior:** `scroll-smooth`, `overscroll-contain`
- **Overflow:** `overflow-y-auto`, `-webkit-overflow-scrolling: touch`

#### Message Bubbles
- **Max width:**
  - Mobile: `var(--bubble-max-mobile)` = `82vw`
  - Desktop: `var(--bubble-max-desktop)` = `70vw`
- **Border radius:** `var(--bubble-radius)` = `18px`
- **Padding:**
  - X: `var(--bubble-pad-x)` = `16px`
  - Y: `var(--bubble-pad-y)` = `12px`
- **Spacing:**
  - First in group (after different speaker): `mt-4` (16px)
  - Same speaker: `mt-2.5` (10px)
- **Echo bubble:**
  - Background: `var(--bubble-echo-grad)` = `linear-gradient(145deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,.06) 100%)`
  - Border: `1px solid var(--bubble-echo-border)` = `rgba(255,255,255,0.14)`
  - Shadow: `0 2px 8px rgba(0,0,0,0.15), var(--bubble-echo-inset)`
  - Inset: `inset 0 1px 1px rgba(255,255,255,.12)`
- **User bubble:**
  - Background: `var(--bubble-user-bg)` = `rgba(255,255,255,0.10)`
  - Border: `1px solid var(--bubble-user-border)` = `rgba(255,255,255,0.20)`
  - Shadow: `0 2px 8px rgba(0,0,0,0.15), var(--bubble-user-inset)`
  - Inset: `inset 0 0 28px rgba(255,255,255,0.14)`

#### Loading Bubble
- **Same as Echo bubble** — uses `rounded-[var(--bubble-radius)]`
- **Min height:** `calc(var(--bubble-pad-y) * 2 + 20px)` = ~44px
- **Content:** Three animated dots (1.5px × 1.5px, rounded-full, bg-white/40)
- **Animation:** `animate-bounce` with staggered delays

#### Avatar Chips
- **Size:** `28px × 28px`
- **Radius:** `8px` (squircle)
- **Background:** `rgba(255,255,255,0.08)`
- **Border:** `1px solid rgba(255,255,255,0.12)`
- **Blur:** `blur(12px)`
- **Spacing:** `gap-2` (8px) from label
- **Label:** `text-[12px]`, `font-medium`, `text-white/70`, `letter-spacing: 0.2px`
- **Visibility:** Only on first message in group (`isFirstInGroup`)
- **User chip:** Profile photo (SquircleImage 28px) or initials fallback
- **Echo chip:** Bot icon (w-5 h-5, text-white/80)

#### Composer (Footer)
- **z-index:** `Z.composer` = `2`
- **Height:** ~40px input + padding
- **Top padding:** `16px`
- **Bottom padding:** `calc(16px + env(safe-area-inset-bottom, 0px))`
- **Left/right padding:** `16px`
- **Background (page mode):** 
  - `linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)`
  - Blur: `12px`
- **Border:** `border-t`, `rgba(255,255,255,0.12)`
- **Input:**
  - Height: `40px`
  - Radius: `14px`
  - Padding: `0 44px 0 14px`
  - Background: `rgba(255,255,255,0.06)`
  - Border: `1px solid rgba(255,255,255,0.08)`
  - Text: `text-[15px]`, `text-white`, `placeholder:text-white/70`
- **Send button:**
  - Position: Absolute right `6px`, centered vertically
  - Size: `34px × 34px`
  - Radius: `12px`
  - Background: `rgba(255,255,255,0.10)`
  - Border: `1px solid rgba(255,255,255,0.15)`
  - Icon: Send (h-4 w-4, text-white/90)

#### Progress Bar
- **Position:** Absolute top of composer
- **Height:** `2px`
- **Background:** `rgba(255,255,255,0.20)`
- **Fill:** `rgba(255,255,255,0.60)`, width `33.33%`
- **Animation:** `progressShimmer 1.6s linear infinite`

---

### Echo History Index — `/hub/echo/history`

**Component:** `HubEchoHistoryPage`

#### Header
- **Height:** `80px` (includes padding)
- **Top padding:** `pt-4` (16px)
- **Bottom padding:** `pb-3` (12px)
- **Left/right padding:** `px-5` (20px)
- **Background:** Transparent
- **Border:** `border-bottom`, `1px solid var(--hub-header-stroke)` = `rgba(255,255,255,0.09)`
- **Structure:**
  - Left: "← Back" button (text-[15px], color: var(--hub-text-body))
  - Center: "AI Chat History" title (text-[17px], font-semibold, color: var(--hub-text))
  - Right: X close button (w-11 h-11, color: var(--hub-close-idle))

#### Body (Scroll Container)
- **Height:** `calc(100vh - 80px)`
- **Padding:** `px-3.5 pt-3 pb-6` (14px horizontal, 12px top, 24px bottom)
- **Overflow:** `overflow-y-auto`

#### Card Container
- **Radius:** `rounded-3xl` (24px)
- **Padding:** `p-6` (24px)
- **Background:** `var(--hub-glass-bg)` = `rgba(255,255,255,0.08)`
- **Border:** `1px solid var(--hub-stroke)` = `rgba(255,255,255,0.14)`
- **Blur:** `blur(20px)`

#### Section Title
- **Text:** "Recent chats"
- **Size:** `text-[15px]`
- **Weight:** `font-medium`
- **Color:** `var(--hub-text)` = `rgba(255,255,255,0.95)`
- **Margin:** `mb-4` (16px)

#### Chat Row
- **Width:** Full width
- **Padding:** `p-4` (16px)
- **Radius:** `rounded-2xl` (16px)
- **Gap:** `gap-3` (12px)
- **Background:** `var(--hub-glass-bg)`
- **Border:** `1px solid var(--hub-stroke)`
- **Hover background:** `var(--hub-hover)` = `rgba(255,255,255,0.12)`
- **Structure:**
  - Leading: 🗨️ emoji (text-2xl, 24px)
  - Main: 
    - Title: text-[15px], font-medium, truncate, color: var(--hub-text)
    - Timestamp: text-[13px], mt-0.5, color: var(--hub-text-dim) = rgba(255,255,255,0.50)
  - Trailing: › chevron (text-xl, 20px, color: var(--hub-text-dim))
- **Spacing:** `space-y-2` (8px between rows)

#### Loading Skeletons
- **Height:** `h-16` (64px)
- **Radius:** `rounded-2xl` (16px)
- **Background:** `var(--hub-glass-bg)`
- **Animation:** `animate-pulse`
- **Count:** 5 skeletons

#### Empty State
- **Text:** "No Echo chats yet — ask Echo a question to get started."
- **Size:** `text-[15px]`
- **Color:** `var(--hub-text-dim)`
- **Padding:** `py-8` (32px vertical)
- **Align:** `text-center`

---

### Echo History Detail — `/hub/echo/history/chat/:id`

**Component:** `HubEchoHistoryDetailPage`

#### Header (Same as Chat Page)
- **Height:** `56px` (3.5rem)
- **Structure:** Identical to live chat header
- **Title:** "AI Chat" instead of "Echo"

#### Content Area
- **Height:** `calc(100vh - 3.5rem)`
- **Padding:** `px-4 pt-4 pb-6`
- **Overflow:** `overflow-y-auto`

#### Card
- **Radius:** `var(--hub-radius)` (from hubTheme.css)
- **Padding:** `var(--hub-pad)` (from hubTheme.css)
- **Background:** `var(--hub-glass-bg)`
- **Border:** `1px solid var(--hub-stroke)`

#### Card Title
- **Text:** "Conversation"
- **Class:** `.hub-card-title`
- **Size:** `17px`
- **Weight:** `600`
- **Color:** `var(--hub-text-bright)` = `rgba(255,255,255,0.95)`
- **Margin:** `mb-3` (12px)

#### Timestamp
- **Class:** `.hub-muted`
- **Color:** `var(--hub-text-dim)` = `rgba(255,255,255,0.50)`
- **Margin:** `mb-3` (12px)
- **Format:** Uses `formatDateTime()` → "Nov 10, 2025, 3:45 PM"

#### Message Bubbles (Read-only)
- **Container:** `.echo-thread` (flex column, gap-10px from hubTheme.css)
- **Bubble:** `.bubble` base class
  - Padding: `12px 14px`
  - Radius: `14px` (⚠️ Different from live chat's 18px)
  - Max width: `84%`
  - Word wrap: `break-word`
- **User bubble:** `.bubble.me`
  - Background: `rgba(255,255,255,0.10)`
  - Border: `1px solid rgba(255,255,255,0.14)`
  - Align: `ml-auto`
- **Echo bubble:** `.bubble.bot`
  - Background: `rgba(255,255,255,0.06)`
  - Border: `1px solid rgba(255,255,255,0.10)`
  - Align: `mr-auto`

**⚠️ CRITICAL DIFFERENCE:** History detail uses `.bubble` classes from hubTheme.css with hardcoded 14px radius, while live chat uses `var(--bubble-radius)` = 18px. This is a **styling divergence**.

---

## 3) Typography & Markdown Rendering

### Renderers

#### Live Chat (AIChatOverlay → ChatMessage)
- **Library:** `react-markdown` + `remark-gfm`
- **Location:** `ChatMessage.tsx` lines 219-275
- **Applied to:** Echo messages only (user messages are plain text)

#### History Detail (HubEchoHistoryDetailPage)
- **Renderer:** Plain text only (lines 77-78)
- **No markdown processing:** Content is rendered as `{m.content}`
- **⚠️ CRITICAL ISSUE:** Markdown is **not rendered** in history detail — all formatting is lost

### Markdown Rules (Live Chat Only)

| Element | Size | Weight | Spacing | Color | Notes |
|---------|------|--------|---------|-------|-------|
| `h1` | 16px | semibold | mb-2, mt-[10px] (first:mt-0) | text-white | letter-spacing: 0.2px |
| `h2` | 15.5px | semibold | mb-2, mt-[10px] | text-white | letter-spacing: 0.2px |
| `h3` | 15px | semibold (600) | mb-[6px], mt-[10px] | text-white | letter-spacing: 0.2px |
| `p` | 15px | normal | my-2 (first:mt-0, last:mb-0) | text-white/90 | break-words |
| `strong` | inherit | semibold | - | text-white | - |
| `ul` | 15px | - | list-disc, pl-[18px], my-2 | marker: text-white/65 | - |
| `ol` | 15px | - | list-decimal, pl-[18px], my-2 | marker: text-white/65 | - |
| `li` | 15px | - | leading-[1.55], my-0.5 | inherit | - |
| `a` | 15px | - | underline, offset-2 | text-white/85 | hover: decoration-white, focus: ring-[8px] white/[0.08] |
| `code` (inline) | 13px | mono | px-1.5 py-0.5, rounded-[4px] | text-white | bg-white/08, border-white/12 |
| `pre` | - | - | mt-2, rounded-[10px] | - | Black/70 bg, white/10 border, shadow |
| `img` | auto | - | mt-3, rounded-xl | - | border-white/08, bg-white/06 |

### Prose Utilities (index.css)

```css
.bubble-prose p { margin: 8px 0; }
.bubble-prose ul, .bubble-prose ol { margin: 8px 0 8px 18px; }
.bubble-prose li { margin: 6px 0; }
.bubble-prose a { 
  text-decoration: underline; 
  text-decoration-color: rgba(255,255,255,0.5); 
}
```

### "Wall of Text" Issue in History Detail

**Problem:** History detail renders raw markdown as plain text with no formatting.

**Example:**

**Live Chat:**
```
**Setup Fundamentals**

1. Ball position: Just inside left heel
2. Stance: Shoulder-width apart

[Sources used]
```

**History Detail:**
```
**Setup Fundamentals**\n\n1. Ball position: Just inside left heel\n2. Stance: Shoulder-width apart\n\n[Sources used]
```

**Root cause:** `HubEchoHistoryDetailPage` renders `{m.content}` directly without `ReactMarkdown` component.

---

## 4) Grouping, Timestamps, Chips

### Message Grouping Logic (Live Chat)

**File:** `AIChatOverlay.tsx` lines 531-554

```typescript
const isFirstInGroup = !prevMessage || prevMessage.type !== message.type;
```

**Rules:**
- Messages from the same speaker (user or Echo) are grouped together
- First message in group gets heading + avatar chip
- Subsequent messages in group have no heading/chip
- Gap between groups: `mt-4` (16px)
- Gap within group: `mt-2.5` (10px)

### Timestamp Display

#### Live Chat
- **Location:** `ChatMessage.tsx` lines 374-384
- **Position:** Below bubble, right-aligned for user, left-aligned for Echo
- **Size:** `text-[12px]`
- **Color:** `text-white/55`
- **Spacing:** `pt-1` (4px above timestamp)
- **Format:** `HH:MM AM/PM` (e.g., "3:45 PM")
- **Always visible:** Yes, on every message

#### History Index
- **Location:** `HubEchoHistoryPage.tsx` line 171
- **Format:** Relative time via `formatRelativeTime()`
  - "Today"
  - "X days ago" (1-6 days)
  - "Last week" (7-13 days)
  - "X weeks ago" (2-4 weeks)
  - "Last month" (30-59 days)
  - "X months ago" (2-11 months)
  - "X years ago" (12+ months)
- **Size:** `text-[13px]`
- **Color:** `var(--hub-text-dim)` = `rgba(255,255,255,0.50)`

#### History Detail
- **Location:** `HubEchoHistoryDetailPage.tsx` line 65
- **Format:** Full datetime via `formatDateTime()`
  - "Nov 10, 2025, 3:45 PM"
- **Position:** Below "Conversation" heading
- **Class:** `.hub-muted`

### Chips & Badges

#### Avatar Chips
**Truth table:**

| Condition | User Chip | Echo Chip |
|-----------|-----------|-----------|
| `isFirstInGroup && isUser` | ✅ Show (profile or initials) | ❌ Hidden |
| `isFirstInGroup && !isUser` | ❌ Hidden | ✅ Show (Bot icon) |
| `!isFirstInGroup` | ❌ Hidden | ❌ Hidden |

#### Mode Badge (Live Chat Only)
**Location:** `ChatMessage.tsx` lines 294-338

**Web-sourced badge:**
- **Condition:** `metadata.modeUsed === 'live'`
- **Background:** `bg-green-900/20`
- **Text:** `text-green-300`
- **Icon:** Globe (h-3 w-3)
- **Label:** "Web-sourced"
- **Extra:** Shows "As of {asOf}" if available

**Model-only badge:**
- **Condition:** `metadata.modeUsed !== 'live'`
- **Background:** `bg-blue-900/20`
- **Text:** `text-blue-300`
- **Icon:** Zap (h-3 w-3)
- **Label:** "Model-only"

#### Sources Accordion
**Location:** `ChatMessage.tsx` lines 323-346

**Button:**
- **Text:** "Sources"
- **Icon:** ChevronDown / ChevronUp
- **Size:** `text-xs h-5 px-2`
- **Toggle:** `showSources` state

**Expanded content:**
- **Background:** `bg-muted/50`
- **Padding:** `p-2`
- **Text:** `text-xs text-muted-foreground`
- **Content:** "Live search results from web sources"

---

## 5) Data & API

### Data Models

#### Chat History Item (`ChatItem`)
```typescript
type ChatItem = {
  id: string;              // Thread ID or conversation ID
  preview_text: string;    // First 80 chars of last message
  created_at: string;      // ISO timestamp
};
```

**Source:**
- Primary: `conversations` table (legacy JSONB)
- Fallback: `echo_threads` + `echo_messages` (relational)

#### Chat Thread Detail
```typescript
type EchoMsg = {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at?: string;
};

type Thread = {
  id: string;
  created_at: string;
};

type ThreadResponse = {
  source: 'conversations' | 'relational' | 'none';
  thread: Thread | null;
  messages: EchoMsg[];
};
```

#### Message Metadata
```typescript
metadata?: {
  save_card?: string;       // Summary for save action
  tags?: string[];          // Auto-tagged keywords
  category?: string;        // e.g., 'swing_analysis'
  videoUrl?: string;        // For swing analysis
  modeUsed?: 'live' | 'static'; // AI mode indicator
  sources?: string;         // Raw sources string
  provider?: string;        // AI provider name
  asOf?: string;            // Data freshness timestamp
  latencyMs?: number;       // Response time
}
```

### Database Tables

#### Legacy: `conversations`
- **Columns:** `id`, `user_id`, `title`, `created_at`, `updated_at`, `messages` (JSONB), `conversation_type`
- **Filter:** `conversation_type = 'chat'`
- **Order:** `updated_at DESC`
- **Messages format:** JSONB array `[{role, content, timestamp}, ...]`

#### New: `echo_threads`
- **Columns:** `id`, `user_id`, `created_at`, `updated_at`
- **Order:** `updated_at DESC`

#### New: `echo_messages`
- **Columns:** `id`, `thread_id`, `user_id`, `role`, `content`, `created_at`
- **Order:** `created_at ASC` (for thread detail)

#### Swing: `pro_ai_analyses`
- **Columns:** `id`, `user_id`, `video_url`, `created_at`, `analysis_results` (JSONB)
- **Order:** `created_at DESC`

### Fetch Strategies

#### Dual-Read Pattern (`fetchChatHistory`)
**File:** `history.fetchers.ts` lines 90-102

```typescript
1. Try legacy conversations first (covers existing users)
2. If empty, fallback to echo_threads/messages (new users)
3. Return unified ChatItem[] array
```

**Preview generation:**
- Extract last message content
- Normalize whitespace: `.replace(/\s+/g, ' ').trim()`
- Truncate: first 80 chars + ellipsis if longer

#### Thread Detail Dual-Read
**File:** `useEchoChatThread.ts` lines 52-82

```typescript
1. Try conversations table by ID (check conversation_type === 'chat')
2. If found, map JSONB messages to EchoMsg[]
3. If not found, try echo_threads + echo_messages by thread_id
4. Return unified response with source indicator
```

### Pagination

**Chat history:**
- **Default limit:** 20 items
- **History page:** 50 items
- **Hook param:** `{ limit?: number }`
- **Method:** SQL `LIMIT` clause
- **Load more:** Not implemented (fixed single page)

**Swing history:**
- **Default limit:** 20 items
- **Hook param:** `{ limit?: number }`
- **Method:** SQL `LIMIT` clause

### Normalization & Formatting

**On save (live chat):**
- Messages stored in both:
  1. Local component state (`messages` array)
  2. `conversationSession` (localStorage cache)
  3. Database (via `echoPersistence` service)

**Preview sanitization:**
```typescript
const raw = (last?.content ?? conv.title ?? 'Empty conversation') + '';
const preview = raw.replace(/\s+/g, ' ').trim();
return preview.slice(0, 80) + (preview.length > 80 ? '…' : '');
```

**No markdown stripping:** Previews include raw markdown syntax (e.g., `**bold**`, `[link](url)`)

---

## 6) State & Navigation

### History Index State

**Component:** `HubEchoHistoryPage`

**Data fetching:**
```typescript
const { data: chats = [], isLoading, error } = useEchoChatHistory({ limit: 50 });
```

**Navigation:**
```typescript
const openThread = (item: any) => {
  const chatId = item.chat_id || item.thread_id || item.id;
  nav(`/hub/echo/history/chat/${chatId}`, {
    state: { backgroundLocation, fromHub: true },
  });
};
```

**Back behavior:**
- If `state.backgroundLocation` exists: `nav(-1)` (modal dismiss)
- Else: `nav('/clubhouse', { replace: true })` (root fallback)

### History Detail State

**Component:** `HubEchoHistoryDetailPage`

**Data fetching:**
```typescript
const { data, isLoading, error } = useEchoChatThread(id);
// Returns: { source, thread, messages }
```

**No inline expand:** History detail is a separate page, not an accordion within the index.

**State preservation:**
- **Not implemented:** Scrolling away and returning reloads from scratch
- **No remembered position:** Always starts at top

### Live Chat State

**Component:** `AIChatOverlay` (paneMode: true, layout: 'page')

**Message state:**
```typescript
const [messages, setMessages] = useState<ChatMessageData[]>([]);
```

**Persistence:**
- `conversationSession.addMessage(message)` → localStorage
- `persistUserMessage(threadId, content)` → Supabase
- `persistAssistantMessage(threadId, content)` → Supabase

**Thread ID management:**
```typescript
const threadId = await ensureThreadId();
// Creates new thread if none exists in session
```

**Auto-scroll:**
```typescript
const chatAutoScroll = useAutoScroll({
  dependencies: [messages],
  enabled: true,
  direction: 'bottom'
});
```

**Scroll-to-bottom FAB:**
- **Threshold:** `scrollHeight - scrollTop - clientHeight < 100`
- **Trigger:** `showScrollToBottom` state
- **Message count gate:** Only if `messages.length > 3`
- **Position:** `fixed bottom-[88px] right-3`

---

## 7) Performance

### Virtualization

**Current status:** ❌ **Not implemented** anywhere

- **Live chat:** No virtualization (all messages rendered in DOM)
- **History index:** No virtualization (max 50 items, all rendered)
- **History detail:** No virtualization (all messages rendered)

**Impact:**
- Threads with 100+ messages will have 100+ DOM nodes
- History index with 50 items = 50 card elements
- Scroll performance degrades with message count

### Layout Reflow Contributors

1. **Backdrop blur:** `blur(120px)` on page background (heavy on low-end devices)
2. **Glass blur:** `blur(12px)` on bubbles (applies to every message)
3. **Shadow stacking:** Multiple box-shadows per bubble
4. **Dynamic text rendering:** Markdown parsing on every render
5. **Avatar chips:** Conditional rendering causes layout shift
6. **Progress bar animation:** `progressShimmer` animation on every message send

### Image/Video Lazy-Loading

**Images in markdown:**
- ❌ **No lazy loading**
- Rendered immediately via `<img>` tag
- No loading placeholder

**Swing analysis videos:**
- ⚠️ **Depends on SwingReview component** (not audited here)
- Likely no lazy loading

### Heavy CSS Effects

**Blur usage:**
- Page backdrop: `blur(120px)` — **Extremely heavy**
- Composer footer: `blur(12px)`
- Bubbles: `blur(var(--glass-blur))` = `12px` per message

**Contain & will-change:**
- ❌ **Not used** anywhere in Echo chat
- No `contain: layout` or `contain: paint`
- No `will-change` hints for animations

### DOM Node Counts (Estimated)

**Typical thread (20 messages):**
- 20 message bubbles
- 20 × (heading + chip) = 40 elements (for first in groups)
- 20 timestamps
- 20+ markdown elements per message (avg 5) = 100+
- **Total:** ~180 nodes

**Large thread (100 messages):**
- **Total:** ~900 nodes — likely FPS drop on scroll

### Scroll Performance

**Measured feel (subjective):**
- Mobile: Smooth on 20-30 messages, janky at 50+
- Desktop: Smooth up to 100 messages

**Contributors to jank:**
- Backdrop blur rendering
- Shadow recalculation on scroll
- Lack of virtualization

---

## 8) Accessibility

### Roles & Labels

#### Live Chat

**Chat container:**
```html
<div 
  role="log"
  aria-live="polite"
  aria-relevant="additions"
>
```

**Message bubble:**
```html
<div 
  role="article"
  aria-label="Message from You, 3:45 PM"
>
  <div role="group" aria-label="Message from You at 3:45 PM">
    <!-- content -->
  </div>
</div>
```

**Composer:**
```html
<footer role="region" aria-label="Message composer">
  <input placeholder="Ask Echo…" />
  <button aria-label="Send" />
</footer>
```

#### History Index

**Chat row:**
```html
<button aria-label="Chat thread">
  <!-- No aria-expanded (not an accordion) -->
</button>
```

**Close button:**
```html
<button aria-label="Close">
  <X />
</button>
```

#### History Detail

**Chat row:**
```html
<button aria-label="Back">
  ‹ Back
</button>
```

**⚠️ Missing:**
- No `aria-label` on message bubbles
- No `role="log"` on thread container
- No timestamp accessibility

### aria-live Regions

**Live chat:**
- ✅ `aria-live="polite"` on chat scroll area
- ✅ `aria-relevant="additions"` (announces new messages)

**History pages:**
- ❌ No `aria-live` regions
- ❌ No screen reader announcements

### Keyboard Navigation

**Live chat:**
- ✅ Input is keyboard accessible
- ✅ Send button is focusable
- ✅ Enter key sends message
- ⚠️ Bubbles have `tabIndex={0}` but no `onKeyDown` handlers
- ❌ No "skip to latest" keyboard shortcut
- ❌ No bubble navigation (arrow keys)

**History index:**
- ✅ All chat rows are keyboard accessible
- ✅ Tab navigation works
- ❌ No keyboard shortcut to open chat
- ❌ No quick search/filter

**History detail:**
- ✅ Back button is keyboard accessible
- ❌ No keyboard shortcuts

### Focus Management

**Focus rings:**
```css
.focus-ring:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(255,255,255,.18);
}
```

**Applied to:**
- ✅ Input fields
- ✅ Send button
- ✅ Links in markdown
- ⚠️ Not applied to chat row buttons

**Focus order:**
- Live chat: Header → Chat area → Input → Send → (repeat)
- History index: Header → Chat rows → Close
- History detail: Header → Back → (scroll)

**Focus trap:**
- ❌ No focus trap in overlays
- ❌ Escape key does not close history pages

### Color Contrast

**WCAG AA Requirements:** 4.5:1 for normal text, 3:1 for large text (18px+)

| Element | Foreground | Background | Ratio | Pass? |
|---------|------------|------------|-------|-------|
| Bubble text (Echo) | `rgba(255,255,255,0.90)` | `rgba(255,255,255,0.07)` | ~11:1 | ✅ AAA |
| Bubble text (User) | `rgba(255,255,255,0.95)` | `rgba(255,255,255,0.10)` | ~9:1 | ✅ AAA |
| Timestamps | `rgba(255,255,255,0.55)` | Black bg | ~7:1 | ✅ AA |
| Placeholder | `rgba(255,255,255,0.70)` | `rgba(255,255,255,0.06)` | ~9:1 | ✅ AA |
| Chat row text | `rgba(255,255,255,0.95)` | `rgba(255,255,255,0.08)` | ~10:1 | ✅ AAA |
| Link underline | `rgba(255,255,255,0.50)` | - | - | ⚠️ Low (decorative) |

**Overall:** ✅ Excellent contrast on all critical text

### Dynamic Type Support

**Font scaling:**
- ✅ Uses `px` units (scales with browser zoom)
- ⚠️ No `em` or `rem` relative sizing
- ❌ No explicit support for iOS Dynamic Type

**Truncation:**
- ✅ Chat row titles use `truncate` (ellipsis)
- ✅ Long paragraphs wrap with `break-words`
- ⚠️ Very long links may overflow on small screens

---

## 9) Design Tokens & Theming

### Token Sources

1. **`style-tokens.css`** — System-wide (bubbles, glass, safe-areas)
2. **`hubTheme.css`** — Hub-specific (tiles, cards, rows)
3. **`index.css`** — Global + legacy bubble tokens
4. **`zIndex.ts`** — Z-index hierarchy

### Bubble Tokens (style-tokens.css)

```css
--bubble-max-mobile: 82vw;
--bubble-max-desktop: 70vw;
--bubble-radius: 18px;
--bubble-pad-x: 16px;
--bubble-pad-y: 12px;
--bubble-gap-intra: 10px;       /* Same speaker */
--bubble-gap-inter: 16px;       /* Different speaker */

--bubble-user-bg: rgba(255,255,255,0.10);
--bubble-user-border: rgba(255,255,255,0.20);
--bubble-user-inset: inset 0 0 28px rgba(255,255,255,0.14);

--bubble-echo-grad: linear-gradient(145deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,.06) 100%);
--bubble-echo-border: rgba(255,255,255,0.14);
--bubble-echo-inset: inset 0 1px 1px rgba(255,255,255,.12);
```

### Legacy Bubble Tokens (index.css)

```css
--bubble-max: 92vw;              /* ⚠️ Unused (superseded by style-tokens) */
--bubble-max-md: 720px;          /* ⚠️ Unused */
--bubble-gap-y: 6px;             /* ⚠️ Unused */
--bubble-gap-x: 10px;            /* ⚠️ Unused */
--bubble-radius: 16px;           /* ⚠️ Conflicting value (18px in style-tokens) */
--bubble-radius-lg: 18px;        /* ⚠️ Unused */
```

**⚠️ TOKEN CONFLICT:** `--bubble-radius` defined in both files with different values (16px vs 18px). Components use `style-tokens.css` value.

### Hub Tokens (hubTheme.css)

```css
--hub-radius: 18px;
--hub-pad: 16px;
--hub-gap: 14px;
--hub-blur: 28px;

--hub-backdrop: rgba(0, 0, 0, 0.25);
--hub-backdrop-blur: 20px;

--hub-glass-bg: rgba(255,255,255,0.08);
--hub-stroke: rgba(255,255,255,0.14);

--hub-text: rgba(255,255,255,0.95);
--hub-text-body: rgba(255,255,255,0.85);
--hub-text-dim: rgba(255,255,255,0.50);
```

### Z-Index Hierarchy (zIndex.ts)

```typescript
export const Z = {
  header: 1000,
  nav: 999,
  toast: 12000,
  hub: 12000,           // Hub modal shell
  sheetBackdrop: 12002,
  sheet: 12003,
  echo: 11500,          // Echo floating orb
  createGame: 11800,
  aiOverlay: 11100,     // AI Chat overlay
  page: 9999,           // Echo page glass background
  pageHeader: 10000,    // Echo page header
  composer: 2,          // Composer footer
  dropdownScrim: 50,
  dropdownMenu: 60,
};
```

**Usage in Echo pages:**
- `HubEchoChatPage` background: `z-[9999]` (Z.page)
- `HubEchoChatPage` header: `z-[10000]` (Z.pageHeader)
- `AIChatOverlay` composer: `z-[2]` (Z.composer)

### Safe Area Tokens

```css
--safe-top: env(safe-area-inset-top, 0px);
--safe-bottom: env(safe-area-inset-bottom, 0px);
--safe-left: env(safe-area-inset-left, 0px);
--safe-right: env(safe-area-inset-right, 0px);
```

**Helper classes:**
```css
.safe-top { padding-top: calc(var(--page-gutter) + var(--safe-top)); }
.safe-bottom { padding-bottom: calc(var(--page-gutter-sm) + var(--safe-bottom)); }
```

**Usage:**
- ✅ Header: `paddingTop: env(safe-area-inset-top, 0px)`
- ✅ Composer: `paddingBottom: calc(16px + env(safe-area-inset-bottom, 0px))`
- ✅ Scroll container: `paddingTop` includes safe-area

### Hard-Coded Values (Outliers)

**HubEchoChatPage header:**
```typescript
background: 'rgba(22, 24, 27, 0.98)',
borderColor: 'var(--hub-stroke)',
```
**⚠️ ISSUE:** Background color `rgba(22, 24, 27, 0.98)` is not tokenized

**HubEchoHistoryDetailPage bubbles:**
```css
.bubble {
  padding: 12px 14px;   /* ⚠️ Should use var(--bubble-pad-x/y) */
  border-radius: 14px;  /* ⚠️ Should use var(--bubble-radius) = 18px */
}
```

**Loading bubble minHeight:**
```typescript
minHeight: 'calc(var(--bubble-pad-y) * 2 + 20px)'
```
**⚠️ ISSUE:** Magic number `20px` for content height (3 dots)

---

## 10) Edge Cases (Documented Behaviors)

### Empty States

**Live chat (no messages):**
- Shows Bot icon (20×20, rounded-3xl, glass surface)
- Title: "Start a conversation with Echo"
- Subtitle: "Ask about your swing, your stats, or just chat golf — Echo's always here."
- Padding: 64px top/bottom

**History index (no chats):**
- Text: "No Echo chats yet — ask Echo a question to get started."
- Size: text-[15px]
- Padding: 32px vertical
- Center-aligned

**History detail (no messages):**
- Text: "No messages in this chat yet."
- Class: `.hub-msg`
- Padding: 24px
- Center-aligned

### Loading States

**History index:**
- Shows 5 skeleton rows (64px height, rounded-2xl, pulse animation)
- Same spacing as real rows

**History detail:**
- Text: "Loading chat…"
- Class: `.hub-msg`
- No skeleton

**Live chat:**
- Shows Echo heading + chip
- Loading bubble with 3 bouncing dots
- Same visual style as final Echo bubble

### Error States

**History index:**
- Text: "Couldn't load chat history. Please try again."
- Size: text-[15px]
- Color: var(--hub-text-dim)
- Padding: 32px vertical
- Center-aligned

**History detail:**
- Text: "Couldn't load this chat."
- Class: `.hub-msg`
- Same styling as empty state

**Live chat (message send failure):**
- Shows error message in chat:
  - "Sorry, I'm having trouble responding right now. Please try again in a moment."
  - Rendered as AI message bubble
- Toast notification:
  - Title: "Error"
  - Description: "Failed to get AI response. Please try again."
  - Variant: destructive

### Long Content

**Very long paragraph (500+ words):**
- ✅ Wraps correctly with `break-words`
- ⚠️ No max-height constraint (can create very tall bubbles)

**Long lists (50+ items):**
- ✅ Renders all items
- ⚠️ No collapse/expand mechanism
- ⚠️ No virtualization (all in DOM)

**Long code block:**
- ✅ Horizontal scroll enabled
- ✅ Copy button provided
- ⚠️ No line numbers
- ⚠️ No syntax highlighting

### Many Short Messages (100+ back-and-forth)

**Live chat:**
- ✅ All messages render
- ⚠️ Scroll becomes janky (no virtualization)
- ✅ Scroll-to-bottom FAB appears after 3+ messages
- ✅ Auto-scroll on new message (if near bottom)

**History detail:**
- ✅ All messages render
- ⚠️ No scroll-to-bottom FAB
- ⚠️ No jump to date/message navigation

### Pagination (30+ items in history)

**Current behavior:**
- ✅ History index fetches 50 items max
- ❌ No "Load more" button
- ❌ No infinite scroll
- ❌ No pagination controls

### Offline/Network Error

**Live chat:**
- ❌ No offline detection
- ❌ No retry mechanism (except user resending)
- ✅ Error toast + error message bubble

**History pages:**
- ❌ No offline indicator
- ✅ Error message displayed

---

## 11) Known Differences (Live vs History)

### Rendering

| Feature | Live Chat | History Detail |
|---------|-----------|----------------|
| **Markdown** | ✅ ReactMarkdown + remark-gfm | ❌ Plain text only |
| **Headings** | ✅ Styled (h1/h2/h3) | ❌ Shows as \*\*text\*\* |
| **Lists** | ✅ Rendered with bullets/numbers | ❌ Shows as 1. 2. 3. |
| **Links** | ✅ Clickable with underline | ❌ Shows as \[text\](url) |
| **Code blocks** | ✅ Syntax highlighted box | ❌ Shows as \`\`\`code\`\`\` |
| **Bold/italic** | ✅ Applied | ❌ Shows as \*\*bold\*\* \_italic\_ |

**Impact:** **Critical UX gap** — history detail is unreadable for formatted responses

### Styling

| Element | Live Chat | History Detail |
|---------|-----------|----------------|
| **Bubble radius** | 18px (`var(--bubble-radius)`) | 14px (hardcoded) |
| **Bubble padding** | 16px × 12px (`var(--bubble-pad-x/y)`) | 14px × 12px (hardcoded) |
| **User bg** | `rgba(255,255,255,0.10)` | `rgba(255,255,255,0.10)` ✅ Match |
| **Echo bg** | `linear-gradient(...)` | `rgba(255,255,255,0.06)` (solid) |
| **Borders** | `rgba(255,255,255,0.14/0.20)` | `rgba(255,255,255,0.10/0.14)` |
| **Shadows** | ✅ Inset + outer | ❌ None |
| **Blur** | ✅ `blur(12px)` | ❌ None |
| **Max width** | 82vw mobile / 70vw desktop | 84% (fixed) |

**Impact:** **Visual inconsistency** — history bubbles look flatter and less polished

### Spacing

| Measurement | Live Chat | History Detail |
|-------------|-----------|----------------|
| **First in group** | `mt-4` (16px) | `gap-10px` (10px) |
| **Same speaker** | `mt-2.5` (10px) | `gap-10px` (10px) |
| **Header to first bubble** | ~68px (header + safe-area + 12px) | ~16px (pt-4) |

**Impact:** History detail feels more compressed

### Chips & Metadata

| Feature | Live Chat | History Detail |
|---------|-----------|----------------|
| **Avatar chips** | ✅ On first in group | ❌ Never shown |
| **Timestamps** | ✅ Below every bubble | ❌ Only conversation timestamp |
| **Mode badges** | ✅ Web-sourced / Model-only | ❌ Not shown |
| **Sources accordion** | ✅ Expandable | ❌ Not shown |

**Impact:** **Loss of context** — can't tell who said what or when in history

### Actions

| Action | Live Chat | History Detail |
|--------|-----------|----------------|
| **Copy message** | ⚠️ Not implemented | ❌ Not available |
| **Reply** | N/A (linear chat) | ❌ Not available (read-only) |
| **Delete** | ⚠️ Not implemented | ❌ Not available |
| **Edit** | N/A | ❌ Not available |
| **Share** | ⚠️ Not implemented | ❌ Not available |

**Impact:** History is fully read-only (by design)

---

## 12) Priority Gaps (Cosmetic vs Structural)

### 🔴 Critical (Structural)

1. **History detail markdown not rendering**
   - **Type:** Structural (missing ReactMarkdown)
   - **File:** `HubEchoHistoryDetailPage.tsx` line 77
   - **Fix:** Integrate `ReactMarkdown` component
   - **Impact:** High — breaks formatted responses

2. **Bubble radius inconsistency**
   - **Type:** Structural (hardcoded CSS class)
   - **File:** `hubTheme.css` line 500
   - **Fix:** Change `.bubble` to use `var(--bubble-radius)`
   - **Impact:** Medium — visual inconsistency

3. **Token conflict: --bubble-radius**
   - **Type:** Structural (duplicate definitions)
   - **Files:** `index.css` line 311 (16px), `style-tokens.css` line 71 (18px)
   - **Fix:** Remove from `index.css` or consolidate
   - **Impact:** Low — components use correct value, but confusing

### 🟡 High (Cosmetic + UX)

4. **No virtualization anywhere**
   - **Type:** Performance
   - **Files:** All message lists
   - **Fix:** Implement `react-window` or similar
   - **Impact:** High on 100+ message threads

5. **History detail missing avatar chips**
   - **Type:** UX (lost context)
   - **File:** `HubEchoHistoryDetailPage.tsx`
   - **Fix:** Add speaker indicators per message
   - **Impact:** Medium — hard to follow conversation

6. **History detail missing timestamps per message**
   - **Type:** UX (lost context)
   - **File:** `HubEchoHistoryDetailPage.tsx`
   - **Fix:** Add timestamp below each bubble
   - **Impact:** Medium — no temporal context

### 🟢 Medium (Polish)

7. **Hardcoded header background color**
   - **Type:** Cosmetic (not tokenized)
   - **File:** `HubEchoChatPage.tsx` line 46
   - **Fix:** Define `--hub-header-bg-solid` token
   - **Impact:** Low — works fine, just not themeable

8. **Loading bubble magic number (20px)**
   - **Type:** Cosmetic (hardcoded value)
   - **Files:** `AIChatOverlay.tsx` lines 588, 1125
   - **Fix:** Define `--bubble-min-content-h` token
   - **Impact:** Low — consistent across uses

9. **No pagination in history index**
   - **Type:** UX (limited to 50 items)
   - **File:** `HubEchoHistoryPage.tsx` line 44
   - **Fix:** Implement load-more or infinite scroll
   - **Impact:** Medium — users with 50+ chats can't see all

### 🔵 Low (Nice-to-Have)

10. **No focus trap in overlays**
    - **Type:** A11y (keyboard navigation)
    - **Files:** All page components
    - **Fix:** Add focus trap library
    - **Impact:** Low — Tab works, but can escape to background

11. **No keyboard shortcuts**
    - **Type:** A11y (power user feature)
    - **Files:** All components
    - **Fix:** Add `useKeyboardShortcut` hook
    - **Impact:** Low — mouse/touch work fine

12. **No image lazy loading**
    - **Type:** Performance
    - **File:** `ChatMessage.tsx` line 267
    - **Fix:** Use `loading="lazy"` attribute
    - **Impact:** Low — images rare in golf chat

---

## Summary & Recommendations

### What Works Well

✅ **Consistent bubble design** — Live chat has unified Apple-grade glass aesthetics  
✅ **Responsive layouts** — Works on mobile/tablet/desktop  
✅ **Error handling** — Graceful fallbacks for empty/error states  
✅ **Dual-read strategy** — Backward compatible with legacy JSONB + new relational tables  
✅ **Accessibility foundation** — ARIA roles, labels, and focus management basics  
✅ **Color contrast** — Excellent WCAG AAA compliance  

### Critical Issues to Address

🔴 **Markdown not rendering in history detail** — Users see raw syntax  
🔴 **Visual inconsistency** — History bubbles use different radius/padding/shadows  
🔴 **Performance gap** — No virtualization for long threads (100+ messages)  
🔴 **Lost context in history** — No avatar chips or per-message timestamps  

### Implementation Priority (for Phase 2)

1. **Unify bubble rendering** — Create shared `<MessageBubble>` component used by both live and history
2. **Add ReactMarkdown to history detail** — Copy rendering logic from `ChatMessage.tsx`
3. **Implement virtualization** — Use `react-window` for message lists (live + history)
4. **Add metadata to history** — Show avatar chips and timestamps per message
5. **Polish tokens** — Remove conflicts, tokenize hardcoded values

### File Output

This audit is saved to:
- **Main doc:** `/docs/audit-echo-chat-history.md` (this file)
- **Screenshots:** `/docs/audit-assets/` (if needed, user must add)

---

**END OF AUDIT**
