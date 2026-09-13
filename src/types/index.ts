export type PlaybackStatus = 'PLAYING' | 'PAUSED';

export type AppRole = 'landing' | 'operator' | 'player' | 'split' | 'guest' | 'pos' | 'kitchen';

export interface Song {
  id: string;
  videoId: string;
  requester: string;
  tableNumber?: string;
  source?: 'guest' | 'operator';
  title: string;
  url: string;
  duration?: string;
  thumbnail?: string;
  addedAt?: number;
}

export interface SongHistoryItem {
  id: string;
  videoId: string;
  requester: string;
  tableNumber?: string;
  title: string;
  url: string;
  playedAt: number;
  thumbnail?: string;
}

export interface SavedLibrarySong {
  videoId: string;
  title: string;
  artist?: string;
  thumbnail?: string;
  url: string;
  playCount: number;
  lastPlayedAt: number;
}

export interface Voucher {
  code: string;
  tableNumber: string;
  quotaTotal: number;
  quotaUsed: number;
  createdAt: number;
  status: 'active' | 'exhausted' | 'expired';
}

export interface DailyPinConfig {
  enabled: boolean;
  code: string;
}

export interface LiveReactionEvent {
  id: string;
  emoji: string;
  tableNumber: string;
  timestamp: number;
}

export type SoundEffectType = 'applause' | 'airhorn' | 'cheer' | 'drumroll' | 'chime';

export interface SoundEffectEvent {
  type: SoundEffectType;
  timestamp: number;
}

export interface CafeSettings {
  name: string;
  tagline?: string;
  welcomeMessage?: string;
  wifiName?: string;
  wifiPassword?: string;
  youtubeApiKey?: string;
  enableTax?: boolean;
  taxPercentage?: number;
  isTaxIncluded?: boolean;
  servicePercentage?: number;
  posPassword?: string;
  operatorPassword?: string;
  localServerIp?: string;
  qrisImageUrl?: string;
  qrisMerchantName?: string;
  danaPhoneNumber?: string;
}

export interface YouTubeSearchResult {
  videoId: string;
  title: string;
  channelTitle?: string;
  thumbnail: string;
}

export type MenuCategory =
  | 'KOPI'
  | 'NON_KOPI'
  | 'MAKANAN'
  | 'SNACK'
  | 'PAKET'
  | 'Kopi'
  | 'Minuman'
  | 'Makanan'
  | 'Snack'
  | 'Paket';

export interface MenuItemOption {
  name: string;
  extraPrice?: number;
}

export interface MenuItemOptionGroup {
  title: string;
  type?: 'single' | 'multiple';
  required?: boolean;
  options: MenuItemOption[];
}

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  description?: string;
  image?: string;
  imageUrl?: string;
  isAvailable: boolean;
  isBestSeller?: boolean;
  isPromo?: boolean;
  optionGroups?: MenuItemOptionGroup[];
}

export interface OrderItem {
  menuId?: string;
  menuItemId?: string;
  name: string;
  price: number;
  qty?: number;
  quantity?: number;
  notes?: string;
  isVoided?: boolean;
  voidReason?: string;
  selectedOptions?: string[];
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'cooking'
  | 'ready'
  | 'served'
  | 'completed'
  | 'paid'
  | 'cancelled'
  | 'PENDING'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'COOKING'
  | 'READY'
  | 'SERVED'
  | 'COMPLETED'
  | 'PAID'
  | 'CANCELLED';

export type OrderType = 'DINE_IN' | 'TAKEAWAY' | 'ONLINE_DELIVERY';
export type DeliveryPlatform = 'GOFOOD' | 'GRABFOOD' | 'SHOPEEFOOD' | 'WA_DELIVERY' | 'OTHER';

export interface TableOrder {
  id: string;
  orderNumber?: string;
  tableNumber: string;
  customerName: string;
  items: OrderItem[];
  totalAmount: number;
  subtotal?: number;
  taxAmount?: number;
  serviceAmount?: number;
  roundingAmount?: number;
  status: OrderStatus;
  createdAt: number;
  paidAt?: number;
  paymentMethod?: 'cash' | 'qris' | 'transfer' | 'debit' | 'TUNAI' | 'QRIS' | 'TRANSFER' | 'DEBIT' | 'ONLINE_MERCHANT' | 'online_merchant';
  cancelReason?: string;
  tableMoveHistory?: { from: string; to: string; movedAt: number }[];
  orderType?: OrderType;
  platform?: DeliveryPlatform;
}

export type ExpenseCategory =
  | 'BAHAN_BAKU'
  | 'OPERASIONAL'
  | 'GAJI_KASBON'
  | 'MAINTENANCE'
  | 'LAINNYA';

export interface ExpenseItem {
  id: string;
  category: ExpenseCategory;
  title: string;
  amount: number;
  notes?: string;
  recordedBy: string;
  createdAt: number;
  paymentSource: 'CASH_DRAWER' | 'BANK_TRANSFER';
}

export interface KaraokeState {
  queue: Song[];
  playbackStatus: PlaybackStatus;
  volume: number;
  isMuted?: boolean;
  forceSkip: number;
  runningText?: string;
  soundEffect?: SoundEffectEvent | null;
  history?: SongHistoryItem[];
  songLibrary?: Record<string, SavedLibrarySong>;
  vouchers?: Record<string, Voucher>;
  dailyPin?: DailyPinConfig;
  liveReaction?: LiveReactionEvent | null;
  fairRotationEnabled?: boolean;
  cafeSettings?: CafeSettings;
  tables?: string[];
  autoSaveLibrary?: boolean;
  menuItems?: Record<string, MenuItem>;
  tableOrders?: Record<string, TableOrder>;
  expenses?: Record<string, ExpenseItem>;
}

export interface SyncMessage<T> {
  key: string;
  value: T;
}

export interface PopularPresetSong {
  title: string;
  artist: string;
  videoId: string;
  category: string;
}


// Global declaration for YouTube Iframe API
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}
