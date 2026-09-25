export type OrderStatus =
  | 'siap'
  | 'perlu_review'
  | 'menunggu_respon'
  | 'dikonfirmasi'
  | 'dikoreksi'
  | 'terekspor'
  | 'dibatalkan';

export type PaymentMethod = 'COD' | 'TF' | 'Transfer';

export type CourierService =
  | 'J&T Express'
  | 'SiCepat'
  | 'JNE Express'
  | 'Lion Parcel'
  | 'Anteraja'
  | 'Ninja Van';

export interface AddressComponents {
  streetAndNumber: string;
  rtRw: string;
  kelurahan: string;
  kecamatan: string;
  city: string;
  province: string;
  postalCode: string;
  landmark: string;
}

export interface MengantarValidationResult {
  isCovered: boolean;
  coverageStatus: 'FULL_COD_COVERAGE' | 'PARTIAL_COD' | 'NON_COD_REMOTE' | 'UNMAPPED';
  supportedCouriers: string[];
  bestCourier: string;
  estimatedShippingFee: number;
  codFeePercent: number;
  codFeeAmount: number;
  historicalReturnRate: number;
  riskLevel: 'LOW_RISK' | 'MEDIUM_RISK' | 'HIGH_RISK';
  subdistrictId: string;
  validatedAt: string;
  notes: string;
}

export interface MengantarApiConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
  connected: boolean;
  webhookUrl: string;
  autoValidate: boolean;
  codFeeRule: 'standard' | 'flat';
  selectedDefaultCourier: string;
}

export interface ProductItem {
  id: string;
  name: string;
  variant?: string;
  qty: number;
  price: number;
  weightGram?: number;
}

export interface OrderItem {
  id: string;
  orderNumber: string; // e.g. #ORD-20260924-042 or #KR-10984
  time: string; // e.g. '14:28 WIB'
  customerName: string;
  phone: string; // e.g. '081288991201' or '+6281288991201'
  productSummary: string; // e.g. 'Gamis Mutiara Lilac (XL) x 2, Pashmina Ceruty Navy x 1'
  items?: ProductItem[];
  itemCount: number;
  totalAmount: number; // e.g. 425000
  paymentMethod: PaymentMethod;
  paymentLabel?: string; // e.g. 'COD (Tunai)', 'TF BCA', 'TF Mandiri'
  courier: CourierService;
  courierServiceCode: string; // e.g. 'J&T EZ', 'SiCepat REG', 'JNE REG'
  weightGram: number; // e.g. 1000
  weightKg: number; // e.g. 1.0
  inputSource: 'AI Chat' | 'Manual' | 'Form';
  rawChatText: string;
  address: AddressComponents;
  aiScore: number; // 0 to 100
  validationStatus: OrderStatus;
  validationTagLabel: string; // e.g. 'Siap Kirim', 'Perlu Konfirmasi', 'Normalisasi Valid', 'Koreksi Kodepos CS'
  validationNote?: string;
  waSent: boolean;
  exported: boolean;
  exportDate?: string;
  customerAvatarText?: string;
  productImage?: string;
  mengantarValidation?: MengantarValidationResult;
  mengantarBookingId?: string;
}

export interface ExportHistoryItem {
  id: string;
  fileName: string;
  orderCount: number;
  downloadTime: string;
  downloadBy: string;
  checksum: string;
  status: 'Telah diserahkan ke kurir' | 'Siap Pick-up' | 'Dalam Proses' | 'API Terkirim';
  courier: CourierService | 'Mengantar API';
}

export interface SystemLogItem {
  id: string;
  timestamp: string;
  type: 'parser' | 'wa' | 'export' | 'system' | 'edit' | 'mengantar';
  title: string;
  detail: string;
  user: string;
  badge?: string;
}

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  variants: string[];
  price: number;
  weightGram: number;
  stock: number;
  isActive: boolean;
  description?: string;
  image?: string;
}
