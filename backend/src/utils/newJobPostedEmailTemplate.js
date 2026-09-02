const newJobPostedEmailTemplate = ({
  userName,
  jobTitle,
  companyName,
  location = '',
  jobsUrl = 'https://uptula.com/jobs'
}) => {
  const locationLine = location
    ? `<p style="color:#9ca3af;font-size:14px;margin:8px 0 0;"><strong>Location:</strong> ${location}</p>`
    : '';

  return `
  <div style="background:#0f172a;padding:20px;font-family:Arial,sans-serif;">
    <div style="max-width:520px;margin:auto;background:#111827;padding:25px;border-radius:12px;color:white;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;">
        <img src="https://uptula.com/logo.png" alt="Logo" style="height:40px;" />
        <span style="font-size:18px;font-weight:bold;">Uptula</span>
      </div>

      <p style="font-size:16px;margin-bottom:10px;">
        Hi <strong>${userName || 'there'}</strong>,
      </p>

      <h2 style="margin:0 0 10px;color:#22c55e;">
        New job opportunity
      </h2>

      <p style="color:#9ca3af;font-size:14px;line-height:1.6;">
        A recruiter just posted a new opening that may interest you.
      </p>

      <div style="background:#1f2937;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0;font-size:16px;font-weight:bold;color:#f9fafb;">${jobTitle || 'New role'}</p>
        <p style="margin:6px 0 0;font-size:14px;color:#d1d5db;">${companyName || 'Company'}</p>
        ${locationLine}
      </div>

      <div style="text-align:center;">
        <a href="${jobsUrl}" style="
          display:inline-block;
          margin-top:8px;
          padding:12px 20px;
          background:#22c55e;
          color:white;
          text-decoration:none;
          border-radius:6px;
          font-weight:bold;
        ">
          View job listings
        </a>
      </div>

      <hr style="border-color:#374151;margin:25px 0;" />

      <p style="font-size:12px;color:#6b7280;text-align:center;">
        You received this because you are registered on Uptula Job Portal.
      </p>
    </div>
  </div>
  `;
};

module.exports = newJobPostedEmailTemplate;
