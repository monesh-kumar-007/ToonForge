export interface NavItem {
  name: string;
  path: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { name: 'Overview', path: '/', icon: 'dashboard' },
  { name: 'Analyze Payload', path: '/analyze', icon: 'data_object' },
  { name: 'Adaptive Router', path: '/router', icon: 'alt_route' },
  { name: 'Format Comparison', path: '/compare', icon: 'compare_arrows' },
  { name: 'Benchmark Lab', path: '/benchmark', icon: 'speed' },
  { name: 'Learned Router', path: '/learned-router', icon: 'neurology' },
  { name: 'Reliability', path: '/reliability', icon: 'verified' },
  { name: 'Research', path: '/research', icon: 'menu_book' },
];