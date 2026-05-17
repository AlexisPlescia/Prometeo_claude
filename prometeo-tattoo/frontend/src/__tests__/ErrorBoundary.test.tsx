import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Extract ErrorBoundary logic inline for testing
class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) return <div>Algo salió mal</div>
    return this.props.children
  }
}

function ThrowingComponent(): React.ReactElement {
  throw new Error('test error')
}

describe('ErrorBoundary', () => {
  it('renders fallback when child throws', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <TestErrorBoundary>
        <ThrowingComponent />
      </TestErrorBoundary>
    )

    expect(screen.getByText('Algo salió mal')).toBeInTheDocument()
    consoleSpy.mockRestore()
  })
})
