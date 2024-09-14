import { useState, useEffect } from "react";
import EditDoctorForm from "./EditDoctorForm";
import { fetchAccountsList, fetchDoctorsList } from "@/services/apiService";
import { toast } from "react-toastify";

interface EditDoctorButtonProps {
  doctorDetail: any;
  onDoctorUpdated: (doctor: any) => void;
}

const EditDoctorButton = ({
  doctorDetail,
  onDoctorUpdated,
}: EditDoctorButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers().then((r) => r);
    fetchDoctors().then((r) => r);
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetchAccountsList();
      setUsers(response.data?.data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error("You don't have permission to view users");
      } else {
        toast.error("Failed to fetch users");
      }
    }
  };
  const fetchDoctors = async () => {
    try {
      const response = await fetchDoctorsList();
      setDoctors(response.data?.data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error("You don't have permission to view users");
      } else {
        toast.error("Failed to fetch users");
      }
    }
  };
  return (
    <div>
      <button
        onClick={handleOpenModal}
        className="bg-blue-400 text-white px-4 py-2 rounded hover:bg-blue-500"
      >
        Edit Doctor
      </button>
      {isModalOpen && (
        <EditDoctorForm
          doctors={doctors}
          users={users}
          doctor={doctorDetail}
          onEdit={(doctorUpdate) => {
            onDoctorUpdated(doctorUpdate);
            handleCloseModal();
          }}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default EditDoctorButton;
