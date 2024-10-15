import { useState, useEffect } from "react";
//import CreateRoleModal from "./CreateRoleModal";
import { MyInfoProps } from "@/app/types/UserDetail";
import { useTranslation } from "../../../i18n";
import BaseButton from "@/components/Button";
import { toast } from "react-toastify";

const CreateOrderButton = ({
  onOrderCreated,
  onClose,
}: {
  onOrderCreated: () => void;
  onClose: () => void;
}) => {
  const [doctors, setDoctors] = useState([]);
  const [t, setT] = useState(() => (key: string) => key);

  useEffect(() => {
    const loadTranslation = async () => {
      const { t } = await useTranslation("orderManagement");
      setT(() => t);
    };
    loadTranslation();
  }, []);
  return (
    <BaseButton
      buttonText={t("Create Doctor")}
      //   modalComponent={
      //     <CreateOrderModal
      //       t={t}
      //       onOrderCreated={onOrderCreated}
      //       onClose={onClose}
      //     />
      //   }
      className="bg-blue-400 hover:bg-blue-500"
    />
  );
};
export default CreateOrderButton;
