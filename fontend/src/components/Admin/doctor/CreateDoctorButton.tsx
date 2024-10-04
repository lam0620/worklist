import BaseButton from "@/components/Button";
import CreateDoctorModal from "./CreateDoctorModal";
import { fetchAccountsList, fetchDoctorsList } from "@/services/apiService";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTranslation } from "../../../i18n";

const CreateDoctorButton = ({
  onDoctorCreated,
  onClose,
}: {
  onDoctorCreated: () => void;
  onClose: () => void;
}) => {
  const [users, setUsers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [t, setT] = useState(() => (key: string) => key);

  useEffect(() => {
    const loadTranslation = async () => {
      const { t } = await useTranslation("doctorManagement");
      setT(() => t);
    };
    loadTranslation();
    fetchUsers().then((r) => r);
    fetchDoctors().then((r) => r);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetchAccountsList();
      setUsers(response.data?.data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(t("You don't have permission to view users"));
      } else {
        toast.error(t("Failed to fetch users"));
      }
    }
  };
  const fetchDoctors = async () => {
    try {
      const response = await fetchDoctorsList();
      setDoctors(response.data?.data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(t("You don't have permission to view users"));
      } else {
        toast.error(t("Failed to fetch users"));
      }
    }
  };

  return (
    <BaseButton
      buttonText={t("Create Doctor")}
      modalComponent={
        <CreateDoctorModal
          t={t}
          doctors={doctors}
          users={users}
          onDoctorCreated={onDoctorCreated}
          onClose={onClose}
        />
      }
      className="bg-blue-400 hover:bg-blue-500"
    />
  );
};

export default CreateDoctorButton;
