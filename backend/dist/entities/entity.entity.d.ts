export declare enum EntityType {
    UNION = "UNION",
    ASSOCIATION = "ASSOCIATION",
    FIELD = "FIELD"
}
export declare class Entity {
    id: string;
    name: string;
    type: EntityType;
    parent: Entity | null;
    code: string;
    location?: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
