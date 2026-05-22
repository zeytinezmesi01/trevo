export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled' | 'refunded'

export type IyzicoMode = 'sandbox' | 'production'

export type PaymentProviderName = 'mock' | 'iyzico'

export type CheckoutInitializeParams = {
  paymentId: string
  invoiceId: string
  amount: number
  currency: string
  buyerIp: string
  buyer: {
    id: string
    name: string
    surname: string
    email: string
    identityNumber?: string
    address: string
    city: string
    country: string
  }
  basketItems: Array<{
    id: string
    name: string
    category1: string
    itemType: 'PHYSICAL' | 'VIRTUAL'
    price: number
  }>
  callbackUrl: string
}

export type CheckoutInitializeResult = {
  token: string
  checkoutFormContent: string
  paymentPageUrl: string
}

export type CheckoutRetrieveResult = {
  status: PaymentStatus
  providerPaymentId: string | null
  paidPrice: number | null
  raw: Record<string, unknown>
}

export type TestConnectionResult = {
  success: boolean
  message: string
}
