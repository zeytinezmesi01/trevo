import { Resend } from 'resend'
import { Brand, DEFAULT_BRAND } from '@/lib/types/brand'
import { escapeHtml } from '@/lib/escape-html'

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'bildirim@trevo-delta.vercel.app'

let _resend: Resend | null = null
function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export async function sendTeamInvitation({
  email,
  tenantName,
  inviteUrl,
}: {
  email: string
  tenantName: string
  inviteUrl: string
}) {
  const safeTenantName = escapeHtml(tenantName)
  const r = getResend(); if (!r) return; await r.emails.send({
    from: `Trevo <${FROM_EMAIL}>`,
    to: email,
    subject: `${tenantName} sizi ekibine davet etti`,
    html: `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:-apple-system,BlinkMacSystemFont,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 20px;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e8edf8;">
        <tr><td style="background:linear-gradient(135deg,#4f7dff,#6a96ff);padding:24px 32px;text-align:center;">
          <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Trevo</h1>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 8px;color:#0f172a;font-size:18px;">${safeTenantName} ekibine davet edildiniz</h2>
          <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
            Ekibe katılmak için aşağıdaki butona tıklayın ve hesabınızı oluşturun.
            Davet 7 gün geçerlidir.
          </p>
          <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f7dff,#6a96ff);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600;">
            Ekibe Katıl
          </a>
          <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;">
            Bu daveti siz talep etmediyseniz görmezden gelebilirsiniz.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
  })
}

export async function sendFileNotification({
  clientName,
  clientEmail,
  fileName,
  fileUrl,
  portalUrl,
  brand,
}: {
  clientName: string
  clientEmail: string
  fileName: string
  fileUrl: string
  portalUrl: string
  brand?: Brand
}) {
  const b = brand || DEFAULT_BRAND
  const brandName = escapeHtml(b.brandName || 'Trevo')
  const primaryColor = b.brandPrimaryColor || '#111827'
  const fromEmail = process.env.RESEND_FROM_EMAIL || `bildirim@trevo-delta.vercel.app`
  const safeClientName = escapeHtml(clientName)
  const safeFileName = escapeHtml(fileName)

  const r = getResend(); if (!r) return; await r.emails.send({
    from: `${brandName} <${fromEmail}>`,
    to: clientEmail,
    subject: `Yeni dosyanız hazır: ${fileName}`,
    html: `
<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
          <tr>
            <td style="background:${primaryColor};padding:28px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">${brandName}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 8px;color:#6b7280;font-size:14px;">Merhaba ${safeClientName},</p>
              <h2 style="margin:0 0 24px;color:#111827;font-size:20px;font-weight:600;">Yeni bir dosyanız paylaşıldı</h2>

              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin-bottom:28px;">
                <p style="margin:0;color:#374151;font-size:14px;">
                  <span style="color:#6b7280;">Dosya adı:</span><br>
                  <strong style="color:#111827;font-size:16px;">${safeFileName}</strong>
                </p>
              </div>

              <a href="${portalUrl}" style="display:inline-block;background:${primaryColor};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:10px;font-size:14px;font-weight:600;">
                Portale Git &rarr;
              </a>

              <p style="margin:28px 0 0;color:#9ca3af;font-size:12px;line-height:1.6;">
                Bu mail sizinle dosya paylaşan kişi tarafından otomatik gönderilmiştir.<br>
                Portale erişmek için yukarıdaki butona tıklayabilirsiniz.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">${brandName} — Müşteri Portalı</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  })
}
