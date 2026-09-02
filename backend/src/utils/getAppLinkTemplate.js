/**
 * Uptula — "Get App Link" Invitation Email Template
 *
 * Smart redirect logic (via URL param):
 *   https://uptula.com/redirect?to=jobs
 *   — server reads User-Agent and sends:
 *       Mobile  → Play Store
 *       Desktop → uptula.com/jobs
 *
 * If you don't have a server-side redirect, keep the two
 * separate links (Play Store + website) that are already
 * in the template as a safe fallback.
 */

const { PUBLIC_API_URL } = require('../config/env');

const getAppLinkTemplate = (userEmail = "") => {
  const smartRedirectUrl = `${PUBLIC_API_URL}/redirect?to=jobs&ref=email`;

  const playStoreUrl =
    "https://play.google.com/store/apps/details?id=com.uptula";
  const websiteUrl = "https://uptula.com";
  const jobsUrl = "https://uptula.com/jobs";

  return `
<div style="background:#0f172a;padding:20px;font-family:Arial,sans-serif;">

  <div style="max-width:520px;margin:auto;background:#111827;padding:25px;border-radius:12px;color:white;">

    <!-- ── Logo ── -->
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
      <img src="https://uptula.com/logo.png" alt="Uptula Logo" style="height:40px;" />
      <span style="font-size:18px;font-weight:bold;">Uptula</span>
    </div>

    <!-- ── Heading ── -->
    <h2 style="margin:0 0 6px;color:#22c55e;font-size:22px;">
      📲 You Requested Your App Link!
    </h2>

    <!-- ── Sub-heading ── -->
    <p style="font-size:15px;margin:0 0 16px;color:#f9fafb;">
      Here's everything you need to get started with <strong>Uptula</strong> — 
      Odisha's trusted job portal.
    </p>

    <!-- ── Body ── -->
    <p style="color:#9ca3af;font-size:14px;line-height:1.7;margin:0 0 20px;">
      Whether you're on your phone or laptop, we've got you covered.
      Tap the link that works best for you 👇
    </p>

    <!-- ── Smart CTA (device-aware) ── -->
    <div style="background:#1e293b;border-radius:10px;padding:18px;margin-bottom:20px;">

      <p style="font-size:13px;color:#94a3b8;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.05em;">
        🔗 Your Invitation Link
      </p>

      <!-- Primary smart-redirect button -->
      <div style="text-align:center;margin-bottom:14px;">
        <a href="${smartRedirectUrl}"
           style="
             display:inline-block;
             padding:13px 28px;
             background:#22c55e;
             color:#ffffff;
             text-decoration:none;
             border-radius:8px;
             font-weight:bold;
             font-size:15px;
             letter-spacing:0.02em;
           ">
          🚀 Open Uptula — Explore Jobs
        </a>
        <p style="font-size:11px;color:#6b7280;margin:8px 0 0;">
          Opens the <strong style="color:#d1d5db;">App</strong> on mobile · 
          <strong style="color:#d1d5db;">Website</strong> on desktop
        </p>
      </div>

      <hr style="border:none;border-top:1px solid #374151;margin:16px 0;" />

      <!-- Explicit fallback links -->
      <p style="font-size:13px;color:#9ca3af;margin:0 0 10px;text-align:center;">
        Or open directly:
      </p>

      <div style="text-align:center;">

        <!-- Play Store -->
        <a href="${playStoreUrl}"
           target="_blank"
           style="
             display:inline-block;
             padding:9px 18px;
             margin:4px 8px;
             background:#1d4ed8;
             color:#fff;
             text-decoration:none;
             border-radius:6px;
             font-size:13px;
             font-weight:bold;
           ">
          📱 Download App
        </a>

        <!-- Website jobs page -->
        <a href="${jobsUrl}"
           target="_blank"
           style="
             display:inline-block;
             padding:9px 18px;
             margin:4px 8px;
             background:#374151;
             color:#fff;
             text-decoration:none;
             border-radius:6px;
             font-size:13px;
             font-weight:bold;
           ">
          💻 Browse Jobs Online
        </a>

      </div>
    </div>

    <!-- ── Why Uptula ── -->
    <p style="color:#d1d5db;font-size:13px;line-height:1.7;margin:0 0 20px;">
      ✅ Find jobs across <strong>Odisha</strong> and beyond<br/>
      ✅ Connect with top manpower consultancies in Bhubaneswar<br/>
      ✅ Get real-time alerts straight on your phone<br/>
      ✅ Apply in seconds — profile saved, always ready
    </p>

    <!-- ── Tip ── -->
    <p style="color:#d1d5db;font-size:13px;margin:0 0 20px;text-align:center;">
      💡 Complete your profile to get better job recommendations.
    </p>

    <hr style="border-color:#374151;margin:20px 0;" />

    <!-- ── App Store badges ── -->
    <p style="text-align:center;font-size:14px;color:#d1d5db;margin:0 0 12px;">
      Get real-time job updates on our App 🚀
    </p>

    <div style="text-align:center;margin-bottom:16px;">
      <a href="${playStoreUrl}" target="_blank">
        <img
          src="https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png"
          style="height:45px;margin:5px;"
          alt="Get it on Google Play"
        />
      </a>
      <a href="${websiteUrl}" target="_blank">
        <img
          src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
          style="height:45px;margin:5px;"
          alt="Download on the App Store"
        />
      </a>
    </div>

    <!-- ── QR Code ── -->
    <div style="text-align:center;margin-bottom:20px;">
      <img src="https://uptula.com/QRcode.png" alt="QR Code" style="height:120px;border-radius:8px;" />
      <p style="font-size:12px;color:#9ca3af;margin:6px 0 0;">Scan to download app</p>
    </div>

    <hr style="border-color:#374151;margin:20px 0;" />

    <!-- ── Footer ── -->
    <p style="font-size:12px;color:#6b7280;text-align:center;margin:0 0 10px;">
      Need help? Contact us at
      <a href="mailto:info@uptula.com" style="color:#22c55e;text-decoration:none;">
        info@uptula.com
      </a>
    </p>

    <p style="font-size:11px;color:#6b7280;text-align:center;margin:0;">
      © 2026 Uptula. All Rights Reserved.
    </p>

  </div>
</div>
  `.trim();
};

module.exports = getAppLinkTemplate;
