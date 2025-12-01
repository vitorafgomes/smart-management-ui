import {MenuItemType} from '@/app/types/layout';

export const menuItems: MenuItemType[] = [
  {  label: 'Insights', isTitle: true },
  {
    label: 'Dashboards',
    icon: '/assets/icons/sprite.svg#trello',
    isCollapsed:true,
    badge: { variant: 'danger', text: 'New' },
    children: [
      {  label: 'Control Center', url: '/dashboards/control-center' },
      {label: 'Subscription & Billing', url: '/dashboards/subscription' },
      { label: 'Marketing & Sales', url: '/dashboards/marketing' },
      { label: 'Project Management', url: '/dashboards/project-management' },
    ],
  },
  {
    icon: '/assets/icons/sprite.svg#home',
    label: 'Blank Page',
    url: '/blank-page',
  },
  {  label: 'Layouts', isTitle: true },
  {
    icon: '/assets/icons/sprite.svg#slash',
    isCollapsed:true,
    label: 'Authentication Pages',
    children: [
      { label: 'Login', url: '/auth/login' },
      { label: 'Register', url: '/auth/register' },
      {  label: 'Forget Password', url: '/auth/forgot-password' },
      {  label: '2FA', url: '/auth/two-factor' },
      {  label: 'Lock Screen', url: '/auth/lockscreen' },
    ],
  },

  {
    isCollapsed:true,
    icon: '/assets/icons/sprite.svg#alert-triangle',
    label: 'Error Pages',
    children: [
      {  label: '404 Not Found', url: '/error/404' },
      {  label: '404 Not Found 2', url: '/error/404-2' },
      {  label: '500 Internal Server', url: '/error/500' },
    ],
  },
  {
    icon: '/assets/icons/sprite.svg#user',
    label: 'User Profile',
    url: '/user-profile',
  },
  {  label: 'Management Account', isTitle: true },
  {
    icon: '/assets/icons/sprite.svg#settings',
    label: 'Tenant Settings',
    url: '/tenant-settings',
  },
  {
    icon: '/assets/icons/sprite.svg#users',
    isCollapsed: true,
    label: 'Users',
    children: [
      { label: 'All Users', url: '/users' },
      { label: 'Invite User', url: '/users/invite' },
    ],
  },
  {
    icon: '/assets/icons/sprite.svg#shield',
    isCollapsed: true,
    label: 'Roles',
    children: [
      { label: 'All Roles', url: '/roles' },
      { label: 'Create Role', url: '/roles/create' },
    ],
  },
  {
    icon: '/assets/icons/sprite.svg#folder',
    isCollapsed: true,
    label: 'Groups',
    children: [
      { label: 'All Groups', url: '/groups' },
      { label: 'Create Group', url: '/groups/create' },
    ],
  },
  {
    label: 'Landing',
    icon: '/assets/icons/sprite.svg#zap',
    url: '/landing',
    target: '_blank',
  },
  {
    isCollapsed:true,
    icon: '/assets/icons/sprite.svg#heart',
    label: 'Iconography',
    children: [
      {  label: 'System Icons', url: '/icons/system' },
      {  label: 'FontAwesome', url: '/icons/font-awesome' },
      {  label: 'Smart Admin Icons', url: '/icons/smart-admin' },
    ],
  },
  {
    icon: '/assets/icons/sprite.svg#table',
    isCollapsed:true,
    label: 'Tables',
    children: [
      { label: 'Basic Tables', url: '/tables/basic' },
      { label: 'Table Style Generator', url: '/tables/style-generator' },
    ],
  },
  {label: 'Layouts', isTitle: true },
  {
    isCollapsed:true,
    icon: '/assets/icons/sprite.svg#database',
    label: 'TanStack Table',
    children: [
      {  label: 'Table With Search', url: '/tanstack-tables/search' },
      {  label: 'Table With Pagination', url: '/tanstack-tables/pagination' },
      {  label: 'Table With Checkbox', url: '/tanstack-tables/checkbox-select' },
      {  label: 'Table With Delete Buttons', url: '/tanstack-tables/delete-buttons' },
      {  label: 'Table With Filters', url: '/tanstack-tables/filters' },
      { label: 'Table With Sorting', url: '/tanstack-tables/sorting' },
    ],
  },
]
