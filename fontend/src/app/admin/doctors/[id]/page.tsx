"use client";
import { useEffect, useState } from "react";
import DoctorDetail from "@/components/Admin/doctor/DoctorDetail";
import { fetchDoctorById } from "@/services/apiService";
import { UUID } from "crypto";
import { useParams } from "next/navigation";
import { PERMISSIONS } from "@/utils/constant";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { DoctorDetailProps } from "@/app/types/DoctorDetail";
import { useUser } from "@/context/UserContext";
import EditDoctorButton from "@/components/Admin/doctor/EditDoctorButton";
import { useTranslation } from "../../../../i18n/client";

const DoctorDetailPage = () => {
  const { user } = useUser();
  const param = useParams<{ id: UUID }>();
  const [doctorDetail, setDoctorDetail] = useState<DoctorDetailProps>();
  const router = useRouter();
  const { t } = useTranslation("doctorManagement");

  useEffect(() => {
    if (param.id) {
      fetchDoctorsDetail();
    }
  }, [param.id]);

  const fetchDoctorsDetail = async () => {
    try {
      const response = await fetchDoctorById(param.id);
      setDoctorDetail(response.data?.data);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        router.push("/404");
      }
    }
  };

  const HandleUpdateUse = (doctor: any) => {
    setDoctorDetail(doctor);
  };

  if (!doctorDetail) {
    return <LoadingSpinner />;
  }
  const hasEditPermission =
    user?.permissions?.includes(PERMISSIONS.EDIT_DOCTOR) || user?.is_superuser;

  return (
    <AppLayout name={t("Doctor Detail")}>
      <div className="relative flex flex-col items-center min-h-screen p-4">
        <div className="w-full max-w-2xl text-center">
          <div className="absolute left-4 top-4">
            <button
              className="bg-gray-400 rounded px-4 py-2 text-white"
              onClick={() => router.push("/admin/doctors")}
            >
              {t("Back to doctor list")}
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
                <EditDoctorButton
                  doctorDetail={doctorDetail}
                  onDoctorUpdated={HandleUpdateUse}
                />
              )}
            </div>
          )}
          <div>
            <DoctorDetail doctor={doctorDetail} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default DoctorDetailPage;
