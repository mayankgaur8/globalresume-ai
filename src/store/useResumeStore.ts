import { create } from "zustand"

export type ResumeData = {
  id?: string
  title: string
  language: string
  template: string
  targetCountry: string
  contact: {
    firstName: string
    lastName: string
    email: string
    phone: string
    address: string
    city: string
    country: string
    linkedin: string
    website: string
  }
  summary: string
  experience: Array<{
    id: string
    company: string
    position: string
    startDate: string
    endDate: string
    current: boolean
    description: string
  }>
  education: Array<{
    id: string
    institution: string
    degree: string
    field: string
    startDate: string
    endDate: string
  }>
  skills: Array<{ id: string; name: string; level: string }>
}

const initialData: ResumeData = {
  title: "Untitled Resume",
  language: "en",
  template: "modern",
  targetCountry: "US",
  contact: {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    linkedin: "",
    website: "",
  },
  summary: "",
  experience: [],
  education: [],
  skills: [],
}

type ResumeStore = {
  data: ResumeData
  setData: (data: Partial<ResumeData>) => void
  updateContact: (contact: Partial<ResumeData["contact"]>) => void
  addExperience: (exp: ResumeData["experience"][0]) => void
  updateExperience: (id: string, exp: Partial<ResumeData["experience"][0]>) => void
  removeExperience: (id: string) => void
  reset: () => void
}

export const useResumeStore = create<ResumeStore>()((set) => ({
  data: initialData,
  setData: (newData) => set((state) => ({ data: { ...state.data, ...newData } })),
  updateContact: (newContact) =>
    set((state) => ({
      data: { ...state.data, contact: { ...state.data.contact, ...newContact } },
    })),
  addExperience: (exp) =>
    set((state) => ({
      data: { ...state.data, experience: [...state.data.experience, exp] },
    })),
  updateExperience: (id, exp) =>
    set((state) => ({
      data: {
        ...state.data,
        experience: state.data.experience.map((e) => (e.id === id ? { ...e, ...exp } : e)),
      },
    })),
  removeExperience: (id) =>
    set((state) => ({
      data: { ...state.data, experience: state.data.experience.filter((e) => e.id !== id) },
    })),
  reset: () => set({ data: initialData }),
}))
