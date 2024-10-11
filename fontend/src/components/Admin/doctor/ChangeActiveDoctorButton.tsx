import BaseButton from "@/components/Button";
import ConfirmModal from "@/components/ConfirmModal";
import { ChangeActiveDoctors } from "@/services/apiService";
import { useTranslation } from "../../../i18n";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";

type ChangeActiveDoctorButtonProps = {
  buttonStatus: string;
  doctorIds: string[];
  onDoctorChangeActive: () => void;
  isDisable?: boolean;
};

const ChangeActiveDoctorButton = ({
  buttonStatus,
  doctorIds,
  onDoctorChangeActive,
  isDisable,
}: ChangeActiveDoctorButtonProps) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [t, setT] = useState(() => (key: string) => key);

  useEffect(() => {
    const loadTranslation = async () => {
      const { t } = await useTranslation("doctorManagement");
      setT(() => t);
    };
    loadTranslation();
  }, []);
  const handleChangeActive = async () => {
    if (buttonStatus === "true") {
      const response = await ChangeActiveDoctors("false", doctorIds);
      onDoctorChangeActive();
      onDoctorChangeActive();
      if (response.status === 200 && response.data?.result?.status === "OK") {
        toast.success(t("Doctor(s) change active successfully"));
      } else {
        toast.error(t("Failed to active doctor"));
      }
    }
    if (buttonStatus === "false") {
      const response = await ChangeActiveDoctors("true", doctorIds);
      onDoctorChangeActive();
      onDoctorChangeActive();
      if (response.status === 200 && response.data?.result?.status === "OK") {
        toast.success(t("Doctor(s) change active successfully"));
        onDoctorChangeActive();
      } else {
        toast.error(t("Failed to delete doctor"));
      }
    }
  };
  const openConfirmModal = () => {
    setIsConfirmOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmOpen(false);
  };

  const confirmChangeActive = async () => {
    closeConfirmModal();
    await handleChangeActive();
  };
  return (
    <div>
      <BaseButton
        buttonText={buttonStatus === "true" ? t("Deactivate") : t("Activate")}
        onApiCall={openConfirmModal}
        className={
          isDisable
            ? "bg-gray-400 hover:cursor-not-allowed"
            : buttonStatus === "true"
            ? "bg-red-500 hover:bg-red-600"
            : "bg-green-500 hover:bg-green-600"
        }
        isDisabled={isDisable}
      />

      {isConfirmOpen && (
        <ConfirmModal
          message={`${t("Do you want to")} ${
            buttonStatus === "true" ? t("Deactivate") : t("Activate")
          } ${t("doctor (s)?")}`}
          onConfirm={confirmChangeActive}
          onCancel={closeConfirmModal}
        />
      )}
    </div>
  );
};

export default ChangeActiveDoctorButton;
