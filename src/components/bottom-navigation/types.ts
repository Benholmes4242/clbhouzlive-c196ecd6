
export interface TabItem {
  id: string;
  label: string;
  icon: any;
  path: string | null;
  isAction?: boolean;
}

export interface TaggableEntity {
  id: string;
  entity_type: 'user' | 'golf_club' | 'business';
  entity_id: string;
  name: string;
  username: string | null;
}
