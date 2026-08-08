export interface MenuBadge {
  readonly variant: string;
  readonly text: string;
}

export interface MenuItem {
  readonly label: string;
  readonly icon?: string;
  readonly url?: string;
  readonly isTitle?: boolean;
  readonly isDisabled?: boolean;
  readonly badge?: MenuBadge;
  readonly children?: readonly MenuItem[];
}
