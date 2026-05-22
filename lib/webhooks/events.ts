export const WEBHOOK_EVENTS = {
  INVOICE_CREATED: 'invoice.created',
  INVOICE_PAID: 'invoice.paid',
  PAYMENT_SUCCEEDED: 'payment.succeeded',
  CLIENT_CREATED: 'client.created',
  FILE_UPLOADED: 'file.uploaded',
  EINVOICE_SENT: 'einvoice.sent',
} as const

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[keyof typeof WEBHOOK_EVENTS]

export const WEBHOOK_EVENT_LABELS: Record<WebhookEvent, string> = {
  [WEBHOOK_EVENTS.INVOICE_CREATED]: 'Fatura oluşturuldu',
  [WEBHOOK_EVENTS.INVOICE_PAID]: 'Fatura ödendi',
  [WEBHOOK_EVENTS.PAYMENT_SUCCEEDED]: 'Ödeme başarılı',
  [WEBHOOK_EVENTS.CLIENT_CREATED]: 'Müşteri oluşturuldu',
  [WEBHOOK_EVENTS.FILE_UPLOADED]: 'Dosya yüklendi',
  [WEBHOOK_EVENTS.EINVOICE_SENT]: 'e-Belge gönderildi',
}
