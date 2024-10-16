import { useState, useEffect } from "react";
import { DeleteOrder, DeleteOrders } from "@/services/apiService";
import BaseButton from "../../Button";
import ConfirmModal from "../../ConfirmModal";
import { toast } from "react-toastify";
import { useTranslation } from "../../../i18n";

type DeleteOrderButtonProps = {
  isMany: boolean;
  orderId?: string;
  orderIds?: string[];
  onOrderDeleted: () => void;
  isDisabled?: boolean;
};

const DeleteOrderButton = ({
  isMany,
  orderId,
  orderIds,
  onOrderDeleted,
  isDisabled,
}: DeleteOrderButtonProps) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [t, setT] = useState(() => (key: string) => key);

  useEffect(() => {
    const loadTranslation = async () => {
      const { t } = await useTranslation("orderManagement");
      setT(() => t);
    };
    loadTranslation();
  }, []);
  const handleDelete = async () => {
    if (isMany) {
      const response = await DeleteOrders(orderIds);
      if (response.status === 200 && response.data?.result?.status === "OK") {
        toast.success(t("Orders deleted successfully"));
        onOrderDeleted();
      }
    } else {
      const response = await DeleteOrder(orderId);
      if (response.status === 200 && response.data?.result?.status === "OK") {
        toast.success(t("Orders deleted successfully"));
        onOrderDeleted();
      } else {
        toast.error(t("Failed to delete order"));
      }
    }
    onOrderDeleted();
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
          message={t("Are you sure you want to delete this order?")}
          onConfirm={confirmDelete}
          onCancel={closeConfirmModal}
        />
      )}
    </div>
  );
};
export default DeleteOrderButton;
