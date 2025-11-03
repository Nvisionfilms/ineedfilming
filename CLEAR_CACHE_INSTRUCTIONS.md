# Clear Cache Instructions

## Netlify CDN Cache

1. Go to: https://app.netlify.com/sites/nvisionfunnel/deploys
2. Click **Trigger deploy** dropdown
3. Select **Clear cache and deploy site**
4. Wait 2-3 minutes for deployment

## GoDaddy DNS Cache

GoDaddy caches DNS records. To force refresh:

1. Go to: https://www.godaddy.com/help/flush-dns-cache-680
2. Or wait 24-48 hours for natural cache expiration

## Browser Cache

**Hard Refresh:**
- Windows: `Ctrl + Shift + R` or `Ctrl + F5`
- Mac: `Cmd + Shift + R`

**Or Clear Browser Cache:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"

## Cloudflare (if using)

If you have Cloudflare in front of GoDaddy:
1. Go to Cloudflare dashboard
2. Click "Caching"
3. Click "Purge Everything"

## Force Immediate Update

Add a cache-busting query parameter:
- Try: `https://ineedfilming.com/?v=2024`
- This bypasses cache

## Check What's Actually Deployed

View source on the live site:
1. Go to https://ineedfilming.com
2. Right-click → "View Page Source"
3. Look for the CSS colors in the `<style>` tags
4. Should see `--primary: 45 100% 55%` (gold) not `--primary: 15 90% 60%` (coral)
