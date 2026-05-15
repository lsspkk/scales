import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { Harjoittelu } from './Harjoittelu'
import { HarjoitteluTietoa } from './HarjoitteluTietoa'

vi.mock('../lib/useViewport', () => ({
  useViewport: () => ({ isDesktop: false }),
}))

it('renders the Harjoittelu screen with practice content and an info action in the header', () => {
  render(
    <MemoryRouter>
      <Harjoittelu />
    </MemoryRouter>,
  )
  expect(screen.getByText('Harjoittelu')).toBeInTheDocument()
  expect(screen.getByText('Valitse taitotaso')).toBeInTheDocument()
  expect(screen.getByText('Aloita harjoittelu')).toBeInTheDocument()
  expect(screen.getByLabelText('Tietoa harjoittelusta')).toBeInTheDocument()
  expect(screen.queryByText('Tietoa')).not.toBeInTheDocument()
})

it('renders the HarjoitteluTietoa screen with method, levels, and sources', () => {
  render(
    <MemoryRouter>
      <HarjoitteluTietoa />
    </MemoryRouter>,
  )
  expect(screen.getByText('Tietoa harjoittelusta')).toBeInTheDocument()
  expect(screen.getByText('Harjoitusmenetelmä')).toBeInTheDocument()
  expect(screen.getAllByText(/Flesch/i).length).toBeGreaterThan(0)
  expect(screen.getByText('Lähteet')).toBeInTheDocument()
})
