import { create } from 'zustand'
import { User, Order, Table } from '@/types'
import { ApiError, loginWaiterWithPin } from '@/api/admin'

interface State {
  user: User | null
  authToken: string | null
  activeOrders: Order[]
  tables: Table[]
  isAuthenticated: boolean
  
  // User actions
  setUser: (user: User | null) => void
  login: (pin: string) => Promise<boolean>
  logout: () => void
  
  // Orders actions
  setActiveOrders: (orders: Order[]) => void
  addOrder: (order: Order) => void
  updateOrder: (orderId: string, updates: Partial<Order>) => void
  removeOrder: (orderId: string) => void
  
  // Tables actions
  setTables: (tables: Table[]) => void
  updateTableStatus: (tableId: string, status: Table['status']) => void
  assignOrderToTable: (tableId: string, orderId: string) => void
}

export const useStore = create<State>((set, get) => ({
  user: null,
  authToken: null,
  activeOrders: [],
  tables: [],
  isAuthenticated: false,
  
  // User actions
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user 
  }),
  
  login: async (pin: string) => {
    try {
      const { token, user } = await loginWaiterWithPin(pin)
      set({ user, authToken: token, isAuthenticated: true })
      return true
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        return false
      }

      throw error
    }
  },
  
  logout: () => {
    set({ user: null, authToken: null, isAuthenticated: false, activeOrders: [] })
  },
  
  // Orders actions
  setActiveOrders: (orders) => set({ activeOrders: orders }),
  addOrder: (order) => set((state) => ({ 
    activeOrders: [...state.activeOrders, order] 
  })),
  updateOrder: (orderId, updates) => set((state) => ({
    activeOrders: state.activeOrders.map(order => 
      order.id === orderId ? { ...order, ...updates } : order
    )
  })),
  removeOrder: (orderId) => set((state) => ({
    activeOrders: state.activeOrders.filter(order => order.id !== orderId)
  })),
  
  // Tables actions
  setTables: (tables) => set({ tables }),
  updateTableStatus: (tableId, status) => set((state) => ({
    tables: state.tables.map(table => 
      table.id === tableId ? { ...table, status } : table
    )
  })),
  assignOrderToTable: (tableId, orderId) => set((state) => ({
    tables: state.tables.map(table => 
      table.id === tableId ? { ...table, currentOrderId: orderId } : table
    )
  }))
}))
