import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DesktopNavBar } from './DesktopNavBar'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <DesktopNavBar />
    </MemoryRouter>,
  )
}

it('renders brand and primary nav links', () => {
  renderAt('/')
  expect(screen.getByRole('link', { name: 'Sävellajit' })).toHaveAttribute('href', '/')
  expect(screen.getByRole('link', { name: 'Moodit' })).toHaveAttribute('href', '/moodit')
  expect(screen.getByRole('link', { name: 'Harjoittelu' })).toHaveAttribute('href', '/harjoittelu')
})

it('marks the active route with aria-current=page, including sub-routes', () => {
  renderAt('/harjoittelu/tietoa')
  expect(screen.getByRole('link', { name: 'Harjoittelu' })).toHaveAttribute('aria-current', 'page')
  expect(screen.getByRole('link', { name: 'Moodit' })).not.toHaveAttribute('aria-current')
})
