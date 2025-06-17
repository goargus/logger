
export enum EntityType {
    UNION = 'UNION',
    ASSOCIATION = 'ASSOCIATION',
    FIELD = 'FIELD',
  }
  
  export interface User {
    id: string;
    name: string;
    surname: string;
    email: string;
    phone?: string;
    address?: string;
    joined_at: Date;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  
    activities: Activity[];
  }
  
  export interface Role {
    id: string;
    name: string; // 'missionary', 'pastor', 'minister', 'executive', 'departamental'
    description?: string;
  }
  
  export interface Entity {
    id: string;
    name: string;
    type: EntityType;
    parent_id: string | null; // null for top-level (Union)
    code: string;                // Optional unique code per entity
    location?: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }
  
  export interface UserRole {
    user_id: string;
    role_id: string;
    entity_id: string;
  }
  
  export interface Category {
    id: string;
    name: string;           // e.g., "Visitations", "Bible Studies"
    description?: string;
  }
  
  export interface RoleCategory {
    id: string;
    role_id: string;
    category_id: string;
  }
  
  export interface Activity {
    id: string;
    user_id: string;           // Who performed the activity
    category_id: string;   // What type of activity (e.g., Visit, Evangelism)
    description?: string;        // Optional additional context
    date: Date;                  // When the activity occurred
    is_locked: boolean;          // Locked after 14 days
    created_at: Date;
    updated_at: Date;
  }