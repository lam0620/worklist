import { useState, useEffect } from "react";
import CreateRoleModal from "./CreateRoleModal";
import { MyInfoProps } from "@/app/types/UserDetail";
import { useTranslation } from "../../../i18n";

interface CreateRoleButtonProps {
  onCreate: (newRole: any) => void;
  user: MyInfoProps;
}

const CreateRoleButton = ({ onCreate, user }: CreateRoleButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const [t, setT] = useState(() => (key: string) => key);

  useEffect(() => {
    const loadTranslation = async () => {
      const { t } = await useTranslation("roleManagement");
      setT(() => t);
    };
    loadTranslation();
  }, []);
  return (
    <div>
      <button
        onClick={handleOpenModal}
        className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500"
      >
        {t("Create Role")}
      </button>
      {isModalOpen && (
        <CreateRoleModal
          onClose={handleCloseModal}
          onCreate={(newRole) => {
            onCreate(newRole);
            handleCloseModal();
          }}
          user={user}
        />
      )}
    </div>
  );
};

export default CreateRoleButton;
