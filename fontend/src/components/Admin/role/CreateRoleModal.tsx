// components/CreateRoleModal.tsx

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import CheckboxGroup from "@/components/CheckboxGroup";
import { toast } from "react-toastify";
import { UUID } from "crypto";
import { CreateRole, fetchPermissionsList } from "@/services/apiService";
import { showErrorMessage } from "@/utils/showMessageError";
import { authorized } from "@/enum/errorCode";
import { MyInfoProps } from "@/app/types/UserDetail";
import { useTranslation } from "../../../i18n";

interface CreateRoleModalProps {
  onClose: () => void;
  onCreate: (newRole: Role) => void;
  user: MyInfoProps;
}

interface Permission {
  id: UUID;
  name: string;
  tag: string;
  code: string;
}

interface Role {
  name: string;
  description: string | null;
  permissions: string[];
}

const CreateRoleModal = ({ onClose, onCreate, user }: CreateRoleModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<
    Permission[]
  >([]);
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
        setAvailablePermissions(response.data?.data);
      } catch (error: any) {
        if (error.response.status === 403) {
          toast.error(authorized);
        }
      }
    };

    fetchPermissions().then((r) => r);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const newRole: Role = {
      name,
      description: description || null,
      permissions,
    };

    try {
      const response = await CreateRole(newRole);
      if (response?.data.result.status === "NG") {
        const code = response?.data?.result?.code;
        const item = response?.data?.result?.item;
        const msg = response?.data?.result?.msg;
        const message = showErrorMessage(code, item, msg);
        toast.error(message);
      } else {
        onCreate(response?.data?.data);
        toast.success(t("Role created successfully"));
        onClose();
      }
    } catch (error: any) {
      const msg = error.response.data?.result?.msg;
      const item = error.response.data?.result?.item || null;
      const message = showErrorMessage(msg, item);
      toast.error(message);
    }
  };

  const validateForm = () => {
    let errors: { [key: string]: string } = {};
    if (!name) {
      errors.name = t("Name is required");
    }

    if (permissions.length === 0) {
      errors.permissions = t("Permissions are required");
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <Dialog.Root open onOpenChange={onClose}>
      <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
      <Dialog.Content className="fixed bg-white p-6 rounded-md shadow-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
        <Dialog.Title className="text-xl font-bold mb-4">
          {t("Create Role")}
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
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className={`mb-4 ${errors.permissions ? "border-red-500" : ""}`}>
            <label className="block text-gray-700">{t("Permissions")}</label>
            <CheckboxGroup
              options={availablePermissions}
              selectedOptions={permissions}
              onChange={setPermissions}
              user={user}
            />
            {errors.permissions && (
              <p className="text-red-500 text-sm mt-1">{errors.permissions}</p>
            )}
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded-md"
              onClick={onClose}
            >
              {t("Cancel")}
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
              onClick={handleCreate}
            >
              {t("Create")}
            </button>
          </div>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
};

export default CreateRoleModal;
