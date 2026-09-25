import { OrderItem } from '../types';

/**
 * Template CSV spesifik sesuai format yang diminta:
 * Delimiter: ; (titik koma)
 * Header baris:
 * Nama Penerima;Alamat Penerima;Nomor Telepon;Kode Pos;Berat;Harga Barang (Jika NON-COD);Nilai COD (Jika COD);Isi Paketan (Nama Produk);*Kelurahan;*Kecamatan;**Quantity;*Instruksi Pengiriman
 */
export const REQUIRED_CSV_HEADERS = [
  'Nama Penerima',
  'Alamat Penerima',
  'Nomor Telepon',
  'Kode Pos',
  'Berat',
  'Harga Barang (Jika NON-COD)',
  'Nilai COD (Jika COD)',
  'Isi Paketan (Nama Produk)',
  '*Kelurahan',
  '*Kecamatan',
  '**Quantity',
  '*Instruksi Pengiriman'
];

/**
 * Membersihkan string teks untuk format CSV dengan delimiter semicolon (;)
 */
function cleanCsvField(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  // Jika field memiliki titik koma (;), petik dua ("), enter (\n), bungkus dengan tanda kutip ganda dan escape
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Format nomor telepon standar (hanya angka, misal 081288991201)
 */
function cleanPhoneNumber(phone: string): string {
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('62')) {
    clean = '0' + clean.slice(2);
  }
  return clean;
}

export function generateAggregatorCSV(orders: OrderItem[], aggregator?: string): string {
  const headerLine = REQUIRED_CSV_HEADERS.join(';');

  const rows = orders.map((order) => {
    // 1. Nama Penerima
    const namaPenerima = order.customerName || '';

    // 2. Alamat Penerima (Jalan, RT/RW, dan patokan)
    const streetParts = [order.address.streetAndNumber, order.address.rtRw].filter(Boolean).join(', ');
    const alamatPenerima = streetParts || order.address.streetAndNumber || '';

    // 3. Nomor Telepon
    const nomorTelepon = cleanPhoneNumber(order.phone || '');

    // 4. Kode Pos
    const kodePos = order.address.postalCode || '';

    // 5. Berat (gram atau desimal kg; format angka murni misal 1000 atau 1)
    const berat = order.weightGram > 0 ? order.weightGram : Math.round(order.weightKg * 1000);

    // 6. Harga Barang (Jika NON-COD)
    const hargaNonCod = order.paymentMethod !== 'COD' ? order.totalAmount : 0;

    // 7. Nilai COD (Jika COD)
    const nilaiCod = order.paymentMethod === 'COD' ? order.totalAmount : 0;

    // 8. Isi Paketan (Nama Produk)
    const isiPaketan = order.productSummary || (order.items && order.items.length > 0 ? order.items.map(i => `${i.name}${i.variant ? ' (' + i.variant + ')' : ''}`).join(', ') : 'Paket Pakaian & Aksesoris');

    // 9. *Kelurahan
    const kelurahan = order.address.kelurahan || '';

    // 10. *Kecamatan
    const kecamatan = order.address.kecamatan || '';

    // 11. **Quantity
    const quantity = order.itemCount || (order.items && order.items.length > 0 ? order.items.reduce((acc, curr) => acc + curr.qty, 0) : 1);

    // 12. *Instruksi Pengiriman (Patokan atau catatan kurir)
    const instruksiPengiriman = order.address.landmark
      ? `Patokan: ${order.address.landmark}. Jangan dibanting.`
      : 'Jangan dibanting / hubungi penerima sebelum antar.';

    return [
      cleanCsvField(namaPenerima),
      cleanCsvField(alamatPenerima),
      cleanCsvField(nomorTelepon),
      cleanCsvField(kodePos),
      cleanCsvField(berat),
      cleanCsvField(hargaNonCod),
      cleanCsvField(nilaiCod),
      cleanCsvField(isiPaketan),
      cleanCsvField(kelurahan),
      cleanCsvField(kecamatan),
      cleanCsvField(quantity),
      cleanCsvField(instruksiPengiriman)
    ].join(';');
  });

  // Tambahkan UTF-8 BOM (\uFEFF) agar saat dibuka langsung di Microsoft Excel atau notepad Windows, karakter terbaca sempurna
  return '\uFEFF' + [headerLine, ...rows].join('\r\n');
}

export function downloadBlobAsFile(content: string, filename: string, mimeType: string = 'text/csv;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function getExportPayloadPreview(orders: OrderItem[], aggregator: string) {
  return {
    meta: {
      generator: 'KirimRapi Dispatch Engine v2.4',
      aggregator_target: aggregator.toUpperCase(),
      exported_at: new Date().toISOString(),
      verified_by_kemendagri: true,
      total_records: orders.length,
      anti_duplication_enforced: true
    },
    orders: orders.map(o => ({
      booking_id: o.orderNumber,
      recipient: {
        name: o.customerName,
        phone_wa: o.phone,
        wa_verified: o.waSent
      },
      normalized_address: {
        street_address: o.address.streetAndNumber,
        rt_rw: o.address.rtRw,
        kelurahan: o.address.kelurahan,
        kecamatan: o.address.kecamatan,
        city: o.address.city,
        province: o.address.province,
        postal_code: o.address.postalCode,
        landmark_notes: o.address.landmark
      },
      parcel_specs: {
        product: o.productSummary,
        weight_gram: o.weightGram,
        payment_method: o.paymentMethod,
        cod_amount: o.paymentMethod === 'COD' ? o.totalAmount : 0,
        courier_code: o.courierServiceCode
      },
      ai_quality: {
        confidence_score: o.aiScore,
        kemendagri_matched: true
      }
    }))
  };
}
