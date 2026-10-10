import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    if (!payload || typeof payload !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    const {
      recipientEmail,
      recipientName,
      title,
      body,
      type,
      actionUrl,
      senderName,
      metadata,
    } = payload;

    // Sanitize and limit field sizes to prevent DoS or injection
    const cleanRecipientEmail = recipientEmail ? String(recipientEmail).trim().toLowerCase().slice(0, 255) : '';
    const cleanRecipientName = recipientName ? String(recipientName).trim().slice(0, 100) : '';
    const cleanTitle = String(title || 'IMS Notification').trim().slice(0, 150);
    const cleanBody = String(body || '').slice(0, 4000);
    const cleanSenderName = senderName ? String(senderName).trim().slice(0, 100) : 'IntraSphere Admin';

    // Verify recipient email format if provided
    if (cleanRecipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanRecipientEmail)) {
      return NextResponse.json({ success: false, error: 'Invalid recipient email format' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;
    const defaultFrom =
      process.env.NOTIFICATION_FROM_EMAIL || 'IntraSphere Labs IMS <onboarding@resend.dev>';
    const adminFallbackEmail = process.env.ADMIN_NOTIFICATION_EMAIL || 'teamintrasphere@gmail.com';

    let emailSent = false;
    let actualDeliveredTo = '';
    let emailId = '';
    let errorDetail = '';
    let webhookSent = false;

    // Target email resolution: default to admin fallback if no recipient passed
    const targetEmail = cleanRecipientEmail || adminFallbackEmail;

    // Helper to generate the email HTML template
    const generateHtml = (isForwardedSandbox = false) => `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 32px 24px; color: #111111; line-height: 1.5; background-color: #ffffff;">
        <!-- Header -->
        <div style="border-bottom: 2px solid #111111; padding-bottom: 16px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td>
                <span style="display: inline-block; background-color: #111111; color: #ffffff; font-weight: 800; font-size: 13px; padding: 4px 8px; border-radius: 4px; letter-spacing: 0.5px;">IMS</span>
                <span style="font-size: 16px; font-weight: 700; margin-left: 8px; vertical-align: middle; letter-spacing: -0.2px;">IntraSphere Labs</span>
              </td>
              <td style="text-align: right;">
                <span style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">System Alert</span>
              </td>
            </tr>
          </table>
          <p style="margin: 6px 0 0; font-size: 12px; color: #6b7280;">Internship Management System Notification</p>
        </div>

        ${
          isForwardedSandbox
            ? `<div style="background-color: #f3f4f6; border-left: 3px solid #111111; padding: 10px 14px; margin-bottom: 20px; font-size: 12px; color: #374151;">
                <strong>Resend Sandbox Routing:</strong> This notification was addressed to <strong>${recipientName || 'Intern'} &lt;${recipientEmail}&gt;</strong> and delivered to your registered admin inbox. To send directly to intern inboxes, verify your domain at <a href="https://resend.com/domains" style="color: #111111; text-decoration: underline;">resend.com/domains</a>.
              </div>`
            : ''
        }

        <!-- Notification Content -->
        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 18px; font-weight: 700; margin: 0 0 12px; color: #111111; letter-spacing: -0.3px;">
            ${title}
          </h2>
          
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px; margin: 16px 0; font-size: 14px; color: #1f2937; line-height: 1.6;">
            ${body.replace(/\n/g, '<br/>')}
          </div>

          ${
            senderName
              ? `<p style="font-size: 12px; color: #6b7280; margin: 4px 0 16px;">
                  Sent by: <strong style="color: #111111;">${senderName}</strong>
                </p>`
              : ''
          }
        </div>

        <!-- Action CTA -->
        <div style="margin: 28px 0; text-align: left;">
          <a href="${actionUrl || 'http://localhost:3000'}" style="display: inline-block; background-color: #111111; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 10px 20px; border-radius: 6px;">
            Open IntraSphere IMS &rarr;
          </a>
        </div>

        <!-- Footer -->
        <div style="margin-top: 36px; padding-top: 18px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; line-height: 1.5;">
          <p style="margin: 0 0 4px;">IntraSphere Labs &bull; Internal Internship Management Platform</p>
          <p style="margin: 0;">This is an automated alert generated because you are registered as an intern, coordinator, or admin.</p>
        </div>
      </div>
    `;

    // 1. Send via Resend
    if (resendApiKey && targetEmail) {
      try {
        let sendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: defaultFrom,
            to: targetEmail,
            subject: `[IntraSphere IMS] ${title}`,
            html: generateHtml(false),
          }),
        });

        if (sendRes.ok) {
          const resData = await sendRes.json();
          emailSent = true;
          actualDeliveredTo = targetEmail;
          emailId = resData.id;
        } else {
          const errData = await sendRes.json();
          // Check if it's Resend testing restriction (sandbox only allowed to account owner)
          if (
            (sendRes.status === 403 || sendRes.status === 422) &&
            targetEmail !== adminFallbackEmail
          ) {
            console.warn(
              `Resend sandbox prevented sending to ${targetEmail}. Retrying to admin fallback: ${adminFallbackEmail}`
            );
            // Fallback send to admin email so user receives the alert immediately
            const fallbackRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: defaultFrom,
                to: adminFallbackEmail,
                subject: `[IntraSphere IMS Alert for ${recipientName || targetEmail}] ${title}`,
                html: generateHtml(true),
              }),
            });

            if (fallbackRes.ok) {
              const fbData = await fallbackRes.json();
              emailSent = true;
              actualDeliveredTo = `${adminFallbackEmail} (Forwarded via Sandbox)`;
              emailId = fbData.id;
            } else {
              errorDetail = JSON.stringify(await fallbackRes.json());
            }
          } else {
            errorDetail = JSON.stringify(errData);
          }
        }
      } catch (err) {
        console.error('Failed to dispatch Resend email:', err);
        errorDetail = (err as Error).message;
      }
    }

    // 2. Dispatch Slack Webhook if configured
    if (slackWebhookUrl) {
      try {
        const slackRes = await fetch(slackWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `*IntraSphere IMS Alert: ${title}*\n>${body}\n_Recipient: ${recipientName || targetEmail}_`,
          }),
        });
        if (slackRes.ok) webhookSent = true;
      } catch (err) {
        console.error('Failed to dispatch Slack webhook:', err);
      }
    }

    // Log the notification event
    console.log('[Notification Dispatched]', {
      recipient: targetEmail,
      deliveredTo: actualDeliveredTo,
      emailId,
      title,
      type,
      emailSent,
      webhookSent,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      delivered: {
        email: emailSent,
        deliveredTo: actualDeliveredTo,
        emailId,
        webhook: webhookSent,
        simulated: !emailSent && !webhookSent,
      },
      message: emailSent
        ? `Out-of-app email alert delivered to ${actualDeliveredTo}`
        : errorDetail
        ? `Notification logged (Resend status: ${errorDetail})`
        : 'Notification simulated in local environment',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
