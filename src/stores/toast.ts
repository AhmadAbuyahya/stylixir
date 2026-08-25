import { acceptHMRUpdate, defineStore } from 'pinia'
import type { Toast } from '~/types'

const MAX_TOASTS = 3

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<Toast[]>([])

  function addToast(toast: Omit<Toast, 'id'> & { id?: number }) {
    const next: Toast = {
      id: toast.id ?? Date.now() + Math.floor(Math.random() * 1000),
      title: toast.title,
      variant: toast.variant,
    }

    toasts.value.push(next)
    if (toasts.value.length > MAX_TOASTS)
      toasts.value.splice(0, toasts.value.length - MAX_TOASTS)
  }

  function clearToast(id: number) {
    const index = toasts.value.findIndex(toast => toast.id === id)
    if (index !== -1)
      toasts.value.splice(index, 1)
  }

  return {
    toasts,
    addToast,
    clearToast,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useToastStore as any, import.meta.hot))
