import BaseButton from "../../Button";
import CreateUserModal from "./CreateUserModal";

const CreateUserButton = ({
  onUserCreated,
  onClose,
}: {
  onUserCreated: () => void;
  onClose: () => void;
}) => {
  return (
    <BaseButton
      buttonText="Create User"
      modalComponent={
        <CreateUserModal onUserCreated={onUserCreated} onClose={onClose} />
      }
      className="bg-blue-400 hover:bg-blue-500"
    />
  );
};

export default CreateUserButton;
