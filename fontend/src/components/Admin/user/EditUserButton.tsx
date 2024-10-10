import { useEffect, useState } from "react";
import EditUserForm from "./EditUserForm";
import { useTranslation } from "../../../i18n";

interface EditUserButtonProps {
  userDetail: any;
  onUserUpdated: (user: any) => void;
}

const EditUserButton = ({ userDetail, onUserUpdated }: EditUserButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [t, setT] = useState(() => (key: string) => key);

  useEffect(() => {
    const loadTranslation = async () => {
      const { t } = await useTranslation("userManagement");
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
        {t("Edit User")}
      </button>
      {isModalOpen && (
        <EditUserForm
          user={userDetail}
          onClose={handleCloseModal}
          onEdit={(userUpdate) => {
            onUserUpdated(userUpdate);
            handleCloseModal();
          }}
        />
      )}
    </div>
  );
};

export default EditUserButton;
