"use client";
import * as Avatar from "@radix-ui/react-avatar";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { PERMISSIONS } from "@/utils/constant";
import { useTranslation } from "../i18n/client";

interface AvatarProps {
  firstName: string;
  lastName: string;
  avatarColor: string;
}

const UserAvatar = ({ firstName, lastName, avatarColor }: AvatarProps) => {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
  const router = useRouter();
  const { logout, user } = useUser();

  const { t } = useTranslation("others");

  const handleSignOut = () => {
    logout();
    router.push("/login");
  };

  const handleChangePassword = () => {
    router.push("/profile/change-password");
  };

  const handleEditProfile = () => {
    router.push("/profile/edit");
  };

  const handleUserManagement = () => {
    router.push("/admin/users");
  };

  const handleRoleManagement = () => {
    router.push("/admin/roles");
  };
  const handleDoctorManagement = () => {
    router.push("/admin/doctors");
  };
  const handleOrderManagement = () => {
    router.push("/admin/orders");
  };
  const handleReportManagement = () => {
    router.push("/admin/reports");
  };
  const handlePatientManagement = () => {
    router.push("/admin/patients");
  };
  const hasViewUserPermission =
    user?.permissions?.includes(PERMISSIONS.VIEW_ACCOUNT) || user?.is_superuser;

  const hasViewRolePermission =
    user?.permissions?.includes(PERMISSIONS.VIEW_GROUP) || user?.is_superuser;
  const hasViewOrderPermission =
    user?.permissions?.includes(PERMISSIONS.VIEW_ORDER) || user?.is_superuser;
  const hasViewReportPermission =
    user?.permissions?.includes(PERMISSIONS.VIEW_REPORT) || user?.is_superuser;
  const hasViewDoctorPermission =
    user?.permissions?.includes(PERMISSIONS.VIEW_DOCTOR) || user?.is_superuser;
  const hasViewPatientPermission =
    user?.permissions?.includes(PERMISSIONS.VIEW_PATIENT) || user?.is_superuser;

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
          {t("Change password")}
        </DropdownMenu.Item>
        <DropdownMenu.Item
          onSelect={handleEditProfile}
          className="cursor-pointer p-2 hover:bg-gray-100 rounded"
        >
          {t("Change profile")}
        </DropdownMenu.Item>
        {(hasViewUserPermission || hasViewRolePermission) && (
          <DropdownMenu.Separator className="my-1 border-t border-gray-200" />
        )}
        {hasViewUserPermission && (
          <DropdownMenu.Item
            onSelect={handleUserManagement}
            className="cursor-pointer p-2 hover:bg-gray-100 rounded"
          >
            {t("User management")}
          </DropdownMenu.Item>
        )}
        {hasViewRolePermission && (
          <DropdownMenu.Item
            onSelect={handleRoleManagement}
            className="cursor-pointer p-2 hover:bg-gray-100 rounded"
          >
            {t("Role management")}
          </DropdownMenu.Item>
        )}
        {(hasViewDoctorPermission || hasViewPatientPermission) && (
          <DropdownMenu.Separator className="my-1 border-t border-gray-200" />
        )}
        {hasViewDoctorPermission && (
          <DropdownMenu.Item
            onSelect={handleDoctorManagement}
            className="cursor-pointer p-2 hover:bg-gray-100 rounded"
          >
            {t("Doctor management")}
          </DropdownMenu.Item>
        )}
        {hasViewPatientPermission && (
          <DropdownMenu.Item
            onSelect={handlePatientManagement}
            className="cursor-pointer p-2 hover:bg-gray-100 rounded"
          >
            {t("Patient management")}
          </DropdownMenu.Item>
        )}
        {(hasViewOrderPermission || hasViewReportPermission) && (
          <DropdownMenu.Separator className="my-1 border-t border-gray-200" />
        )}
        {hasViewOrderPermission && (
          <DropdownMenu.Item
            onSelect={handleOrderManagement}
            className="cursor-pointer p-2 hover:bg-gray-100 rounded"
          >
            {t("Order management")}
          </DropdownMenu.Item>
        )}
        {hasViewReportPermission && (
          <DropdownMenu.Item
            onSelect={handleReportManagement}
            className="cursor-pointer p-2 hover:bg-gray-100 rounded"
          >
            {t("Report management")}
          </DropdownMenu.Item>
        )}
        <DropdownMenu.Separator className="my-1 border-t border-gray-200" />
        <DropdownMenu.Item
          onSelect={handleSignOut}
          className="cursor-pointer p-2 hover:bg-gray-100 rounded"
        >
          {t("Log out")}
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};

export default UserAvatar;
