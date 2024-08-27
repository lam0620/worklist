import { useState } from "react";
import { toast } from "react-toastify";
import { DeleteAccount, DeleteAccounts } from "@/services/apiService";
import BaseButton from "../../Button";
import ConfirmModal from "../../ConfirmModal";

type DeleteUserButtonProps = {
  isMany: boolean;
  userId?: string;
  userIds?: string[];
  onUserDeleted: () => void;
  isDisabled?: boolean;
};

const DeleteUserButton = ({
  isMany,
  userId,
  userIds,
  onUserDeleted,
  isDisabled,
}: DeleteUserButtonProps) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleDelete = async () => {
    if (isMany) {
      const response = await DeleteAccounts(userIds);
      if (response.status === 200 && response.data?.result?.status === "OK") {
        toast.success("Users deleted successfully");
        onUserDeleted();
      }
    } else {
      const response = await DeleteAccount(userId);
      if (response.status === 200 && response.data?.result?.status === "OK") {
        toast.success("User deleted successfully");
        onUserDeleted();
      } else {
        toast.error("Failed to delete user");
      }
    }
    onUserDeleted();
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
        buttonText="Delete"
        onApiCall={openConfirmModal}
        className={
          isDisabled
            ? "bg-gray-400 hover:cursor-not-allowed"
            : "bg-red-500  hover:bg-red-600"
        }
        isDisabled={isDisabled}
      />
      {isConfirmOpen && (
        <ConfirmModal
          message="Are you sure you want to delete this user?"
          onConfirm={confirmDelete}
          onCancel={closeConfirmModal}
        />
      )}
    </div>
  );
};

export default DeleteUserButton;
