import { MyInfoProps } from "@/app/types/UserDetail";
import EditRoleForm from "./EditRoleForm";
import { useState, useEffect } from "react";
import { useTranslation } from "../../../i18n";

interface EditRoleButtonProps {
  roleDetail: any;
  onRoleUpdated: (Role: any) => void;
  user: MyInfoProps;
}

const EditRoleButton = ({
  roleDetail,
  onRoleUpdated,
  user,
}: EditRoleButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [t, setT] = useState(() => (key: string) => key);

  useEffect(() => {
    const loadTranslation = async () => {
      const { t } = await useTranslation("roleManagement");
      setT(() => t);
    };
    loadTranslation();
  }, []);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div>
      <button
        onClick={handleOpenModal}
        className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500"
      >
        {t("Edit Role")}
      </button>
      {isModalOpen && (
        <EditRoleForm
          role={roleDetail}
          onClose={handleCloseModal}
          onEdit={(roleUpdate) => {
            onRoleUpdated(roleUpdate);
            handleCloseModal();
          }}
          user={user}
        />
      )}
    </div>
  );
};

export default EditRoleButton;
