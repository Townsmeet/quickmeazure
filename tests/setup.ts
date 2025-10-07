// @vitest-environment nuxt
import { vi, beforeEach, afterAll, beforeAll } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      // Use Object.defineProperty to safely remove the property
      const { [key]: _, ...rest } = store
      store = rest as Record<string, string>
    },
    clear: () => {
      store = {}
    },
  }
})()

// Mock window object
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock global objects
globalThis.$fetch = vi.fn()
globalThis.fetch = vi.fn()

// Mock requestAnimationFrame
window.requestAnimationFrame = vi.fn(callback => {
  return window.setTimeout(callback, 0)
})

window.cancelAnimationFrame = vi.fn(id => {
  clearTimeout(id)
})

// Mock ResizeObserver
class ResizeObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

window.ResizeObserver = ResizeObserverStub

// Mock IntersectionObserver
class IntersectionObserverStub {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

window.IntersectionObserver = IntersectionObserverStub

// Setup test environment
beforeAll(() => {
  const pinia = createPinia()
  setActivePinia(pinia)
})

// Mock Nuxt composables
vi.mock('#imports', () => ({
  defineNuxtComponent: (comp: any) => comp,
  useNuxtApp: () => ({
    $pinia: createPinia(),
    $config: { public: {} },
  }),
  useRuntimeConfig: () => ({
    public: {},
  }),
  useRoute: () => ({}),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
  }),
}))

// Mock Nuxt config
vi.mock('#build/config', () => ({
  sourcemap: {
    server: false,
    client: false,
  },
  vite: {
    build: {
      minify: false,
      cssCodeSplit: false,
    },
    logLevel: 'silent',
  },
  publicRuntimeConfig: {
    siteUrl: 'http://localhost:3000',
  },
  hooks: {
    'vite:extendConfig': vi.fn(),
    'components:extend': vi.fn(),
  },
}))

// Mock Nuxt components
vi.mock('#build/components', () => ({
  NuxtLink: {
    template: '<a :href="to"><slot></slot></a>',
    props: ['to'],
  },
  UButton: {
    template: '<button :class="$attrs.class"><slot></slot></button>',
    props: ['to', 'color', 'size', 'variant'],
  },
  NuxtImg: {
    template: '<img :src="src" :alt="alt" data-testid="dashboard-image" />',
    props: ['src', 'alt', 'placeholder', 'preload'],
  },
}))

// Mock the auth composable
vi.mock('~/composables/useAuth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: ref(false),
    user: ref(null),
    login: vi.fn(),
    logout: vi.fn(),
    init: vi.fn(),
  })),
}))

// Mock other modules
vi.mock('@nuxtjs/sentry', () => ({
  default: vi.fn(),
}))

vi.mock('nuxt-og-image', () => ({
  default: vi.fn(),
}))

vi.mock('@nuxtjs/device', () => ({
  default: vi.fn(),
}))

vi.mock('@pinia/nuxt', () => ({
  defineNuxtPlugin: vi.fn(),
  createPinia: vi.fn(),
}))

// Setup before each test
beforeEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear()
  window.localStorage = localStorageMock

  // Reset Pinia state
  const pinia = createPinia()
  setActivePinia(pinia)

  // Reset fetch mocks
  globalThis.fetch = vi.fn()
  globalThis.$fetch = vi.fn()
})

// Cleanup after all tests
afterAll(() => {
  vi.clearAllMocks()
  vi.resetAllMocks()
  vi.restoreAllMocks()
})
