import EditRoleForm from "./EditRoleForm";
import { useState } from "react";

interface EditRoleButtonProps {
  roleDetail: any;
  onRoleUpdated: (Role: any) => void;
}

const EditRoleButton = ({ roleDetail, onRoleUpdated }: EditRoleButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div>
      <button
        onClick={handleOpenModal}
        className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500"
      >
        Edit Role
      </button>
      {isModalOpen && (
        <EditRoleForm
          role={roleDetail}
          onClose={handleCloseModal}
          onEdit={(roleUpdate) => {
            onRoleUpdated(roleUpdate);
            handleCloseModal();
          }}
        />
      )}
    </div>
  );
};

export default EditRoleButton;
