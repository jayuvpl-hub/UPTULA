const registrationSuccessTemplate = (userName) => {
  return `
  <div style="background:#0f172a;padding:20px;font-family:Arial,sans-serif;">
    
    <div style="max-width:520px;margin:auto;background:#111827;padding:25px;border-radius:12px;color:white;">
      
      <!-- Logo -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <img src="https://uptula.com/logo.png" alt="Logo" style="height:40px;" />
        <span style="font-size:18px;font-weight:bold;">Uptula</span>
      </div>

      <!-- Greeting -->
      <p style="font-size:16px;margin-bottom:10px;">
        Hi <strong>${userName || "User"}</strong>,
      </p>

      <!-- Heading -->
      <h2 style="margin:0 0 10px;color:#22c55e;">
        🎉 Registration Successful!
      </h2>

      <!-- Message -->
      <p style="color:#9ca3af;font-size:14px;line-height:1.6;">
        Welcome to Uptula Job Portal. Your account has been verified successfully.
        <br/><br/>
        You can now start exploring job opportunities and apply with ease.
      </p>

      <!-- CTA Button -->
      <div style="text-align:center;">
        <a href="https://uptula.com" style="
          display:inline-block;
          margin-top:20px;
          padding:12px 20px;
          background:#22c55e;
          color:white;
          text-decoration:none;
          border-radius:6px;
          font-weight:bold;
        ">
          Explore Jobs
        </a>
      </div>

      <!-- Extra Tip -->
      <p style="color:#d1d5db;font-size:13px;margin-top:20px;text-align:center;">
        💡 Complete your profile to get better job recommendations.
      </p>

      <hr style="border-color:#374151;margin:25px 0;" />

      <!-- App Section -->
      <p style="text-align:center;font-size:14px;color:#d1d5db;">
        Get real-time job updates on our App 🚀
      </p>

      <div style="text-align:center;margin:15px 0;">
        <a href="https://play.google.com/store/apps/details?id=com.uptula" target="_blank">
          <img 
            src="https://play.google.com/intl/en_us/badges/images/generic/en_badge_web_generic.png"
            style="height:45px;margin:5px;"
            alt="Get it on Google Play"
          />
        </a>

        <a href="https://uptula.com">
          <img 
            src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg"
            style="height:45px;margin:5px;"
            alt="Download on the App Store"
          />
        </a>
      </div>

      <!-- QR Code -->
      <div style="text-align:center;margin-top:10px;">
        <img src="https://uptula.com/QRcode.png" alt="QR Code" style="height:120px;border-radius:8px;" />
        <p style="font-size:12px;color:#9ca3af;">Scan to download app</p>
      </div>

      <hr style="border-color:#374151;margin:25px 0;" />

      <!-- Footer -->
      <p style="font-size:12px;color:#6b7280;text-align:center;">
        Need help? Contact us at 
        <a href="mailto:info@uptula.com" style="color:#22c55e;text-decoration:none;">
          info@uptula.com
        </a>
      </p>

      <p style="font-size:11px;color:#6b7280;text-align:center;margin-top:15px;">
        © 2026 Uptula. All Rights Reserved.
      </p>

    </div>
  </div>
  `;
};

module.exports = registrationSuccessTemplate;