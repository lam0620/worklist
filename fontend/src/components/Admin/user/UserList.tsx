"use client";

import * as Avatar from "@radix-ui/react-avatar";
import { Checkbox } from "@radix-ui/themes";
import { PERMISSIONS } from "@/utils/constant";
import { UserDetailProps } from "@/app/types/UserDetail";
import BaseDialog from "@/components/BaseDialog";
import { useState, useEffect } from "react";
import { ResetPassword } from "@/services/apiService";
import { toast } from "react-toastify";
import { showErrorMessage } from "@/utils/showMessageError";
import { useUser } from "@/context/UserContext";
import { useTranslation } from "../../../i18n";

interface UserListProps {
  users: UserDetailProps[];
  onSelectUser: (userId: string) => void;
  onSelectUserForDelete: (userId: string, selected: boolean) => void;
  userPermissions: string[] | undefined;
  isAdminUser: boolean | undefined;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedUsers: { [key: string]: boolean };
  t: (key: string) => string;
}

const UserList = ({
  users,
  onSelectUser,
  onSelectUserForDelete,
  userPermissions,
  isAdminUser,
  currentPage,
  totalPages,
  onPageChange,
  selectedUsers,
  t,
}: UserListProps) => {
  const { user } = useUser();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetailProps | null>(
    null
  );
  const [newPassword, setNewPassword] = useState("");
  // const [t, setT] = useState(() => (key: string) => key);

  // useEffect(() => {
  //   const loadTranslation = async () => {
  //     const { t } = await useTranslation("userManagement");
  //     setT(() => t);
  //   };
  //   loadTranslation();
  // }, []);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const hasDeletePermission =
    (userPermissions ?? []).includes(PERMISSIONS.DELETE_ACCOUNT) || isAdminUser;

  const hasPermissionResetPassword =
    (userPermissions ?? []).includes(PERMISSIONS.RESET_PASSWORD) || isAdminUser;

  const isRootOrIntegUser = (detailUser: any) => {
    // Root, Integ or login user
    if (
      ["root", "integ_user"].includes(detailUser.username) ||
      user.username === detailUser.username
    ) {
      return true;
    }
    return false;
  };

  const openDialog = (user: UserDetailProps) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
    setNewPassword("");
  };

  const handleResetPassword = async () => {
    if (selectedUser) {
      try {
        await ResetPassword({
          user_id: selectedUser.id,
          password: newPassword,
        });
        toast.success(t("Password reset successfully"));
        closeDialog();
      } catch (error: any) {
        console.log(error);
        const msg = error.response?.data?.result?.msg;
        const item = error.response?.data?.result?.item || null;
        const message = showErrorMessage(msg, item);
        toast.error(message);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-2 border-b bg-gray-100 text-center">
        <div className="w-1/12 font-semibold "></div>
        <div className="w-3/12 font-semibold">{t("Full Name")}</div>
        <div className="w-3/12 font-semibold">Email</div>
        <div className="w-2/12 font-semibold">{t("Role")}</div>
        <div className="w-2/12 font-semibold">{t("Last Login")}</div>
        <div className="w-2/12 font-semibold">{t("Date Created")}</div>
        <div className="w-1/12 font-semibold"></div>
      </div>
      <ul className="flex-grow text-center">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex items-center justify-between p-2 border-b"
          >
            <div className="w-1/12">
              {hasDeletePermission && !isRootOrIntegUser(user) && (
                <Checkbox
                  checked={!!selectedUsers[user.id]}
                  onCheckedChange={(checked) =>
                    onSelectUserForDelete(user.id, checked as boolean)
                  }
                  className="border-2 border-gray-400 rounded-sm h-4 w-4"
                />
              )}
            </div>
            <div
              className="flex w-3/12 cursor-pointer justify-center"
              onClick={() => onSelectUser(user.id)}
            >
              <Avatar.Root className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-800">
                <Avatar.Image
                  className="w-full h-full rounded-full"
                  src=""
                  alt="User avatar"
                />
                <Avatar.Fallback
                  className="flex items-center justify-center w-full h-full rounded-full text-white"
                  style={{ backgroundColor: user.avatar_color }}
                >
                  {`${user.first_name.charAt(0)}${user.last_name.charAt(0)}`}
                </Avatar.Fallback>
              </Avatar.Root>
              <div className="ml-4">
                <div>
                  {user.last_name} {user.first_name}
                </div>
              </div>
            </div>
            <div className="w-3/12 text-sm text-gray-500">{user.email}</div>
            <div className="w-2/12 flex flex-wrap gap-1 justify-center">
              {Array.isArray(user.roles) &&
                user.roles.map((role) => (
                  <span
                    key={role.id.toString()}
                    className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-full"
                  >
                    {role.name}
                  </span>
                ))}
            </div>
            <div className="w-2/12 text-sm text-gray-500">
              {!user.last_login ||
              user.last_login === "null" ||
              user.last_login === ""
                ? "---"
                : new Date(user.last_login).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
            </div>

            <div className="w-2/12 text-sm text-gray-500">
              {new Date(user.created_at).toLocaleDateString()}
            </div>
            <div className="w-1/12">
              {hasPermissionResetPassword && (
                <button
                  className="text-blue-500"
                  onClick={() => openDialog(user)}
                >
                  {t("Reset password")}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <div className="sticky bottom-0 bg-white py-4">
          <div className="flex justify-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
            >
              {t("Previous")}
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={`px-4 py-2 mx-1 rounded-md ${
                  index + 1 === currentPage
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
            >
              {t("Next")}
            </button>
          </div>
        </div>
      )}
      <BaseDialog
        isOpen={isDialogOpen}
        onOpenChange={closeDialog}
        title="Reset Password"
      >
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="border p-2 w-full mb-4"
          placeholder="Enter new password"
        />
        <div className="flex justify-end">
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-md mr-2"
            onClick={closeDialog}
          >
            {t("Cancel")}
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-md"
            onClick={handleResetPassword}
          >
            {t("Reset")}
          </button>
        </div>
      </BaseDialog>
    </div>
  );
};

export default UserList;
