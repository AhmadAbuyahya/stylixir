export function useUrlStore() {
  const isClient = ref(false)
  onMounted(() => {
    isClient.value = true
  })

  const hashParams = useUrlSearchParams('hash', {
    write: false,
  })
  const queryParams = useUrlSearchParams('history', {
    write: false,
  })

  // Helper function to get param value from either hash or query
  const getParam = (key: string) => {
    if (!isClient.value)
      return undefined
    return hashParams[key] || queryParams[key]
  }

  // Helper function to set param value in both hash and query
  const setParam = (key: string, value: string) => {
    if (!isClient.value)
      return
    hashParams[key] = value
    queryParams[key] = value
  }

  // Helper function to delete param from both hash and query
  const deleteParam = (key: string) => {
    if (!isClient.value)
      return
    delete hashParams[key]
    delete queryParams[key]
  }

  // Debounced URL update function
  const updateUrlParams = useDebounceFn((updates: Record<string, string | number>) => {
    if (!isClient.value)
      return

    Object.entries(updates).forEach(([key, value]) => {
      setParam(key, String(value))
    })
  }, 300)

  return {
    getParam,
    setParam,
    deleteParam,
    updateUrlParams,
    isClient,
    hashParams,
    queryParams,
  }
}
