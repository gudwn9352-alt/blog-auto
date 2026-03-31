import { create } from 'zustand'
import type { Brand } from '@/types/manuscript'

interface BrandState {
  selectedBrand: Brand | null
  selectBrand: (brand: Brand) => void
  clearBrand: () => void
}

export const useBrandStore = create<BrandState>((set) => ({
  selectedBrand: null,
  selectBrand: (brand) => set({ selectedBrand: brand }),
  clearBrand: () => set({ selectedBrand: null }),
}))
