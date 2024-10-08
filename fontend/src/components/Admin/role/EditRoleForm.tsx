import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { UpdateRole, fetchPermissionsList } from "@/services/apiService";
import { toast } from "react-toastify";
import CheckboxGroup from "../../CheckboxGroup";
import { showErrorMessage } from "@/utils/showMessageError";
import { RoleDetailProps } from "@/app/types/RoleDetail";
import { PermissionListProps } from "@/app/types/Permission";
import { MyInfoProps } from "@/app/types/UserDetail";
import { useTranslation } from "../../../i18n";

interface EditRoleFormProps {
  role: RoleDetailProps;
  onEdit: (role: any) => void;
  onClose: () => void;
  user: MyInfoProps;
}

const EditRoleForm = ({ role, onEdit, onClose, user }: EditRoleFormProps) => {
  const [name, setName] = useState(role.name);
  const [description, setDescription] = useState(role.description);
  const [permissions, setPermissions] = useState(
    role.permissions?.map((permission: any) => permission.id) ?? []
  );
  const [fullPermissions, setFullPermissions] = useState<PermissionListProps[]>(
    []
  );
  const [showUnsavedChangesPopup, setShowUnsavedChangesPopup] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [t, setT] = useState(() => (key: string) => key);

  useEffect(() => {
    const loadTranslation = async () => {
      const { t } = await useTranslation("roleManagement");
      setT(() => t);
    };
    loadTranslation();
    const fetchPermissions = async () => {
      try {
        const response = await fetchPermissionsList({ isPage: false });
        setFullPermissions(response.data?.data);
      } catch (error) {
        console.error(t("Failed to fetch permissions:"), error);
      }
    };

    fetchPermissions().then((r) => r);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      await UpdateRole(role.id, { name, description, permissions });
      const permissions_obj = fullPermissions.filter((permission) =>
        permissions.includes(permission.id)
      );
      onEdit({ ...role, name, description, permissions: permissions_obj });
      toast.success(t("Role updated successfully"));
      onClose();
    } catch (error: any) {
      const code = error?.response?.data?.result?.code;
      const item = error?.response?.data?.result?.item;
      const message = showErrorMessage(code, item);
      toast.error(message);
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!name) {
      errors.name = t("Name is required");
    }

    if (permissions.length === 0) {
      errors.permissions = t("Permissions are required");
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCancel = () => {
    setShowUnsavedChangesPopup(true);
  };

  const confirmDiscardChanges = () => {
    setShowUnsavedChangesPopup(false);
    onClose();
  };

  const closeDiscardPopup = () => {
    setShowUnsavedChangesPopup(false);
  };

  return (
    <>
      <Dialog.Root open onOpenChange={onClose}>
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <Dialog.Content className="fixed bg-white p-6 rounded-md shadow-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl text-justify">
          <Dialog.Title className="text-xl font-bold mb-4 ml-0">
            {t("Edit Role")}
          </Dialog.Title>
          <form>
            <div className="mb-4">
              <label className="block text-gray-700">{t("Name")}</label>
              <input
                type="text"
                className={`w-full px-3 py-2 border border-gray-300 rounded-md ${
                  errors.name ? "border-red-500" : ""
                }`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">{t("Description")}</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={description ?? ""}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div
              className={`mb-4 ${errors.permissions ? "border-red-500" : ""}`}
            >
              <label className="block text-gray-700">{t("Permissions")}</label>
              <CheckboxGroup
                options={fullPermissions}
                selectedOptions={permissions}
                onChange={setPermissions}
                user={user}
              />
              {errors.permissions && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.permissions}
                </p>
              )}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md mr-2"
                onClick={handleCancel}
              >
                {t("Cancel")}
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-blue-500 text-white rounded-md"
                onClick={handleSave}
              >
                {t("Save")}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Root>
      <Dialog.Root open={showUnsavedChangesPopup}>
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <Dialog.Content className="fixed bg-white p-6 rounded-md shadow-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
          <Dialog.Title className="text-xl font-bold mb-4">
            {t("Discard Changes")}
          </Dialog.Title>
          <p className="mb-4">
            {t("Are you sure you want to discard changes?")}
          </p>
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md mr-2"
              onClick={closeDiscardPopup}
            >
              {t("Cancel")}
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-red-500 text-white rounded-md"
              onClick={confirmDiscardChanges}
            >
              {t("Yes")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

export default EditRoleForm;
