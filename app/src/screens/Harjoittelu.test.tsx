import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { Harjoittelu } from './Harjoittelu'

vi.mock('../lib/useViewport', () => ({
  useViewport: () => ({ isDesktop: false }),
}))

it('renders the Harjoittelu screen with tabs', () => {
  render(
    <MemoryRouter>
      <Harjoittelu />
    </MemoryRouter>,
  )
  expect(screen.getByText('Harjoittelu')).toBeInTheDocument()
  expect(screen.getByText('Tietoa')).toBeInTheDocument()
  expect(screen.getByText('Harjoittele')).toBeInTheDocument()
})

it('shows info tab content when Tietoa is clicked', () => {
  render(
    <MemoryRouter>
      <Harjoittelu />
    </MemoryRouter>,
  )
  fireEvent.click(screen.getByText('Tietoa'))
  expect(screen.getByText('Harjoitusmenetelmä')).toBeInTheDocument()
  expect(screen.getAllByText(/Flesch/i).length).toBeGreaterThan(0)
  expect(screen.getByText('Lähteet')).toBeInTheDocument()
})

it('shows practice tab with level selector by default', () => {
  render(
    <MemoryRouter>
      <Harjoittelu />
    </MemoryRouter>,
  )
  expect(screen.getByText('Valitse taitotaso')).toBeInTheDocument()
  expect(screen.getByText('Aloita harjoittelu')).toBeInTheDocument()
})
