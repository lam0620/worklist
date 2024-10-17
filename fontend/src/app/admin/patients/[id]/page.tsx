"use client";

import { useEffect, useState } from "react";
import { UUID } from "crypto";
import { useParams } from "next/navigation";
import { PERMISSIONS } from "@/utils/constant";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useUser } from "@/context/UserContext";
import { useTranslation } from "../../../../i18n/client";
import { PatientDetailProps } from "@/app/types/PatientDetail";
import PatientDetail from "@/components/Admin/patient/PatientDetail";
import { fetchPatientById } from "@/services/apiService";
import EditPatientButton from "@/components/Admin/patient/EditPatientButton";

const PatientDetailPage = () => {
  const { user } = useUser();
  const param = useParams<{ id: UUID }>();
  const [patientDetail, setPatientDetail] = useState<PatientDetailProps>();
  const router = useRouter();
  const { t } = useTranslation("patientManagement");

  useEffect(() => {
    if (param.id && user) {
      fetchPatientDetail();
    }
  }, [param.id, user]);

  const fetchPatientDetail = async () => {
    try {
      const response = await fetchPatientById(param.id);
      setPatientDetail(response.data?.data);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        router.push("/404");
      }
    }
  };

  const HandleUpdateUse = (patient: any) => {
    setPatientDetail(patient);
  };

  if (!patientDetail) {
    return <LoadingSpinner />;
  }

  const hasViewPermission =
    user?.permissions?.includes(PERMISSIONS.VIEW_PATIENT) || user?.is_superuser;
  const hasEditPermission =
    user?.permissions?.includes(PERMISSIONS.EDIT_PATIENT) || user?.is_superuser;
  return (
    <AppLayout name={t("Patient Detail")}>
      <div className="relative flex flex-col items-center min-h-screen p-4">
        <div className="w-full max-w-2xl text-center">
          <div className="absolute left-4 top-4">
            <button
              className="bg-gray-400 rounded px-4 py-2 text-white"
              onClick={() => router.push("/admin/patients")}
            >
              {t("Back to patient list")}
            </button>
            <button
              className="bg-gray-400 rounded px-4 py-2 text-white ml-4"
              onClick={() => router.push("/home")}
            >
              {t("Home")}
            </button>
          </div>

          {user && (
            <div
              className="top-4 right-4 absolute flex items-center space-x-4"
              style={{ right: "100px" }}
            >
              {hasEditPermission && (
                <EditPatientButton
                  patientDetail={patientDetail}
                  onPatientUpdated={HandleUpdateUse}
                />
              )}
            </div>
          )}
          <div>
            <PatientDetail patient={patientDetail} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
export default PatientDetailPage;
