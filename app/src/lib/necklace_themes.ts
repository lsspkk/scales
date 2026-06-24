/**
 * necklace_themes.ts — curated necklace looks chosen with the theme generator.
 *
 * These are the hand-picked colour + shape combinations the game can offer, kept apart
 * from the engine in `necklace.ts` so tuning the *look library* never touches the
 * drawing code. Each entry is exactly what `createNecklace` consumes: a backdrop/metal
 * `themeId`, one hue per gem (`palette`), and one shape per gem (`forms`).
 *
 * Workflow: open `#/test/themes`, tick the necklaces you like, press **Vie** (export),
 * then paste the generated entries into the array below.
 */
import type { GemForm, ThemeId } from './necklace'

export interface NecklaceTheme {
  /** Stable id. */
  id: string
  /** Finnish label for any UI that lists themes. */
  label: string
  /** Backdrop + metal theme. */
  themeId: ThemeId
  /** One hue (0..359) per gem; cycled if the necklace has more sockets. */
  palette: number[]
  /** One shape per gem; cycled if the necklace has more sockets. */
  forms: GemForm[]
}

// Paste into app/src/lib/necklace_themes.ts
export const NECKLACE_THEMES: NecklaceTheme[] = [
  {
    id: 'theme-1',
    label: 'Meri',
    themeId: 'dragonhoard',
    palette: [195, 205, 140, 182, 222, 158, 195, 222],
    forms: ['dodecagon', 'hexagon', 'dodecagon', 'hexagon', 'hexagon', 'dodecagon', 'octagon', 'dodecagon'],
  },
  {
    id: 'theme-2',
    label: 'Auringonlasku',
    themeId: 'dragonhoard',
    palette: [300, 44, 262, 50, 300, 56, 282, 50],
    forms: ['hexagon', 'dodecagon', 'hexagon', 'octagon', 'dodecagon', 'hexagon', 'octagon', 'octagon'],
  },
  {
    id: 'theme-3',
    label: 'Sateenkaari',
    themeId: 'starforge',
    palette: [28, 205, 333, 211, 10, 28, 40, 350],
    forms: ['pentagon', 'triangle', 'triangle', 'heptagon', 'triangle', 'pentagon', 'heptagon', 'heptagon'],
  },
  {
    id: 'theme-4',
    label: 'Aalto',
    themeId: 'starforge',
    palette: [182, 205, 158, 195, 238, 140, 195, 238],
    forms: ['triangle', 'heptagon', 'pentagon', 'triangle', 'heptagon', 'pentagon', 'heptagon', 'triangle'],
  },
  {
    id: 'theme-5',
    label: 'Kesäpäivä',
    themeId: 'starforge',
    palette: [198, 40, 202, 339, 16, 273, 342, 325],
    forms: ['square', 'octagon', 'octagon', 'octagon', 'octagon', 'square', 'octagon', 'octagon'],
  },
  {
    id: 'theme-6',
    label: 'Ruusu',
    themeId: 'starforge',
    palette: [330, 358, 330, 350, 340, 350, 330, 350],
    forms: ['hexagon', 'hexagon', 'hexagon', 'square', 'hexagon', 'triangle', 'hexagon', 'triangle'],
  },
  {
    id: 'theme-7',
    label: 'Järvenlasku',
    themeId: 'dragonhoard',
    palette: [205, 205, 222, 222, 222, 222, 205, 222],
    forms: ['dodecagon', 'octagon', 'octagon', 'dodecagon', 'octagon', 'octagon', 'octagon', 'hexagon'],
  },
]
