// @vitest-environment nuxt
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import HeroSection from '~/components/HeroSection.vue'

// Mock the auth composable
const mockAuth = {
  isAuthenticated: ref(false),
  user: ref(null),
  login: vi.fn(),
  logout: vi.fn(),
  init: vi.fn(),
}

vi.mock('~/composables/useAuth', () => ({
  useAuth: vi.fn(() => mockAuth),
}))

describe('HeroSection', () => {
  const mountComponent = (isAuthenticated = false) => {
    // Set auth state
    mockAuth.isAuthenticated.value = isAuthenticated
    mockAuth.user.value = isAuthenticated
      ? {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
          subscriptionPlan: 'free',
          subscriptionExpiry: null,
        }
      : null

    return mount(HeroSection, {
      global: {
        stubs: {
          UButton: {
            template: '<a :href="to" v-bind="$attrs"><slot></slot></a>',
            props: ['to', 'color', 'size', 'variant'],
          },
          NuxtImg: {
            template: '<img v-bind="$attrs">',
            props: ['src', 'alt', 'placeholder', 'preload'],
          },
        },
      },
    })
  }

  // Reset mocks before each test
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders the hero section with correct heading and subheading', () => {
    const wrapper = mountComponent()

    const heading = wrapper.find('h1')
    expect(heading.text()).toContain('Manage Your Tailoring Business')
    expect(heading.text()).toContain('Efficiently')

    const subheading = wrapper.find('p')
    expect(subheading.text()).toContain(
      'QuickMeazure helps you track clients, measurements, orders, and more - all in one place.'
    )
  })

  test('shows get started button when user is not authenticated', () => {
    const wrapper = mountComponent(false)

    // Check for the router link to register
    const routerLink = wrapper.find('routerlink[to="/auth/register"]')
    expect(routerLink.exists()).toBe(true)

    // Check that the rendered output contains the register link
    const html = wrapper.html()
    expect(html).toContain('/auth/register')

    // Verify dashboard button is not shown
    expect(html).not.toContain('/dashboard')
  })

  test('shows dashboard button when user is authenticated', () => {
    const wrapper = mountComponent(true)

    // Check for the router link to dashboard
    const routerLink = wrapper.find('routerlink[to="/dashboard"]')
    expect(routerLink.exists()).toBe(true)

    // Check that the rendered output contains the dashboard link
    const html = wrapper.html()
    expect(html).toContain('/dashboard')

    // Verify get started button is not shown
    expect(html).not.toContain('Get Started Free')
    expect(html).not.toContain('/auth/register')
  })

  test('shows learn more button in both authenticated and unauthenticated states', () => {
    // Test unauthenticated state
    let wrapper = mountComponent(false)
    const html = wrapper.html()

    // Check that the Learn More button is in the rendered HTML
    expect(html).toContain('Learn More')
    expect(html).toContain('#features')

    // Test authenticated state
    wrapper = mountComponent(true)
    const authedHtml = wrapper.html()

    // Check that the Learn More button is still in the rendered HTML
    expect(authedHtml).toContain('Learn More')
    expect(authedHtml).toContain('#features')
  })

  test('renders the dashboard image with correct styling', () => {
    const wrapper = mountComponent()

    // Check that the component renders an image
    const image = wrapper.find('img')
    expect(image.exists()).toBe(true)

    // Check the image has the correct classes for styling
    expect(image.classes()).toContain('w-full')
    expect(image.classes()).toContain('h-auto')
    expect(image.classes()).toContain('mt-8')
  })
})
