import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { getInvoice, updateInvoiceStatus, deleteInvoice } from '@/lib/invoice/server'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  const { id } = await params
  const invoice = await getInvoice(id, ctx.tenantId)
  if (!invoice) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 })
  return NextResponse.json(invoice)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  const { id } = await params
  const { status, ...data } = await request.json()
  await updateInvoiceStatus(id, ctx.tenantId, status, data)
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getTenantContext()
  const { id } = await params
  await deleteInvoice(id, ctx.tenantId)
  return NextResponse.json({ ok: true })
}
