import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  skuId: number;
  productId: number;
  productName: string;
  productImage?: string | null;
  colour: string;
  sizeEu: number;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (skuId: number) => void;
  updateQuantity: (skuId: number, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.skuId === item.skuId);
        if (existing) {
          return {
            items: state.items.map(i => 
              i.skuId === item.skuId 
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            )
          };
        }
        return { items: [...state.items, item] };
      }),
      removeItem: (skuId) => set((state) => ({
        items: state.items.filter(i => i.skuId !== skuId)
      })),
      updateQuantity: (skuId, quantity) => set((state) => ({
        items: state.items.map(i => i.skuId === skuId ? { ...i, quantity } : i)
      })),
      clearCart: () => set({ items: [] }),
      getSubtotal: () => {
        const items = get().items;
        return items.reduce((total, item) => total + (item.price * item.quantity), 0);
      }
    }),
    {
      name: 'solehr_cart',
    }
  )
);

interface AuthState {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      logout: () => set({ token: null })
    }),
    {
      name: 'solehr_auth',
    }
  )
);
