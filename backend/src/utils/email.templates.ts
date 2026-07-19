type TrialLeadEmailData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  companySize: string;
  challenge?: string;
  submittedAt: string;
  source: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const logoSvg = `<svg width="160" height="40" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M25.3333 13.3333L20 22.6667L14.6667 13.3333H9.33333L17.3333 27.3333L12 36.6667H17.3333L20 32L22.6667 36.6667H28L22.6667 27.3333L30.6667 13.3333H25.3333Z" fill="#2563eb"/>
  <path d="M30 16C30 16 34.6667 10.6667 40 10.6667C45.3333 10.6667 48 14.6667 48 20C48 25.3333 42.6667 38.6667 42.6667 38.6667C42.6667 38.6667 34.6667 28 32 24" stroke="#2563eb" stroke-width="3" stroke-linecap="round"/>
  <text fill="#0f172a" xml:space="preserve" style="white-space: pre" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="800" letter-spacing="0em"><tspan x="54" y="28.6364">WorkforceOS</tspan></text>
</svg>`;

const checkIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="12" fill="#E0F2FE"/><path d="M16 9L10.5 14.5L8 12" stroke="#0369A1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

function fieldRow(label: string, value: string, iconSvg?: string) {
  const safeValue = escapeHtml(value || "-");
  return `
    <tr>
      <td style="padding:16px 24px;border-top:1px solid #e2e8f0;background:#ffffff;">
        <div style="display:flex;align-items:flex-start;gap:16px;">
          ${iconSvg ? `<div style="flex-shrink:0;">${iconSvg}</div>` : ""}
          <div style="flex:1;">
            <div style="color:#64748b;font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:4px;">${escapeHtml(label)}</div>
            <div style="color:#0f172a;font-size:15px;font-weight:500;line-height:1.5;">${safeValue}</div>
          </div>
        </div>
      </td>
    </tr>`;
}

function emailShell(content: string, preheader: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WorkforceOS Email</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body, table, td, div, p, a { font-family: 'Inter', Arial, sans-serif; }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;-webkit-font-smoothing:antialiased;">
  <!-- Preheader -->
  <div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>
  
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;background-color:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <!-- Logo -->
        <div style="margin-bottom:32px;text-align:center;">
          ${logoSvg}
        </div>
        
        <!-- Main Content Box -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;max-width:600px;border-collapse:collapse;background-color:#ffffff;border-radius:16px;box-shadow:0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);overflow:hidden;">
          ${content}
        </table>
        
        <!-- Footer -->
        <div style="margin-top:32px;text-align:center;color:#94a3b8;font-size:12px;line-height:1.5;">
          <p style="margin:0;">&copy; 2026 WorkforceOS. All rights reserved.</p>
          <p style="margin:4px 0 0 0;">Empowering operations, beautifully.</p>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildLeadEmailHtml(data: TrialLeadEmailData) {
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  const challenge = data.challenge?.trim() || "Not shared";

  const personIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
  const mailIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`;
  const phoneIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`;
  const buildingIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><path d="M9 22v-4h6v4"></path><path d="M8 6h.01"></path><path d="M16 6h.01"></path><path d="M12 6h.01"></path><path d="M12 10h.01"></path><path d="M12 14h.01"></path><path d="M16 10h.01"></path><path d="M16 14h.01"></path><path d="M8 10h.01"></path><path d="M8 14h.01"></path></svg>`;
  const usersIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
  const lightbulbIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"></path><path d="M10 22h4"></path><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5"></path></svg>`;
  
  const content = `
    <!-- Header -->
    <tr>
      <td style="padding:40px 32px 32px 32px;background:linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);border-bottom:1px solid #e2e8f0;">
        <div style="display:inline-block;padding:6px 12px;background:#dbeafe;color:#1e40af;font-size:12px;font-weight:700;border-radius:100px;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:16px;">New Lead</div>
        <h1 style="margin:0 0 12px 0;font-size:28px;font-weight:800;color:#0f172a;line-height:1.2;">A new trial request<br>has landed</h1>
        <p style="margin:0;font-size:16px;line-height:1.6;color:#475569;">The prospect is ready for review and engagement.</p>
      </td>
    </tr>
    <!-- Data Fields -->
    ${fieldRow("Full Name", fullName, personIcon)}
    ${fieldRow("Company", data.companyName, buildingIcon)}
    ${fieldRow("Company Size", data.companySize, usersIcon)}
    ${fieldRow("Email Address", data.email, mailIcon)}
    ${fieldRow("Phone Number", data.phone, phoneIcon)}
    ${fieldRow("Biggest Challenge", challenge, lightbulbIcon)}
    ${fieldRow("Source / Date", `${data.source} on ${data.submittedAt}`)}
    <!-- Footer CTA Space -->
    <tr>
      <td style="padding:32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
        <a href="mailto:${data.email}" style="display:inline-block;padding:14px 28px;background:#2563eb;color:#ffffff;font-weight:600;font-size:15px;text-decoration:none;border-radius:8px;box-shadow:0 4px 6px -1px rgba(37, 99, 235, 0.2);">Reply to Lead</a>
      </td>
    </tr>
  `;

  return emailShell(content, `New lead from ${data.companyName}`);
}

export function buildClientTrialEmailHtml(data: TrialLeadEmailData) {
  const fullName = `${data.firstName} ${data.lastName}`.trim();

  const content = `
    <!-- Hero Header -->
    <tr>
      <td style="padding:48px 32px 40px 32px;background:#0f172a;text-align:center;border-top-left-radius:16px;border-top-right-radius:16px;">
        <h1 style="margin:0 0 16px 0;font-size:32px;font-weight:800;color:#ffffff;line-height:1.2;letter-spacing:-0.02em;">Request Received!</h1>
        <p style="margin:0;font-size:16px;line-height:1.6;color:#94a3b8;max-width:400px;display:inline-block;">Your request is with us. We are preparing the ultimate operating system for <strong>${escapeHtml(data.companyName)}</strong>.</p>
      </td>
    </tr>
    
    <!-- Next Steps Section -->
    <tr>
      <td style="padding:40px 32px 16px 32px;background:#ffffff;">
        <h2 style="margin:0 0 24px 0;font-size:18px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.05em;">What happens next?</h2>
        
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="padding-bottom:20px;">
              <div style="display:flex;align-items:flex-start;gap:16px;">
                <div style="flex-shrink:0;">${checkIcon}</div>
                <div>
                  <div style="color:#0f172a;font-weight:600;font-size:15px;margin-bottom:4px;">1. Reviewing your workspace</div>
                  <div style="color:#64748b;font-size:14px;line-height:1.6;">Our team is reviewing your details to tailor the trial to your company's needs.</div>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-bottom:20px;">
              <div style="display:flex;align-items:flex-start;gap:16px;">
                <div style="flex-shrink:0;">${checkIcon}</div>
                <div>
                  <div style="color:#0f172a;font-weight:600;font-size:15px;margin-bottom:4px;">2. Account provisioning</div>
                  <div style="color:#64748b;font-size:14px;line-height:1.6;">We'll set up your dedicated environment and bootstrap it for you.</div>
                </div>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div style="display:flex;align-items:flex-start;gap:16px;">
                <div style="flex-shrink:0;">${checkIcon}</div>
                <div>
                  <div style="color:#0f172a;font-weight:600;font-size:15px;margin-bottom:4px;">3. You're in!</div>
                  <div style="color:#64748b;font-size:14px;line-height:1.6;">You'll receive an email with your secure login link and setup instructions shortly.</div>
                </div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    
    <!-- Summary Section -->
    <tr>
      <td style="padding:32px;background:#ffffff;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
          <div style="padding:16px 20px;background:#f1f5f9;border-bottom:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.05em;">Your Details</div>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            <tr>
              <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                <div style="font-size:12px;color:#64748b;font-weight:600;margin-bottom:4px;">Name</div>
                <div style="font-size:15px;color:#0f172a;font-weight:500;">${escapeHtml(fullName)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;">
                <div style="font-size:12px;color:#64748b;font-weight:600;margin-bottom:4px;">Work Email</div>
                <div style="font-size:15px;color:#0f172a;font-weight:500;">${escapeHtml(data.email)}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px;">
                <div style="font-size:12px;color:#64748b;font-weight:600;margin-bottom:4px;">Company Size</div>
                <div style="font-size:15px;color:#0f172a;font-weight:500;">${escapeHtml(data.companySize)}</div>
              </td>
            </tr>
          </table>
        </div>
      </td>
    </tr>
    
    <!-- Contact Info -->
    <tr>
      <td style="padding:0 32px 40px 32px;background:#ffffff;text-align:center;">
        <p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">If any of the details above look incorrect, just reply directly to this email to let us know.</p>
      </td>
    </tr>
  `;

  return emailShell(content, `Thanks for starting your WorkforceOS trial, ${data.firstName}`);
}

export function buildTrialLeadEmailText(data: TrialLeadEmailData) {
  const fullName = `${data.firstName} ${data.lastName}`.trim();
  return [
    `New trial lead: ${fullName}`,
    `Company: ${data.companyName}`,
    `Company size: ${data.companySize}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    `Challenge: ${data.challenge?.trim() || "Not shared"}`,
    `Source: ${data.source}`,
    `Submitted at: ${data.submittedAt}`
  ].join("\\n");
}