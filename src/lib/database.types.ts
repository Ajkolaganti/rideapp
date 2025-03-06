export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      drivers: {
        Row: {
          id: string
          name: string
          contact: string
          car_model: string
          rides_offered: number
          is_subscribed: boolean
          is_on_ride: boolean
          created_at: string
        }
        Insert: {
          id: string
          name: string
          contact: string
          car_model: string
          rides_offered?: number
          is_subscribed?: boolean
          is_on_ride?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact?: string
          car_model?: string
          rides_offered?: number
          is_subscribed?: boolean
          is_on_ride?: boolean
          created_at?: string
        }
      }
      availability: {
        Row: {
          id: string
          driver_id: string
          from_area: string
          to_area: string
          date: string
          start_time: string
          end_time: string
          created_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          from_area: string
          to_area: string
          date: string
          start_time: string
          end_time: string
          created_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          from_area?: string
          to_area?: string
          date?: string
          start_time?: string
          end_time?: string
          created_at?: string
        }
      }
      discounts: {
        Row: {
          id: string
          driver_id: string
          enabled: boolean
          percentage: number
          created_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          enabled?: boolean
          percentage?: number
          created_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          enabled?: boolean
          percentage?: number
          created_at?: string
        }
      }
    }
  }
} 