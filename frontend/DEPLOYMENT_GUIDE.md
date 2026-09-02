# Uptula Job Portal - Frontend Deployment Guide

## ✅ What's Included

This is a production-ready React frontend for Uptula Job Portal with the following configurations:

### 1. **API Configuration**
- All API endpoints are configured to use: `https://uptula.com`
- The configuration is set in `.env.production` and `src/config/api.js`
- No localhost references remain in the production build

### 2. **.htaccess File**
The `.htaccess` file includes:
- **URL Rewriting**: Enables React Router to work properly by rewriting all requests to `index.html`
- **HTTPS Enforcement**: Forces all traffic to HTTPS
- **WWW Enforcement**: Ensures consistent URL structure
- **Gzip Compression**: Compresses CSS, JS, and HTML for faster loading
- **Browser Caching**: 
  - Static assets (CSS, JS, fonts, images) cached for 1 year
  - HTML cached for 0 seconds (always fresh)
- **Security Headers**:
  - X-Content-Type-Options
  - X-Frame-Options
  - X-XSS-Protection
  - Content-Security-Policy
  - Referrer-Policy
- **Directory Protection**: Hides directory listings and blocks access to hidden files

### 3. **Build Output**
The `/build` folder contains:
- `index.html` - Main entry point
- `static/` - Optimized CSS and JavaScript bundles
- `assets/` - Images, videos, plugins, and other media
- `manifest.json` - PWA configuration
- `robots.txt` - SEO configuration
- `.htaccess` - Server configuration

## 🚀 Deployment Instructions

### 1. **Upload Files to Server**
```bash
# Upload the entire contents of the /build folder to your web server's public root
# Example: /public_html/ or /www/ (depends on your hosting provider)

# Ensure you upload:
- All files and folders from /build/
- The .htaccess file (usually hidden, make sure your FTP client shows hidden files)
```

### 2. **Server Requirements**
- Apache 2.4+ with mod_rewrite enabled
- PHP support (if needed for backend integration)
- SSL Certificate (HTTPS) - Required for security headers
- mod_deflate enabled (for gzip compression)
- mod_expires enabled (for cache control)
- mod_headers enabled (for security headers)

### 3. **Verify Deployment**
```bash
# Check that the site is accessible
curl https://uptula.com

# Verify .htaccess is working by testing:
# - Direct URL access: https://uptula.com
# - Route testing: https://uptula.com/jobs (should load index.html)
# - HTTPS redirect: http://uptula.com (should redirect to https)
```

### 4. **Environment Variables**
The production build uses:
- `REACT_APP_API_URL=https://uptula.com`
- `REACT_APP_CRM_API_SECRET=UPTULA_CRM_SECRET_KEY_2024`

These are baked into the build during `npm run build`.

## 📋 File Structure

```
build/
├── .htaccess              ← Server configuration (critical!)
├── index.html             ← Entry point
├── manifest.json          ← PWA manifest
├── robots.txt             ← SEO configuration
├── assets/
│   ├── css/               ← Stylesheets
│   ├── img/               ← Images
│   ├── js/                ← JavaScript files
│   ├── plugins/           ← Third-party plugins
│   └── video/             ← Video files
└── static/
    ├── css/               ← Minified CSS bundles
    ├── js/                ← Minified JS bundles
    └── media/             ← Optimized media
```

## 🔐 Security Configuration

The `.htaccess` file includes comprehensive security headers:

```
- X-Content-Type-Options: nosniff (prevents MIME type sniffing)
- X-Frame-Options: SAMEORIGIN (prevents clickjacking)
- X-XSS-Protection: 1; mode=block (XSS protection)
- Referrer-Policy: strict-origin-when-cross-origin (referrer control)
- Content-Security-Policy: Strict policy for resource loading
```

## ⚡ Performance Optimization

### Caching Strategy
- **Static Assets** (CSS, JS, fonts, images): 1 year cache
- **HTML**: No cache (always fresh)
- **Default**: 2 days cache

### Compression
- Gzip compression enabled for all text-based content
- Reduces file sizes by ~60-70%

## 🐛 Troubleshooting

### Issue: Routes not working (404 errors)
**Solution**: Ensure `mod_rewrite` is enabled and `.htaccess` is properly uploaded.

```bash
# In .htaccess, ensure:
RewriteEngine On
RewriteBase /
RewriteRule ^ index.html [QSA,L]
```

### Issue: CSS/JS not loading
**Solution**: Check permissions and ensure proper MIME types are set.

### Issue: HTTPS not enforcing
**Solution**: Verify SSL certificate is installed and `.htaccess` rules are correct.

### Issue: CORS errors connecting to API
**Solution**: Ensure your backend (https://uptula.com API) has proper CORS headers configured.

## 📞 Support

For issues or questions:
1. Check that all files were uploaded correctly
2. Verify server has required Apache modules enabled
3. Test using browser DevTools to see actual errors
4. Check server error logs

## ✨ Next Steps

1. Upload all files from `/build` folder to your server
2. Upload `.htaccess` file (make sure hidden files are copied)
3. Test all routes and API connections
4. Monitor performance and error logs
5. Set up regular backups

---

**Build Date**: 2026-06-05
**Frontend Version**: 0.1.0
**Node Version Used**: (check your local node version)
**React Version**: 19.2.0

