export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PlatformRole = 'SUPERADMIN' | 'SUPPORT_AGENT';
export type OrgMemberRole = 'ADMIN' | 'MANAGER' | 'FINANCE' | 'STAFF';
export type EventStaffRole = 'DOOR_STAFF' | 'BAR_STAFF' | 'SUPERVISOR';
export type EventStatus = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'FINISHED' | 'CANCELLED';
export type DiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type OrderType = 'TICKETING' | 'BAR';
export type OrderStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
export type PaymentProvider = 'MERCADO_PAGO' | 'STRIPE' | 'MANUAL_CASH';
export type PaymentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROCESS' | 'REFUNDED';
export type TicketStatus = 'ISSUED' | 'USED' | 'TRANSFERRED' | 'CANCELLED' | 'REFUNDED';
export type ScanResult = 'ALLOWED' | 'ALREADY_USED' | 'INVALID_EVENT' | 'CANCELLED' | 'SUSPECTED_FRAUD';
export type CommissionType = 'PERCENTAGE' | 'FIXED_PER_TICKET';
export type PayoutStatus = 'PENDING' | 'APPROVED' | 'PAID';
export type BarProductCategory = 'TRAGOS' | 'CERVEZAS' | 'SIN_ALCOHOL' | 'VIP_BOTELLAS' | 'OTROS';
export type BarOrderStatus = 'RECEIVED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
export type AuditAction = 
  | 'PRICE_CHANGED' 
  | 'GUESTLIST_ISSUED' 
  | 'REFUND_PROCESSED' 
  | 'STOCK_ADJUSTED' 
  | 'PERMISSIONS_MODIFIED' 
  | 'MANUAL_CHECKIN' 
  | 'ROLE_ASSIGNED';

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  dni_or_tax_id?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  legal_name?: string | null;
  tax_id?: string | null;
  branding: {
    primary_color?: string;
    accent_color?: string;
    logo_url?: string;
  };
  currency: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  organization_id: string;
  title: string;
  slug: string;
  description?: string | null;
  venue_name: string;
  venue_address: string;
  start_time: string;
  end_time: string;
  status: EventStatus;
  cover_image_url?: string | null;
  max_capacity: number;
  created_at: string;
  updated_at: string;
}

export interface TicketType {
  id: string;
  organization_id: string;
  event_id: string;
  name: string;
  description?: string | null;
  price: number;
  service_fee: number;
  total_quota: number;
  available_quota: number;
  max_per_order: number;
  sale_start_time: string;
  sale_end_time: string;
  is_visible: boolean;
  is_guestlist: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  organization_id: string;
  user_id: string;
  event_id: string;
  order_number: string;
  order_type: OrderType;
  status: OrderStatus;
  subtotal_amount: number;
  discount_amount: number;
  service_fee_amount: number;
  total_amount: number;
  currency: string;
  discount_coupon_id?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IssuedTicket {
  id: string;
  organization_id: string;
  event_id: string;
  ticket_type_id: string;
  order_id: string;
  order_item_id: string;
  owner_user_id: string;
  ticket_code: string;
  qr_hash: string;
  attendee_first_name: string;
  attendee_last_name: string;
  attendee_dni: string;
  status: TicketStatus;
  is_courtesy: boolean;
  transferred_from_ticket_id?: string | null;
  created_at: string;
  updated_at: string;
}