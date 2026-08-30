const nodemailer = require('nodemailer');
const dns = require('dns');

// Force Node to prefer IPv4 DNS resolution (prevents ENETUNREACH IPv6 errors in environments like Render)
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || 'SmartRoad <no-reply@smartroad.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@smartroad.com';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

// Initialize Transporter
let transporter = null;
const isSmtpConfigured = SMTP_HOST && SMTP_USER && SMTP_PASS;

if (isSmtpConfigured) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    // Force IPv4 lookup to prevent ENETUNREACH IPv6 errors in environments like Render
    lookup: (hostname, options, callback) => {
      dns.lookup(hostname, { ...options, family: 4 }, callback);
    },
  });
  
  // Verify configuration connection
  transporter.verify((error, success) => {
    if (error) {
      console.error('[EMAIL SERVICE] SMTP Verification Failed:', error.message);
    } else {
      console.log('[EMAIL SERVICE] SMTP Mail Server connected successfully!');
    }
  });
} else {
  console.log('[EMAIL SERVICE] SMTP configuration is missing. Dispatched emails will log directly to console.');
}

// Reusable Helper to dispatch notifications (supports Nodemailer and optional modular n8n hook trigger)
async function sendMailHelper(to, subject, htmlContent, metadata = {}) {
  try {
    // 1. Optional Webhook dispatch (n8n integration hook)
    if (N8N_WEBHOOK_URL) {
      try {
        console.log(`[EMAIL SERVICE] Forwarding alert to n8n webhook: ${N8N_WEBHOOK_URL}`);
        fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to, subject, metadata, timestamp: new Date() }),
        }).catch((err) => console.error('[EMAIL SERVICE] n8n fetch dispatch error:', err.message));
      } catch (err) {
        console.error('[EMAIL SERVICE] Failed forwarding to n8n:', err.message);
      }
    }

    // 2. Primary SMTP / console mock dispatch
    if (transporter) {
      const mailOptions = {
        from: EMAIL_FROM,
        to,
        subject,
        html: htmlContent,
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log(`[EMAIL SERVICE] Email dispatched successfully to ${to}. MessageId: ${info.messageId}`);
    } else {
      console.log('\n=================== SIMULATED EMAIL DISPATCH ===================');
      console.log(`To:      ${to}`);
      console.log(`From:    ${EMAIL_FROM}`);
      console.log(`Subject: ${subject}`);
      console.log('--------------------------- Content ---------------------------');
      // Simple HTML tags removal for clean console readability
      const textOnly = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
      console.log(`${textOnly}...`);
      console.log('================================================================\n');
    }
  } catch (error) {
    console.error(`[EMAIL SERVICE] Failed sending email to ${to}:`, error.message);
  }
}

// Professional HTML Header/Footer Wrapper
function getHtmlTemplate(title, preheader, bodyContent) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            background-color: #020617;
            color: #cbd5e1;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          }
          .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            padding: 30px 20px;
            text-align: center;
          }
          .logo-text {
            font-size: 24px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.5px;
            margin: 0;
          }
          .content {
            padding: 40px 30px;
            line-height: 1.6;
          }
          h1 {
            color: #ffffff;
            font-size: 20px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 20px;
          }
          .data-table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
            background-color: #020617;
            border: 1px solid #1e293b;
            border-radius: 8px;
            overflow: hidden;
          }
          .data-table td {
            padding: 12px 16px;
            border-bottom: 1px solid #1e293b;
            font-size: 14px;
          }
          .data-table td.label {
            font-weight: 600;
            color: #94a3b8;
            width: 35%;
          }
          .data-table td.value {
            color: #f8fafc;
          }
          .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 750;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .badge-pothole { background-color: #ef4444; color: #ffffff; }
          .badge-crack { background-color: #f97316; color: #ffffff; }
          .badge-other { background-color: #0ea5e9; color: #ffffff; }
          
          .badge-high { background-color: rgba(244, 63, 94, 0.15); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.3); }
          .badge-medium { background-color: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.3); }
          .badge-low { background-color: rgba(100, 116, 139, 0.15); color: #94a3b8; border: 1px solid rgba(100, 116, 139, 0.3); }
          
          .badge-status { background-color: #334155; color: #e2e8f0; }
          .badge-resolved { background-color: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.3); }

          .btn-container {
            text-align: center;
            margin-top: 30px;
          }
          .btn {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff !important;
            padding: 12px 28px;
            font-size: 14px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
            transition: all 0.2s ease;
          }
          .footer {
            background-color: #020617;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #1e293b;
            font-size: 12px;
            color: #64748b;
          }
          .footer a {
            color: #3b82f6;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo-text">⚠️ SmartRoad Systems</div>
          </div>
          <div class="content">
            ${bodyContent}
          </div>
          <div class="footer">
            This is an automated operational alert from SmartRoad Systems.<br>
            If you did not initiate this request, please ignore or contact <a href="mailto:${ADMIN_EMAIL}">${ADMIN_EMAIL}</a>.
          </div>
        </div>
      </body>
    </html>
  `;
}

// 1. Citizen Report Submitted Confirmation Email
async function sendCitizenReportSubmittedEmail(citizenEmail, citizenName, report) {
  const subject = `Road Damage Report Submitted - #${report.id}`;
  const reportUrl = `${FRONTEND_URL}/my-reports/${report.id}`;
  
  const typeBadge = `<span class="badge badge-${String(report.damageType).toLowerCase()}">${report.damageType}</span>`;
  const severityBadge = `<span class="badge badge-${String(report.severity).toLowerCase()}">${report.severity}</span>`;
  const priorityBadge = `<span class="badge badge-${String(report.priority).toLowerCase()}">${report.priority}</span>`;

  const html = getHtmlTemplate(
    'Damage Report Filed Successfully',
    'Report Submitted',
    `
    <h1>Hello, ${citizenName}</h1>
    <p>Thank you for contributing to public road safety! Your road damage report has been logged and queued for administrative review. You can track progress directly inside your dashboard.</p>
    
    <table class="data-table">
      <tr><td class="label">Report ID</td><td class="value">#${report.id}</td></tr>
      <tr><td class="label">Type</td><td class="value">${typeBadge}</td></tr>
      <tr><td class="label">Severity</td><td class="value">${severityBadge}</td></tr>
      <tr><td class="label">Priority</td><td class="value">${priorityBadge}</td></tr>
      <tr><td class="label">Address</td><td class="value">${report.address}</td></tr>
      <tr><td class="label">Notes</td><td class="value italic">"${report.userNotes || 'No notes provided'}"</td></tr>
      <tr><td class="label">Status</td><td class="value"><span class="badge badge-status">${report.status}</span></td></tr>
      <tr><td class="label">Date Filed</td><td class="value">${new Date(report.createdAt).toLocaleString()}</td></tr>
    </table>

    <div class="btn-container">
      <a href="${reportUrl}" class="btn">Track Report Online</a>
    </div>
    `
  );

  await sendMailHelper(citizenEmail, subject, html, { type: 'citizen_submission', reportId: report.id });
}

// 2. Admin New Report Email Notification
async function sendAdminNewReportEmail(report, citizenName) {
  const subject = `[New Report] Road Damage Filed - #${report.id}`;
  const adminUrl = `${FRONTEND_URL}/admin/reports/${report.id}`;

  const typeBadge = `<span class="badge badge-${String(report.damageType).toLowerCase()}">${report.damageType}</span>`;
  const severityBadge = `<span class="badge badge-${String(report.severity).toLowerCase()}">${report.severity}</span>`;
  const priorityBadge = `<span class="badge badge-${String(report.priority).toLowerCase()}">${report.priority}</span>`;

  const html = getHtmlTemplate(
    'New Road Hazard Filed',
    'Admin Alert',
    `
    <h1>New Damage Submission Alert</h1>
    <p>A citizen has filed a new road surface defect that requires review and status classification.</p>
    
    <table class="data-table">
      <tr><td class="label">Report ID</td><td class="value">#${report.id}</td></tr>
      <tr><td class="label">Reporter Name</td><td class="value">${citizenName}</td></tr>
      <tr><td class="label">Damage Type</td><td class="value">${typeBadge}</td></tr>
      <tr><td class="label">Severity</td><td class="value">${severityBadge}</td></tr>
      <tr><td class="label">Priority</td><td class="value">${priorityBadge}</td></tr>
      <tr><td class="label">Address</td><td class="value">${report.address}</td></tr>
      <tr><td class="label">AI Description</td><td class="value font-medium">${report.aiDescription || 'Not analyzed'}</td></tr>
      <tr><td class="label">User Notes</td><td class="value italic">"${report.userNotes || 'No notes'}"</td></tr>
      <tr><td class="label">Submission Date</td><td class="value">${new Date(report.createdAt).toLocaleString()}</td></tr>
    </table>

    <div class="btn-container">
      <a href="${adminUrl}" class="btn">Open Report in Manager</a>
    </div>
    `
  );

  await sendMailHelper(ADMIN_EMAIL, subject, html, { type: 'admin_notification', reportId: report.id });
}

// 3. Urgent High Priority Admin Alert
async function sendHighPriorityAdminEmail(report, citizenName) {
  const subject = `🚨 URGENT: High Priority Hazard - #${report.id}`;
  const adminUrl = `${FRONTEND_URL}/admin/reports/${report.id}`;

  const typeBadge = `<span class="badge badge-${String(report.damageType).toLowerCase()}">${report.damageType}</span>`;
  const severityBadge = `<span class="badge badge-high">${report.severity}</span>`;
  const priorityBadge = `<span class="badge badge-high" style="background-color: #ef4444; color: #ffffff;">CRITICAL HIGH</span>`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; background-color: #020617; color: #cbd5e1; margin: 0; padding: 20px; }
          .alert-card { max-width: 600px; margin: 20px auto; background-color: #0f172a; border: 2px solid #ef4444; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(239, 68, 68, 0.25); }
          .alert-header { background-color: #ef4444; color: white; padding: 20px; text-align: center; font-weight: 800; font-size: 20px; }
          .alert-body { padding: 30px 25px; line-height: 1.6; }
          .table-style { width: 100%; border-collapse: collapse; margin-top: 15px; background: #020617; border-radius: 6px; overflow: hidden; }
          .table-style td { padding: 12px; border-bottom: 1px solid #1e293b; font-size: 14px; }
          .table-style td.label { font-weight: bold; color: #94a3b8; width: 35%; }
          .table-style td.value { color: white; }
          .btn-urg { display: inline-block; background-color: #ef4444; color: white !important; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 6px; margin-top: 25px; display: block; text-align: center; }
        </style>
      </head>
      <body>
        <div class="alert-card">
          <div class="alert-header">
            🚨 HIGH-PRIORITY ACTION REQUIRED
          </div>
          <div class="alert-body">
            <p>Our Gemini Vision AI pipeline has classified a new submission as **HIGH PRIORITY / URGENT**. This issue requires rapid dispatch to prevent vehicular damage or public injury.</p>
            
            <table class="table-style">
              <tr><td class="label">Report ID</td><td class="value">#${report.id}</td></tr>
              <tr><td class="label">Reporter Name</td><td class="value">${citizenName}</td></tr>
              <tr><td class="label">Type</td><td class="value">${typeBadge}</td></tr>
              <tr><td class="label">Severity</td><td class="value">${severityBadge}</td></tr>
              <tr><td class="label">Priority</td><td class="value">${priorityBadge}</td></tr>
              <tr><td class="label">Address</td><td class="value" style="color: #f43f5e; font-weight: bold;">${report.address}</td></tr>
              <tr><td class="label">AI description</td><td class="value">${report.aiDescription}</td></tr>
            </table>

            <a href="${adminUrl}" class="btn-urg">DISPATCH CREW NOW</a>
          </div>
        </div>
      </body>
    </html>
  `;

  await sendMailHelper(ADMIN_EMAIL, subject, html, { type: 'admin_critical_alert', reportId: report.id });
}

// 4. Citizen Status Update Email
async function sendCitizenStatusUpdateEmail(citizenEmail, report, oldStatus, newStatus, remarks) {
  const subject = `Update on Road Damage Report - #${report.id}`;
  const reportUrl = `${FRONTEND_URL}/my-reports/${report.id}`;

  const oldStatusBadge = `<span class="badge badge-status">${oldStatus}</span>`;
  const newStatusBadge = `<span class="badge badge-status" style="background-color: #3b82f6; color: white;">${newStatus}</span>`;

  const html = getHtmlTemplate(
    'Status Updated',
    'Report Update',
    `
    <h1>Status Updated on Report #${report.id}</h1>
    <p>The city road maintenance crew has updated the operational status of your submission.</p>
    
    <table class="data-table">
      <tr><td class="label">Report ID</td><td class="value">#${report.id}</td></tr>
      <tr><td class="label">Hazard Location</td><td class="value">${report.address}</td></tr>
      <tr><td class="label">Previous Status</td><td class="value">${oldStatusBadge}</td></tr>
      <tr><td class="label">Current Status</td><td class="value">${newStatusBadge}</td></tr>
      <tr><td class="label">Remarks / Updates</td><td class="value" style="color: #60a5fa; font-weight: 500;">"${remarks || 'Crew has been assigned.'}"</td></tr>
      <tr><td class="label">Last Updated</td><td class="value">${new Date(report.updatedAt).toLocaleString()}</td></tr>
    </table>

    <div class="btn-container">
      <a href="${reportUrl}" class="btn">View Timeline Logs</a>
    </div>
    `
  );

  await sendMailHelper(citizenEmail, subject, html, { type: 'citizen_status_update', reportId: report.id });
}

// 5. Citizen Resolution Email
async function sendCitizenResolutionEmail(citizenEmail, report, remarks) {
  const subject = `✅ Resolved: Road Damage Repaired - #${report.id}`;
  const reportUrl = `${FRONTEND_URL}/my-reports/${report.id}`;

  const resolvedBadge = `<span class="badge badge-resolved">Resolved & Closed</span>`;

  const html = getHtmlTemplate(
    'Road Hazard Resolved!',
    'Resolution Closed',
    `
    <div style="text-align: center; margin-bottom: 25px;">
      <span style="font-size: 50px;">🎉</span>
    </div>
    <h1>Excellent News! Road Repair Completed</h1>
    <p>We are happy to report that the road damage hazard you filed has been fully resolved and safety crew operations are closed. Thank you for your reporting contributions!</p>
    
    <table class="data-table">
      <tr><td class="label">Report ID</td><td class="value">#${report.id}</td></tr>
      <tr><td class="label">Pavement Location</td><td class="value">${report.address}</td></tr>
      <tr><td class="label">Resolution Status</td><td class="value">${resolvedBadge}</td></tr>
      <tr><td class="label">Resolution Notes</td><td class="value" style="color: #34d399; font-weight: 600;">"${remarks || 'Work successfully completed.'}"</td></tr>
      <tr><td class="label">Completion Date</td><td class="value">${new Date(report.updatedAt).toLocaleString()}</td></tr>
    </table>

    <p style="text-align: center; color: #94a3b8; font-size: 13px; margin-top: 20px;">
      Thanks to citizens like you, we can keep the city transit lines safer for everyone.
    </p>

    <div class="btn-container">
      <a href="${reportUrl}" class="btn" style="background-color: #10b981; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);">Review Closed Report</a>
    </div>
    `
  );

  await sendMailHelper(citizenEmail, subject, html, { type: 'citizen_resolution', reportId: report.id });
}

// 6. Password Reset Recovery Email
async function sendPasswordResetEmail(citizenEmail, resetToken) {
  const subject = '🔒 Reset Your SmartRoad Password';
  const resetUrl = `${FRONTEND_URL}/forgot-password?token=${resetToken}`;

  const html = getHtmlTemplate(
    'Reset Password Request',
    'Account Security',
    `
    <h1>Password Reset Request</h1>
    <p>A request was made to reset the login credentials associated with your SmartRoad account. Click the button below to specify a new password. This link is valid for **15 minutes**.</p>
    
    <div style="background-color: #020617; border: 1px solid #1e293b; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <p style="margin: 0; font-size: 13px; color: #94a3b8; line-height: 1.5;">
        <strong>Development Sandbox Mode:</strong> If you are testing this in a terminal workspace, you can also paste the secure recovery token directly in the Forgot Password form:
      </p>
      <code style="display: block; word-break: break-all; background: #0f172a; padding: 10px; border-radius: 4px; border: 1px solid #334155; font-size: 11px; margin-top: 10px; color: #60a5fa;">
        ${resetToken}
      </code>
    </div>

    <div class="btn-container">
      <a href="${resetUrl}" class="btn">Reset Password Now</a>
    </div>
    
    <p style="font-size: 11px; color: #64748b; margin-top: 30px; line-height: 1.4;">
      If you did not request a password recovery, no action is required and you may discard this email securely.
    </p>
    `
  );

  await sendMailHelper(citizenEmail, subject, html, { type: 'password_reset' });
}

// 7. Citizen Registration Success Email
async function sendRegistrationSuccessEmail(citizenEmail, citizenName) {
  const subject = '🎉 Welcome to SmartRoad!';
  const dashboardUrl = `${FRONTEND_URL}/login`;

  const html = getHtmlTemplate(
    'Welcome to SmartRoad',
    'Registration Successful',
    `
    <h1>Welcome to SmartRoad, ${citizenName}!</h1>
    <p>Your account has been created successfully. You can now log in to report road hazards, view real-time damage maps, and track the progress of repair crews in your community.</p>
    
    <div class="btn-container">
      <a href="${dashboardUrl}" class="btn">Log In to Dashboard</a>
    </div>
    
    <p style="font-size: 13px; color: #94a3b8; margin-top: 30px; text-align: center;">
      Let's work together to make our transit lines safer.
    </p>
    `
  );

  await sendMailHelper(citizenEmail, subject, html, { type: 'registration_success' });
}

module.exports = {
  sendCitizenReportSubmittedEmail,
  sendAdminNewReportEmail,
  sendHighPriorityAdminEmail,
  sendCitizenStatusUpdateEmail,
  sendCitizenResolutionEmail,
  sendPasswordResetEmail,
  sendRegistrationSuccessEmail,
};
