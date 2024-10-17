import { useState, useEffect } from "react";
import EditPatientForm from "./EditPatientForm";
import { fetchPatientsList } from "@/services/apiService";
import { toast } from "react-toastify";
import { useTranslation } from "../../../i18n";

interface EditPatientButtonProps {
  patientDetail: any;
  onPatientUpdated: (patient: any) => void;
}

const EditPatientButton = ({
  patientDetail,
  onPatientUpdated,
}: EditPatientButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const [t, setT] = useState(() => (key: string) => key);

  useEffect(() => {
    const loadTranslation = async () => {
      const { t } = await useTranslation("patientManagement");
      setT(() => t);
    };
    loadTranslation();
    fetchPatients().then((r) => r);
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await fetchPatientsList();
      console.log(response);
      setPatients(response.data?.data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(t("You don't have permission to view patients"));
      } else {
        toast.error(t("Failed to fetch patients"));
      }
    }
  };
  return (
    <div>
      <button
        onClick={handleOpenModal}
        className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500"
      >
        {t("Edit Patient")}
      </button>
      {isModalOpen && (
        <EditPatientForm
          t={t}
          patient={patientDetail}
          onEdit={(patientUpdate) => {
            onPatientUpdated(patientUpdate);
            handleCloseModal();
          }}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};
export default EditPatientButton;
