import { useState } from "react";
import CreateRoleModal from "./CreateRoleModal";

interface CreateRoleButtonProps {
  onCreate: (newRole: any) => void;
}

const CreateRoleButton = ({ onCreate }: CreateRoleButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div>
      <button
        onClick={handleOpenModal}
        className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500"
      >
        Create Role
      </button>
      {isModalOpen && (
        <CreateRoleModal
          onClose={handleCloseModal}
          onCreate={(newRole) => {
            onCreate(newRole);
            handleCloseModal();
          }}
        />
      )}
    </div>
  );
};

export default CreateRoleButton;
