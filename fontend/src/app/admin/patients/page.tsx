"use client";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import PatientList from "@/components/Admin/patient/PatientList";
import withLoading from "@/components/withLoading";
import AppLayout from "@/components/AppLayout";
import { PERMISSIONS } from "@/utils/constant";
import { PatientDetailProps } from "@/app/types/PatientDetail";
import { toast } from "react-toastify";
import { useTranslation } from "../../../i18n/client";
import { fetchPatientsList } from "@/services/apiService";

const PatientsPage = () => {
  const { user } = useUser();
  const [patients, setPatients] = useState<PatientDetailProps[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { t } = useTranslation("patientManagement");

  useEffect(() => {
    if (user) {
      fetchPatients(currentPage, searchQuery);
    }
  }, [user, currentPage, searchQuery]);

  const fetchPatients = async (page: number, query: string) => {
    try {
      const response = await fetchPatientsList({ page, search: query });
      setPatients(response.data?.data);
      console.log("1", response.data?.data);
      setTotalPages(
        Math.ceil(response.data?.count / response?.data?.page_size)
      );
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(t("You don't have permission to view patients"));
        router.back();
      } else {
        toast.error(t("Failed to fetch patients"));
        router.back();
      }
    }
  };

  const handlePatientSelect = (patientId: string) => {
    router.push(`/admin/patients/${patientId}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const debounce = (func: Function, wait: number) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 1000),
    []
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(event.target.value);
  };

  return (
    <AppLayout name={t("Patients")}>
      <div className="flex flex-col items-center justify-center min-h-screen w-full">
        <div className="w-full">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2 relative">
              <button
                className="bg-gray-400 rounded px-4 py-2 text-white"
                onClick={() => router.push("/home")}
              >
                {t("Home")}
              </button>
            </div>
          </div>
          <input
            type="text"
            placeholder={t("Search patients...")}
            onChange={handleSearchChange}
            className="mb-4 p-2 border-2 rounded "
          />
          <PatientList
            patients={patients}
            onSelectPatient={handlePatientSelect}
            patientPermissions={user?.permissions}
            isAdminUser={user?.is_superuser}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default PatientsPage;
