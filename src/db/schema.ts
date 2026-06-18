/**
 * Kuroten Stay Sapporo — データベーススキーマ
 * Cloudflare D1（SQLite互換）用
 *
 * D1はSQLiteベースのため、PostgreSQL ENUMの代わりに TEXT + CHECK 制約を使用
 * 実際のテーブル作成はマイグレーションSQL（migrations/）で行う
 */

// ============================================================
// 型定義（D1/SQLite用 — TypeScriptインターフェース）
// ============================================================

export type UserRole      = 'guest' | 'owner'
export type BookingStatus = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
export type ContactStatus = 'new' | 'in_progress' | 'resolved' | 'closed'
export type ContactCategory = 'booking_inquiry' | 'cancellation' | 'facility' | 'access' | 'other'

export interface User {
  id:          string    // UUID (TEXT in SQLite)
  email:       string
  password:    string
  firstName:   string | null
  lastName:    string | null
  phone:       string | null
  nationality: string | null
  role:        UserRole
  isActive:    number    // SQLite BOOLEAN = INTEGER (0/1)
  lastLoginAt: string | null
  createdAt:   string
  updatedAt:   string
}

export interface Property {
  id:            string
  slug:          string  // 'sun'|'moon'|'smile'|'sky'
  nameJa:        string
  nameEn:        string | null
  descriptionJa: string | null
  descriptionEn: string | null
  maxGuests:     number
  bedrooms:      number
  beds:          number
  bathrooms:     number
  pricePerNight: number
  cleaningFee:   number
  addressJa:     string | null
  addressEn:     string | null
  checkInTime:   string | null
  checkOutTime:  string | null
  isActive:      number
  createdAt:     string
  updatedAt:     string
}

export interface Booking {
  id:            string
  bookingCode:   string
  userId:        string | null
  propertyId:    string
  propertySlug:  string | null
  guestName:     string
  guestEmail:    string
  guestPhone:    string | null
  checkinDate:   string
  checkoutDate:  string
  nights:        number
  guestCount:    number
  adultCount:    number
  childCount:    number
  infantCount:   number
  pricePerNight: number
  cleaningFee:   number
  totalPrice:    number
  status:        BookingStatus
  guestNote:     string | null
  adminNote:     string | null
  createdAt:     string
  updatedAt:     string
}

export interface Contact {
  id:           string
  name:         string
  email:        string
  phone:        string | null
  category:     ContactCategory
  subject:      string
  message:      string
  propertySlug: string | null
  status:       ContactStatus
  replyMessage: string | null
  repliedAt:    string | null
  createdAt:    string
  updatedAt:    string
}

export interface RefreshToken {
  id:        string
  userId:    string
  token:     string
  expiresAt: string
  createdAt: string
}
