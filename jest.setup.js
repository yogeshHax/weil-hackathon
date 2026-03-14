import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Firebase
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: null,
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
  })),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
}))

jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
  getAnalytics: jest.fn(() => ({})),
}))

// Mock fetch for API calls
global.fetch = jest.fn()

// Setup and cleanup for each test
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks()
  
  // Reset fetch mock
  if (global.fetch) {
    global.fetch.mockClear()
  }
})

afterEach(() => {
  // Cleanup after each test
  jest.restoreAllMocks()
})
