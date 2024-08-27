import { useState } from "react";
import EditUserForm from "./EditUserForm";

interface EditUserButtonProps {
  userDetail: any;
  onUserUpdated: (user: any) => void;
}

const EditUserButton = ({ userDetail, onUserUpdated }: EditUserButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);

  return (
    <div>
      <button
        onClick={handleOpenModal}
        className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500"
      >
        Edit User
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
