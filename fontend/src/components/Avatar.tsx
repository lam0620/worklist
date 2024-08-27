"use client";
import * as Avatar from "@radix-ui/react-avatar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { PERMISSIONS } from "@/utils/constant";

interface AvatarProps {
  firstName: string;
  lastName: string;
  avatarColor: string;
}

const UserAvatar = ({ firstName, lastName, avatarColor }: AvatarProps) => {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
  const router = useRouter();
  const { logout, user } = useUser();

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  const handleChangePassword = () => {
    router.push("/change-password");
  };

  const handleEditProfile = () => {
    router.push("/edit-profile");
  };

  const handleUserManagement = () => {
    router.push("/admin/users");
  };

  const handleRoleManagement = () => {
    router.push("/admin/roles");
  };

  const hasViewUserPermission =
    user?.permissions?.includes(PERMISSIONS.VIEW_ACCOUNT) || user?.is_superuser;

  const hasViewRolePermission =
    user?.permissions?.includes(PERMISSIONS.VIEW_GROUP) || user?.is_superuser;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Avatar.Root className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-800 cursor-pointer">
          <Avatar.Image
            className="w-full h-full rounded-full"
            src=""
            alt="User avatar"
          />
          <Avatar.Fallback
            className="flex items-center justify-center w-full h-full rounded-full text-white"
            style={{ backgroundColor: avatarColor }}
          >
            {initials}
          </Avatar.Fallback>
        </Avatar.Root>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content className="bg-white rounded shadow-md p-2">
        <div className="flex flex-col items-center p-2">
          <span className="text-gray-800 font-bold">{`${firstName} ${lastName}`}</span>
        </div>
        <DropdownMenu.Separator className="my-1 border-t border-gray-200" />
        <DropdownMenu.Item
          onSelect={handleChangePassword}
          className="cursor-pointer p-2 hover:bg-gray-100 rounded"
        >
          Change password
        </DropdownMenu.Item>
        <DropdownMenu.Item
          onSelect={handleEditProfile}
          className="cursor-pointer p-2 hover:bg-gray-100 rounded"
        >
          Change profile
        </DropdownMenu.Item>
        <DropdownMenu.Separator className="my-1 border-t border-gray-200" />
        {hasViewUserPermission && (
          <DropdownMenu.Item
            onSelect={handleUserManagement}
            className="cursor-pointer p-2 hover:bg-gray-100 rounded"
          >
            User management
          </DropdownMenu.Item>
        )}
        {hasViewRolePermission && (
          <DropdownMenu.Item
            onSelect={handleRoleManagement}
            className="cursor-pointer p-2 hover:bg-gray-100 rounded"
          >
            Role management
          </DropdownMenu.Item>
        )}
        <DropdownMenu.Separator className="my-1 border-t border-gray-200" />
        <DropdownMenu.Item
          onSelect={handleSignOut}
          className="cursor-pointer p-2 hover:bg-gray-100 rounded"
        >
          Log out
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default UserAvatar;
