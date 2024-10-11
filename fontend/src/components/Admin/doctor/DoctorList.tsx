"use client";

import { Checkbox } from "@radix-ui/themes";
import { PERMISSIONS } from "@/utils/constant";
import { getGenderLabel } from "@/utils/utils";
import { DoctorDetailProps } from "@/app/types/DoctorDetail";
import { useTranslation } from "../../../i18n";
import { useState, useEffect } from "react";

interface DoctorListProps {
  buttonStatus: string;
  doctors: DoctorDetailProps[];
  onSelectDoctor: (doctorID: string) => void;
  onSelectDoctorForDelete: (doctorID: string, selected: boolean) => void;
  doctorPermissions: string[];
  isAdminUser: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedDoctors: { [key: string]: boolean };
}

const DoctorList = ({
  buttonStatus,
  doctors,
  onSelectDoctor,
  onSelectDoctorForDelete,
  doctorPermissions,
  isAdminUser,
  currentPage,
  totalPages,
  onPageChange,
  selectedDoctors,
}: DoctorListProps) => {
  const [t, setT] = useState(() => (key: string) => key);

  useEffect(() => {
    const loadTranslation = async () => {
      const { t } = await useTranslation("doctorManagement");
      setT(() => t);
    };
    loadTranslation();
  }, []);
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const hasDeletePermission =
    (doctorPermissions ?? []).includes(PERMISSIONS.DELETE_DOCTOR) ||
    isAdminUser;
  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-2 border-b bg-gray-100">
        <div className="w-2/12 font-semibold"></div>
        <div className="w-4/12 font-semibold">{t("Full name")}</div>
        <div className="w-3/12 font-semibold">{t("Doctor's code")}</div>
        <div className="w-3/12 font-semibold">{t("Username")}</div>
        <div className="w-2/12 font-semibold">{t("Gender")}</div>
        <div className="w-2/12 font-semibold">{t("Title")}</div>
        <div className="w-2/12 font-semibold">{t("Active")}</div>
      </div>
      <ul className="flex-grow">
        {doctors.map((doctor) => (
          <li
            key={doctor.id}
            className="flex items-center justify-between p-2 border-b"
          >
            <div className="w-2/12">
              <div className="flex items-center justify-center">
                {hasDeletePermission &&
                  (buttonStatus === "true" || buttonStatus === "false") && (
                    <Checkbox
                      checked={!!selectedDoctors[doctor.id]}
                      onCheckedChange={(checked) =>
                        onSelectDoctorForDelete(doctor.id, checked as boolean)
                      }
                      className="border-2 border-gray-400 rounded-sm h-4 w-4"
                    />
                  )}
              </div>
            </div>
            <div
              className="w-4/12 cursor-pointer"
              onClick={() => onSelectDoctor(doctor.id)}
            >
              {doctor.fullname}
            </div>
            <div className="w-3/12 flex flex-wrap gap-1">
              {doctor.doctor_no}
            </div>
            <div className="w-3/12 flex flex-wrap gap-1">{doctor.username}</div>
            <div className="w-2/12 flex flex-wrap gap-1">
              {getGenderLabel(doctor?.gender)}
            </div>
            <div className="w-2/12 flex flex-wrap gap-1">{doctor.title}</div>
            <div className="w-2/12 text-sm text-gray-500">
              <Checkbox
                checked={doctor.is_active}
                className="border-2 border-gray-400 rounded-sm h-4 w-4"
                style={{ cursor: "not-allowed" }}
              />
            </div>
          </li>
        ))}
      </ul>
      {totalPages > 1 && (
        <div className="sticky bottom-0 bg-white py-4">
          <div className="flex justify-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
            >
              {t("Previous")}
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={`px-4 py-2 mx-1 rounded-md ${
                  index + 1 === currentPage
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
            >
              {t("Next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorList;
