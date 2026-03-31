import { create } from 'zustand'
import type {
  ManuscriptCategory,
  MaterialSettings,
  AppealPoint,
  PersonaSlots,
  PersonaVariables,
  ImageSettings,
} from '@/types/manuscript'

export interface GenerateSettings {
  brandId: string
  category: ManuscriptCategory | ''
  typeId: string
  material: MaterialSettings
  appealPoint: AppealPoint | ''
  titleSettings: {
    structureId: string
    badaPosition: 'front' | 'middle' | 'back' | 'auto'
    charCount: 'short' | 'mid' | 'long'
  }
  persona: PersonaSlots
  personaMode: 'direct' | 'random'
  variables: PersonaVariables
  wordCount: { min: number; max: number }
  imageSettings: ImageSettings
}

export interface BatchResult {
  id: string
  title: string
  status: 'generating' | 'reviewing' | 'pass' | 'retry' | 'needs_user' | 'fail'
  detail?: string
}

interface GenerateState {
  step: number
  settings: GenerateSettings
  manuscriptId: string | null
  isGenerating: boolean

  // 배치 결과 (탭 이동해도 유지)
  lastBatchResults: BatchResult[]
  lastBatchTime: string | null

  setStep: (step: number) => void
  updateSettings: (partial: Partial<GenerateSettings>) => void
  setManuscriptId: (id: string) => void
  setGenerating: (v: boolean) => void
  setLastBatch: (results: BatchResult[]) => void
  reset: () => void
}

const defaultSettings: GenerateSettings = {
  brandId: '',
  category: '',
  typeId: '',
  material: { mode: 'auto' },
  appealPoint: '',
  titleSettings: {
    structureId: '',
    badaPosition: 'auto',
    charCount: 'mid',
  },
  persona: {},
  personaMode: 'random',
  variables: { var7: 'long' },
  wordCount: { min: 1500, max: 2500 },
  imageSettings: {
    count: 8,
    types: [],
    selectionMode: 'random',
  },
}

export const useGenerateStore = create<GenerateState>((set) => ({
  step: 0,
  settings: defaultSettings,
  manuscriptId: null,
  isGenerating: false,
  lastBatchResults: [],
  lastBatchTime: null,

  setStep: (step) => set({ step }),
  updateSettings: (partial) =>
    set((state) => ({
      settings: { ...state.settings, ...partial },
    })),
  setManuscriptId: (id) => set({ manuscriptId: id }),
  setGenerating: (v) => set({ isGenerating: v }),
  setLastBatch: (results) => set({ lastBatchResults: results, lastBatchTime: new Date().toISOString() }),
  reset: () =>
    set({ step: 0, settings: defaultSettings, manuscriptId: null, isGenerating: false }),
}))
