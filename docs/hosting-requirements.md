# Hosting Requirements for Chunk Load Error Prevention

## Critical CDN/Hosting Configuration

### 1. Cache Headers (REQUIRED)

#### index.html
```
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

#### Hashed Assets (/assets/*, /.vite/deps/*, /node_modules/.vite/deps/*)
```
Cache-Control: public, max-age=31536000, immutable
```

### 2. MIME Types (REQUIRED)

All JavaScript files must return:
```
Content-Type: text/javascript
```
or
```
Content-Type: application/javascript
```

### 3. No Rewrites for Asset Paths (CRITICAL)

**Never rewrite or redirect:**
- `/assets/*`
- `/.vite/deps/*`
- `/node_modules/.vite/deps/*`

These paths must always serve the actual files, not index.html.

### 4. Atomic Deploy Process

**Deploy order:**
1. Upload all new hashed assets to `/assets/*` and `/.vite/deps/*` first
2. Deploy `index.html` last (single atomic update)

This ensures the HTML always references chunks that are already live.

### 5. Cloudflare Specific Settings

#### Page Rules
```
URL Pattern: *clbhouz.co.uk/assets/*
Settings:
  - Cache Level: Standard
  - Edge Cache TTL: a year
  - Browser Cache TTL: a year

URL Pattern: *clbhouz.co.uk/.vite/*
Settings:
  - Cache Level: Standard
  - Edge Cache TTL: a year
  - Browser Cache TTL: a year

URL Pattern: *clbhouz.co.uk/
Settings:
  - Cache Level: Bypass
  - Browser Cache TTL: respect existing headers
```

#### After Each Deploy
```
Purge Cache → Purge Everything
```
or at minimum:
```
Purge by prefix:
  - /assets/
  - /.vite/
  - /node_modules/
```

## Verification Checklist

After deploy, verify:

1. **index.html headers**
   ```bash
   curl -I https://clbhouz.co.uk/
   # Should see: Cache-Control: no-cache, no-store
   ```

2. **Asset headers**
   ```bash
   curl -I https://clbhouz.co.uk/assets/index-[hash].js
   # Should see: Cache-Control: public, max-age=31536000, immutable
   # Should see: Content-Type: text/javascript
   ```

3. **No HTML rewrites**
   ```bash
   curl -I https://clbhouz.co.uk/assets/nonexistent.js
   # Should return 404, NOT 200 with HTML content
   ```

4. **App loads without errors**
   - Open DevTools Network tab
   - Check "Disable cache"
   - Hard refresh (Cmd+Shift+R / Ctrl+Shift+F5)
   - All chunks should return 200 with JS content

## Current Protection

The app now has runtime protection that:
- Detects chunk load failures
- Unregisters any service workers
- Clears all caches
- Reloads with cache-buster URL
- Shows friendly error after 3 failed attempts

This prevents permanent blank screens, but proper hosting config prevents the issue entirely.
