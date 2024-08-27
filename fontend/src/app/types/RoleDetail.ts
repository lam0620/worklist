export interface RoleDetailProps {
    id: string;
    name: string;
    description: string | null;
    permissions?: {
        id: string;
        name: string;
        code?: string;
    }[] ;
    users?: {
        id: string;
        first_name: string;
        last_name: string;
        avatar_color: string;
        username: string;
    }[];
    created_at: string;
}
