export interface UserDetailProps {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_color: string;
    roles: {
        id: string;
        name: string;
    }[];
    created_at: string;
    username: string;
}