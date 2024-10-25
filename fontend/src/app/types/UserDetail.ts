export interface UserDetailProps {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_color: string;
    last_login : string;
    roles: {
        id: string;
        name: string;
    }[];
    created_at: string;
    username: string;
}


export interface MyInfoProps {
    id: string;
    first_name: string
    avatar_color: string;
    email: string;
    is_superuser: boolean;
    last_name: string;
    permissions: string[];
    roles: string[];
    username: string;
}