"use client";
import { PERMISSIONS } from "@/utils/constant";
import { PatientDetailProps } from "@/app/types/PatientDetail";
import { useTranslation } from "../../../i18n/client";
import { getGenderLabel } from "@/utils/utils";
import { formatDate } from "@/utils/utils";

interface PatientListProps {
  patients: PatientDetailProps[];
  onSelectPatient: (patientid: string) => void;
  patientPermissions: string[];
  isAdminUser: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PatientList = ({
  patients,
  onSelectPatient,
  patientPermissions,
  isAdminUser,
  currentPage,
  totalPages,
  onPageChange,
}: PatientListProps) => {
  const { t } = useTranslation("patientManagement");

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };
  const hasViewPermission =
    (patientPermissions ?? []).includes(PERMISSIONS.VIEW_PATIENT) ||
    isAdminUser;

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-2 border-b bg-gray-100">
        <div className="w-2/12 font-semibold text-center">
          {t("Patient ID")}
        </div>
        <div className="w-3/12 font-semibold text-center">
          {t("Patient Name")}
        </div>
        <div className="w-2/12 font-semibold text-center">{t("Gender")}</div>
        <div className="w-2/12 font-semibold text-center">{t("DOB")}</div>
        <div className="w-3/12 font-semibold text-center">{t("Address")}</div>
      </div>

      {hasViewPermission && (
        <ul className="flex-grow">
          {patients.map((patient) => (
            <li
              key={patient.id}
              className="flex items-center justify-between p-2 border-b"
            >
              <div
                className="w-2/12 cursor-pointer text-center"
                onClick={() => onSelectPatient(patient.id)}
              >
                {patient.pid}
              </div>
              <div className="w-3/12 flex flex-wrap gap-1 justify-center">
                {patient.fullname}
              </div>
              <div className="w-2/12 flex flex-wrap gap-1 justify-center">
                {getGenderLabel(patient.gender)}
              </div>

              <div className="w-2/12 flex flex-wrap gap-1 justify-center">
                {formatDate(patient.dob)}
              </div>
              <div className="w-3/12 flex flex-wrap gap-1 justify-center">
                {patient.address}
              </div>
            </li>
          ))}
        </ul>
      )}

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

export default PatientList;
