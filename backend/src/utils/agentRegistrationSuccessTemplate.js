/**
 * Welcome email for CRM/agent-registered seekers.
 * Do not put the password (or any secret) in this template.
 */
const agentRegistrationSuccessTemplate = (userName) => {
  return `
  <div style="background:#0f172a;padding:20px;font-family:Arial,sans-serif;">
    
    <div style="max-width:520px;margin:auto;background:#111827;padding:25px;border-radius:12px;color:white;">
      
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <img src="https://uptula.com/logo.png" alt="Logo" style="height:40px;" />
        <span style="font-size:18px;font-weight:bold;">Uptula</span>
      </div>

      <p style="font-size:16px;margin-bottom:10px;">
        Hi <strong>${userName || "User"}</strong>,
      </p>

      <h2 style="margin:0 0 10px;color:#22c55e;">
        Your Uptula account is ready
      </h2>

      <p style="color:#9ca3af;font-size:14px;line-height:1.6;">
        An Uptula agent registered you on uptula.com.
        <br/><br/>
        If you did not expect this, reset your password using Forgot Password.
        <br/><br/>
        You can then sign in and complete your profile to explore jobs.
      </p>

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

      <hr style="border-color:#374151;margin:25px 0;" />

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

module.exports = agentRegistrationSuccessTemplate;
