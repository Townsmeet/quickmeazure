import { ref } from 'vue'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

export function useApi() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function request<T>(
    url: string,
    opts?: (RequestInit & { query?: any; method?: HttpMethod }) | undefined
  ) {
    loading.value = true
    error.value = null
    try {
      const res = await $fetch<T>(url, {
        method: (opts?.method as HttpMethod) || 'GET',
        body: opts?.body as any,
        query: opts?.query,
        headers: opts?.headers,
      })
      return res
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Request failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  return { request, loading, error }
}
