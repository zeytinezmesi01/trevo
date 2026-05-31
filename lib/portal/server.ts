import { createAdminClient } from '@/lib/supabase/admin'

/**
 * K-3: Müşteri portalı veri erişimi.
 *
 * Portal akışı service_role admin client kullanır (anon kullanıcı, RLS bypass).
 * Güvenliğin app kodundaki dağınık `.eq('client_id', ...)` filtrelerine bağlı
 * kalmaması için TÜM portal okumaları token-scoped SECURITY DEFINER RPC'lerden
 * geçer (bkz. supabase/migrations/032_portal_rpcs.sql). Scoping SQL içinde
 * sabittir; buradaki fonksiyonlar yalnızca tip güvenli birer sarmalayıcıdır.
 */

export type PortalClient = {
  id: string
  tenant_id: string
  name: string
  company: string | null
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  tax_number: string | null
}

export type PortalFile = {
  id: string
  name: string
  size: string | null
  file_type: string | null
  created_at: string
}

export type PortalInvoice = {
  id: string
  invoice_number: string
  invoice_date: string
  status: string
  total: number
  amount_paid: number
}

export type PortalDownloadFile = {
  id: string
  name: string
  url: string | null
  file_type: string | null
}

export type PortalPayableInvoice = {
  id: string
  tenant_id: string
  client_id: string
  invoice_number: string
  status: string
  total: number
  amount_paid: number
}

export type PortalPayment = {
  id: string
  status: string
  amount: number
  paid_at: string | null
  created_at: string
  error_message: string | null
  invoice_number: string
  invoice_status: string
  invoice_total: number
}

/** Token'dan client çöz (yoksa null). */
export async function getPortalClient(token: string): Promise<PortalClient | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .rpc('portal_get_client', { p_token: token })
    .maybeSingle()
  if (error || !data) return null
  return data as PortalClient
}

/** Portal'da gösterilecek paylaşılmış dosyalar. */
export async function listPortalFiles(token: string): Promise<PortalFile[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('portal_list_files', { p_token: token })
  if (error || !data) return []
  return data as PortalFile[]
}

/** Portal'da gösterilecek faturalar. */
export async function listPortalInvoices(token: string): Promise<PortalInvoice[]> {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('portal_list_invoices', { p_token: token })
  if (error || !data) return []
  return data as PortalInvoice[]
}

/** Tek dosya — yalnızca token'ın client'ına ait ve paylaşılmışsa (indirme için). */
export async function getPortalFile(
  token: string,
  fileId: string,
): Promise<PortalDownloadFile | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .rpc('portal_get_file', { p_token: token, p_file_id: fileId })
    .maybeSingle()
  if (error || !data) return null
  return data as PortalDownloadFile
}

/** Ödenebilir fatura — ödeme başlatma için, token scope'unda. */
export async function getPortalPayableInvoice(
  token: string,
  invoiceId: string,
): Promise<PortalPayableInvoice | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .rpc('portal_get_payable_invoice', { p_token: token, p_invoice_id: invoiceId })
    .maybeSingle()
  if (error || !data) return null
  return data as PortalPayableInvoice
}

/** Ödeme sonucu — token scope'unda payment + fatura özeti. */
export async function getPortalPayment(
  token: string,
  paymentId: string,
): Promise<PortalPayment | null> {
  const admin = createAdminClient()
  const { data, error } = await admin
    .rpc('portal_get_payment', { p_token: token, p_payment_id: paymentId })
    .maybeSingle()
  if (error || !data) return null
  return data as PortalPayment
}
