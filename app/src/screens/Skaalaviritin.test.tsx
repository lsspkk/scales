import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { Skaalaviritin } from './Skaalaviritin'

vi.mock('../lib/useViewport', () => ({
  useViewport: () => ({ isDesktop: false }),
}))

it('renders the Skaalaviritin screen with the listen button, level info, and entry points', () => {
  render(
    <MemoryRouter initialEntries={['/skaalaviritin?root=C&mode=ionian&octaves=2&level=1']}>
      <Skaalaviritin />
    </MemoryRouter>,
  )
  expect(screen.getByText('Skaalaviritin')).toBeInTheDocument()
  expect(screen.getByText('Aloita')).toBeInTheDocument()
  // Level-info one-liner starts at Taso 1.
  expect(screen.getByText(/Taso 1\./)).toBeInTheDocument()
  expect(screen.getByLabelText('Mittausnopeus')).toBeInTheDocument()
})
