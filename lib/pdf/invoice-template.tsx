import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

Font.register({
  family: 'Inter',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTcvw.ttf', fontWeight: 400 },
    { src: 'https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTcvw.ttf', fontWeight: 700 },
  ],
})

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Inter', fontSize: 10, color: '#111827' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  brandName: { fontSize: 20, fontWeight: 700, color: '#4f7dff' },
  invoiceTitle: { fontSize: 24, fontWeight: 700, marginBottom: 4 },
  invoiceNumber: { fontSize: 11, color: '#6b7280' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  infoBox: { width: '48%' },
  infoLabel: { fontSize: 9, color: '#9ca3af', marginBottom: 2, textTransform: 'uppercase' },
  infoValue: { fontSize: 10, marginBottom: 1 },
  table: { marginBottom: 24 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', padding: '8px 0' },
  thDesc: { flex: 4, paddingLeft: 8, fontSize: 9, color: '#6b7280', textTransform: 'uppercase' },
  thQty: { flex: 1, textAlign: 'center', fontSize: 9, color: '#6b7280', textTransform: 'uppercase' },
  thPrice: { flex: 1.5, textAlign: 'right', fontSize: 9, color: '#6b7280', textTransform: 'uppercase' },
  thKdv: { flex: 1, textAlign: 'right', fontSize: 9, color: '#6b7280', textTransform: 'uppercase' },
  thTotal: { flex: 1.5, textAlign: 'right', paddingRight: 8, fontSize: 9, color: '#6b7280', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', borderBottom: '1px solid #f3f4f6', padding: '10px 0' },
  tdDesc: { flex: 4, paddingLeft: 8, fontSize: 10 },
  tdQty: { flex: 1, textAlign: 'center', fontSize: 10, color: '#374151' },
  tdPrice: { flex: 1.5, textAlign: 'right', fontSize: 10, color: '#374151' },
  tdKdv: { flex: 1, textAlign: 'right', fontSize: 9, color: '#6b7280' },
  tdTotal: { flex: 1.5, textAlign: 'right', paddingRight: 8, fontSize: 10, fontWeight: 700 },
  summaryRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12, paddingRight: 8 },
  summaryLabel: { width: 120, textAlign: 'right', fontSize: 10, color: '#6b7280', marginBottom: 4 },
  summaryValue: { width: 100, textAlign: 'right', fontSize: 10, marginBottom: 4 },
  summaryTotal: { width: 120, textAlign: 'right', fontSize: 14, fontWeight: 700, marginTop: 8, borderTop: '2px solid #e5e7eb', paddingTop: 8 },
  summaryTotalValue: { width: 100, textAlign: 'right', fontSize: 14, fontWeight: 700, marginTop: 8, borderTop: '2px solid #e5e7eb', paddingTop: 8 },
  footer: { marginTop: 40, borderTop: '1px solid #e5e7eb', paddingTop: 16, fontSize: 8, color: '#9ca3af', textAlign: 'center' },
  bankInfo: { marginTop: 16, padding: 12, backgroundColor: '#f9fafb', borderRadius: 4 },
  bankTitle: { fontSize: 9, fontWeight: 700, marginBottom: 8 },
})

function fmt(n: number): string {
  return Number(n).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ₺'
}

export default function InvoicePDF({ invoice }: { invoice: Record<string, unknown> }) {
  const v = (k: string, fallback = '') => String(invoice[k] || fallback)
  const n = (k: string, fallback = 0) => Number(invoice[k] || fallback)
  const items = (invoice.items || []) as Array<Record<string, unknown>>
  const kdvRate = n('kdv_rate', 20)
  const brandName: string = v('brand_name', 'Trevo')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>{brandName}</Text>
            <Text style={{ fontSize: 9, color: '#6b7280' }}>{v('issuer_address')}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.invoiceTitle}>FATURA</Text>
            <Text style={styles.invoiceNumber}>{v('invoice_number')}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Düzenleyen</Text>
            <Text style={styles.infoValue}>{(v('issuer_name', brandName)) || brandName as string}</Text>
            <Text style={styles.infoValue}>{(v('issuer_tax_office')) || ''}</Text>
            <Text style={styles.infoValue}>Vergi No: {(v('issuer_tax_number')) || ''}</Text>
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Alıcı</Text>
            <Text style={styles.infoValue}>{v('client_name')}</Text>
            {!!v('client_company') && <Text style={styles.infoValue}>{v('client_company')}</Text>}
            {!!v('client_tax_office') && <Text style={styles.infoValue}>{v('client_tax_office')}</Text>}
            {!!v('client_tax_number') && <Text style={styles.infoValue}>Vergi No: {v('client_tax_number')}</Text>}
          </View>
        </View>

        {/* Dates */}
        <View style={{ flexDirection: 'row', gap: 40, marginBottom: 24 }}>
          <View>
            <Text style={styles.infoLabel}>Fatura Tarihi</Text>
            <Text style={styles.infoValue}>{new Date(v('invoice_date')).toLocaleDateString('tr-TR')}</Text>
          </View>
          {!!v('due_date') && (
            <View>
              <Text style={styles.infoLabel}>Son Ödeme</Text>
              <Text style={styles.infoValue}>{new Date(v('due_date')).toLocaleDateString('tr-TR')}</Text>
            </View>
          )}
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.thDesc}>Açıklama</Text>
            <Text style={styles.thQty}>Miktar</Text>
            <Text style={styles.thPrice}>Birim Fiyat</Text>
            <Text style={styles.thKdv}>KDV</Text>
            <Text style={styles.thTotal}>Tutar</Text>
          </View>
          {items.map((item, i) => {
            const iv = (k: string, fb = '') => String(item[k] || fb)
            return (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.tdDesc}>{iv('description')}</Text>
              <Text style={styles.tdQty}>{iv('quantity')} {iv('unit', 'adet')}</Text>
              <Text style={styles.tdPrice}>{fmt(Number(item.unit_price || 0))}</Text>
              <Text style={styles.tdKdv}>%{iv('kdv_rate', '20')}</Text>
              <Text style={styles.tdTotal}>{fmt(Number(item.line_total || 0))}</Text>
            </View>
          )})}
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Ara Toplam</Text><Text style={styles.summaryValue}>{fmt(Number(n('subtotal')))}</Text></View>
        <View style={styles.summaryRow}><Text style={styles.summaryLabel}>KDV (%{kdvRate})</Text><Text style={styles.summaryValue}>{fmt(Number(n('kdv_amount')))}</Text></View>
        {Number(n('tevkifat_amount')) > 0 && (
          <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Tevkifat</Text><Text style={styles.summaryValue}>-{fmt(Number(n('tevkifat_amount')))}</Text></View>
        )}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotal}>TOPLAM</Text>
          <Text style={styles.summaryTotalValue}>{fmt(Number(n('total')))}</Text>
        </View>

        {/* Bank Info */}
        {v('bank_iban') && (
          <View style={styles.bankInfo}>
            <Text style={styles.bankTitle}>Banka Hesap Bilgileri</Text>
            <Text style={{ fontSize: 9 }}>IBAN: {v('bank_iban') as string}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{brandName as string} — {new Date().getFullYear()}</Text>
          <Text style={{ marginTop: 4 }}>Bu fatura elektronik ortamda düzenlenmiştir.</Text>
        </View>
      </Page>
    </Document>
  )
}
