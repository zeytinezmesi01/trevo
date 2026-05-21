import { NextResponse } from 'next/server'
import { getTenantContext } from '@/lib/tenant/auth'
import { listInvoices, createInvoice } from '@/lib/invoice/server'

export async function GET() {
  const ctx = await getTenantContext()
  const invoices = await listInvoices(ctx.tenantId)
  return NextResponse.json(invoices)
}

export async function POST(request: Request) {
  const ctx = await getTenantContext()
  const body = await request.json()
  const id = await createInvoice(ctx.tenantId, ctx.userId, body)
  return NextResponse.json({ id })
}
