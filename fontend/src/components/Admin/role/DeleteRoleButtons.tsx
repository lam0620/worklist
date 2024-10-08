import { useState, useEffect } from "react";
import { DeleteRole, DeleteRoles } from "@/services/apiService";
import BaseButton from "../../Button";
import ConfirmModal from "../../ConfirmModal";
import { toast } from "react-toastify";
import { useTranslation } from "../../../i18n";

type DeleteRoleButtonProps = {
  isMany: boolean;
  roleId?: string;
  roleIds?: string[];
  onRoleDeleted: () => void;
  isDisabled?: boolean;
};

const DeleteRoleButtons = ({
  isMany,
  roleId,
  roleIds,
  onRoleDeleted,
  isDisabled,
}: DeleteRoleButtonProps) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [t, setT] = useState(() => (key: string) => key);

  useEffect(() => {
    const loadTranslation = async () => {
      const { t } = await useTranslation("roleManagement");
      setT(() => t);
    };
    loadTranslation();
  }, []);

  const handleDelete = async () => {
    if (isMany) {
      const response = await DeleteRoles(roleIds);
      if (response.status === 200 && response.data?.result?.status === "OK") {
        toast.success(t("Roles deleted successfully"));
        onRoleDeleted();
      }
    } else {
      const response = await DeleteRole(roleId);
      if (response.status === 200 && response.data?.result?.status === "OK") {
        toast.success(t("Role deleted successfully"));
        onRoleDeleted();
      } else {
        toast.error(t("Failed to delete role"));
      }
    }
    onRoleDeleted();
  };

  const openConfirmModal = () => {
    setIsConfirmOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmOpen(false);
  };

  const confirmDelete = async () => {
    closeConfirmModal();
    await handleDelete();
  };

  return (
    <div>
      <BaseButton
        buttonText={t("Delete")}
        onApiCall={openConfirmModal}
        className={`mr-2 ${
          isDisabled
            ? "bg-gray-400 hover:cursor-not-allowed"
            : "bg-red-500 hover:bg-red-600"
        }`}
        isDisabled={isDisabled}
      />
      {isConfirmOpen && (
        <ConfirmModal
          message={t("Are you sure you want to delete this role?")}
          onConfirm={confirmDelete}
          onCancel={closeConfirmModal}
        />
      )}
    </div>
  );
};

export default DeleteRoleButtons;
