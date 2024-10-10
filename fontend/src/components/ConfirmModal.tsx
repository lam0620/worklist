import { useTranslation } from "@/i18n";
import React, { useState, useEffect } from "react";

interface ConfirmModalProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({ message, onConfirm, onCancel }: ConfirmModalProps) => {
  const [t, setT] = useState(() => (key: string) => key);

  useEffect(() => {
    const loadTranslation = async () => {
      const { t } = await useTranslation("userManagement");
      setT(() => t);
    };
    loadTranslation();
  }, []);
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center "
      style={{ zIndex: 1000 }}
    >
      <div className="bg-white p-4 rounded-md">
        <p>{message}</p>
        <div className="flex justify-end mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 mx-1 bg-gray-200 rounded-md"
          >
            {t("Cancel")}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 mx-1 bg-red-600 text-white rounded-md"
          >
            {t("Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
