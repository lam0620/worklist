"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import DoctorList from "@/components/Admin/doctor/DoctorList";
import { useUser } from "@/context/UserContext";
import { fetchDoctorsList } from "@/services/apiService";
import AppLayout from "@/components/AppLayout";
import { PERMISSIONS } from "@/utils/constant";
import { toast } from "react-toastify";
import CreateDoctorButton from "@/components/Admin/doctor/CreateDoctorButton";
import ChangeActiveDoctorButton from "@/components/Admin/doctor/ChangeActiveDoctorButton";

const DocterListPage = () => {
  const { user } = useUser();
  const [doctors, setDoctors] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoctors, setSelectedDoctors] = useState<{
    [key: string]: boolean;
  }>({});

  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("");

  useEffect(() => {
    if (user) {
      fetchDoctor(currentPage, searchQuery, activeFilter).then((r) => r);
    }
  }, [user, currentPage, searchQuery, activeFilter]);

  const fetchDoctor = async (
    page: number,
    query: string,
    is_active: string
  ) => {
    try {
      const response = await fetchDoctorsList({
        page: page,
        search: query,
        is_active: is_active,
      });
      setDoctors(response.data?.data);

      setTotalPages(
        Math.ceil(response.data?.count / response?.data?.page_size)
      );
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error("You don't have permission to view doctors");
        router.back();
      } else {
        toast.error("Failed to fetch doctors");
        router.back();
      }
    }
  };

  const handleDoctorSelect = (doctorId: string) => {
    router.push(`/admin/doctors/${doctorId}`);
  };

  const hasAddDoctorPermission =
    user?.permissions?.includes(PERMISSIONS.ADD_DOCTOR) || user?.is_superuser;

  const hasActiveDoctorPermission =
    user?.permissions?.includes(PERMISSIONS.ACTIVE_DOCTOR) ||
    user?.is_superuser;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleDoctorCheck = (doctorId: string, checked: boolean) => {
    setSelectedDoctors((prev) => ({ ...prev, [doctorId]: checked }));
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
    }, 300),
    []
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(event.target.value);
  };
  const handleActiveChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveFilter(event.target.value);
    setSelectedDoctors({});
  };
  const handleDoctorChangeActive = async () => {
    //set null checkbox after change active doctor
    await fetchDoctor(currentPage, searchQuery, activeFilter);
    setSelectedDoctors({});
  };

  return (
    <AppLayout name="Doctors">
      <div className="flex flex-col items-center justify-center min-h-screen w-full">
        <div className="w-full">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2 relative">
              <button
                className="bg-gray-400 rounded px-4 py-2 text-white"
                onClick={() => router.push("/home")}
              >
                Home
              </button>
              {hasActiveDoctorPermission &&
                (activeFilter === "true" || activeFilter === "false") && (
                  <ChangeActiveDoctorButton
                    buttonStatus={activeFilter}
                    doctorIds={Object.keys(selectedDoctors).filter(
                      (doctorId) => selectedDoctors[doctorId]
                    )}
                    onDoctorChangeActive={handleDoctorChangeActive}
                    isDisable={
                      Object.keys(selectedDoctors).filter(
                        (doctorId) => selectedDoctors[doctorId]
                      ).length === 0
                    }
                  />
                )}

              {hasAddDoctorPermission && (
                <CreateDoctorButton
                  onDoctorCreated={() =>
                    fetchDoctor(currentPage, searchQuery, activeFilter)
                  }
                  onClose={() => {}}
                />
              )}
            </div>
          </div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2 relative">
              <input
                type="text"
                placeholder="Search doctors..."
                onChange={handleSearchChange}
                className="mb-4 p-2 border rounded"
              />
              <select
                className="mb-4 p-2 border rounded"
                onChange={handleActiveChange}
              >
                <option value="all">All</option>
                <option value="true">Active</option>
                <option value="false">Deactive</option>
              </select>
            </div>
          </div>

          <DoctorList
            buttonStatus={activeFilter}
            doctors={doctors}
            onSelectDoctor={handleDoctorSelect}
            onSelectDoctorForDelete={handleDoctorCheck}
            doctorPermissions={user?.permissions}
            isAdminUser={user?.is_superuser}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            selectedDoctors={selectedDoctors}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default DocterListPage;
