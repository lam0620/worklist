import BaseButton from "../../Button";
import CreateUserModal from "./CreateUserModal";
import { useTranslation } from "../../../i18n";
import { useState, useEffect } from "react";

const CreateUserButton = ({
  onUserCreated,
  onClose,
}: {
  onUserCreated: () => void;
  onClose: () => void;
}) => {
  const [t, setT] = useState(() => (key: string) => key);

  useEffect(() => {
    const loadTranslation = async () => {
      const { t } = await useTranslation("userManagement");
      setT(() => t);
    };
    loadTranslation();
  }, []);
  return (
    <BaseButton
      buttonText={t("Create User")}
      modalComponent={
        <CreateUserModal onUserCreated={onUserCreated} onClose={onClose} />
      }
      className="bg-blue-400 hover:bg-blue-500"
    />
  );
};

export default CreateUserButton;
