export interface TabConfig {
  tab: string;
  href: string;
  icon: string;
  label: string;
  badge?: number;
}

export interface RouteConfig {
  path: string;
  exact?: boolean;
  component: React.LazyExoticComponent<React.FC>;
  guard?: 'auth' | 'guest' | 'onboarding';
}
