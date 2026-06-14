export interface User {
  id: string
  name: string
  role: 'waiter' | 'admin'
  pin?: string
}

export interface Table {
  id: string
  number: number
  status: 'available' | 'occupied' | 'needs_payment'
  currentOrderId?: string
}

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  category: string
  imageUrl?: string
  isAvailable: boolean
}

export interface OrderItem {
  id: string
  menuItemId: string
  quantity: number
  specialInstructions?: string
  name: string
  price: number
}

export interface Order {
  id: string
  tableId: string
  items: OrderItem[]
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'paid'
  total: number
  createdAt: string
  updatedAt: string
}

export interface PaymentInfo {
  orderId: string
  amount: number
  tip?: number
  total: number
  paymentMethod: 'cash' | 'card' | 'mobile'
  status: 'pending' | 'processing' | 'completed' | 'failed'
}

export interface Notification {
  id: string
  title: string
  body: string
  data?: Record<string, any>
  timestamp: string
  read: boolean
}