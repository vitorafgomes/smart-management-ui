import { MenuItem } from './menu-item';

const icon = (name: string) => `/assets/icons/sprite.svg#${name}`;

/**
 * Mock navigation. The real menu is assembled from the Portal Admin API (modules to applications
 * to pages, filtered by role); this fixture keeps that same two-level shape so the sidenav is
 * exercised the way the API will drive it. Entries whose module has not been migrated yet carry
 * no url and render disabled rather than linking to a route that does not exist.
 */
export const MOCK_MENU: readonly MenuItem[] = [
  { label: 'Home', icon: icon('home'), url: '/dashboard' },
  { label: 'Modules', isTitle: true },
  {
    label: 'Identity',
    icon: icon('users'),
    badge: { variant: 'info', text: 'Phase 2' },
    children: [
      { label: 'Users', isDisabled: true },
      { label: 'Tenants', isDisabled: true },
    ],
  },
  {
    label: 'Master data',
    icon: icon('database'),
    badge: { variant: 'secondary', text: 'Planned' },
    isDisabled: true,
  },
  {
    label: 'Sales',
    icon: icon('shopping-cart'),
    badge: { variant: 'secondary', text: 'Planned' },
    isDisabled: true,
  },
];
