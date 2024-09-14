// components/CreateRoleModal.tsx

import React, { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import CheckboxGroup from "@/components/CheckboxGroup";
import { toast } from "react-toastify";
import { UUID } from "crypto";
import { CreateRole, fetchPermissionsList } from "@/services/apiService";
import { showErrorMessage } from "@/utils/showMessageError";

interface CreateRoleModalProps {
  onClose: () => void;
  onCreate: (newRole: Role) => void;
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

const CreateRoleModal = ({ onClose, onCreate }: CreateRoleModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [showUnsavedChangesPopup, setShowUnsavedChangesPopup] = useState(false);
  const [availablePermissions, setAvailablePermissions] = useState<
    Permission[]
  >([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const response = await fetchPermissionsList({ isPage: false });
        setAvailablePermissions(response.data?.data);
      } catch (error) {
        console.error("Failed to fetch permissions:", error);
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
      onCreate(response?.data?.data);
      toast.success("Role created successfully");
      onClose();
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
      errors.name = "Name is required";
    }

    if (permissions.length === 0) {
      errors.permissions = "Permissions are required";
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
      <Dialog.Content className="fixed bg-white p-6 rounded-md shadow-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl">
        <Dialog.Title className="text-xl font-bold mb-4">
          Create Role
        </Dialog.Title>
        <form>
          <div className="mb-4">
            <label className="block text-gray-700">Name</label>
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
            <label className="block text-gray-700">Description</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className={`mb-4 ${errors.permissions ? "border-red-500" : ""}`}>
            <label className="block text-gray-700">Permissions</label>
            <CheckboxGroup
              options={availablePermissions}
              selectedOptions={permissions}
              onChange={setPermissions}
            />
            {errors.permissions && (
              <p className="text-red-500 text-sm mt-1">{errors.permissions}</p>
            )}
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded-md"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
              onClick={handleCreate}
            >
              Create
            </button>
          </div>
          <Dialog.Root open={showUnsavedChangesPopup}>
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            <Dialog.Content className="fixed bg-white p-6 rounded-md shadow-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
              <Dialog.Title className="text-xl font-bold mb-4">
                Unsaved Changes
              </Dialog.Title>
              <p>Are you sure you want to discard your changes?</p>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded-md"
                  onClick={closeDiscardPopup}
                >
                  No
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-red-600 text-white rounded-md"
                  onClick={confirmDiscardChanges}
                >
                  Yes
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Root>
        </form>
      </Dialog.Content>
    </Dialog.Root>
    </>
  );
};

export default CreateRoleModal;
