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
import { ReportDetailProps } from "@/app/types/ReportDetail";
import ReportDetail from "@/components/Admin/report/ReportDetail";
import { fetchReportById } from "@/services/apiService";

const ReportDetalPage = () => {
  const { user } = useUser();
  const param = useParams<{ id: UUID }>();
  const [reportDetail, setReportDetail] = useState<ReportDetailProps>();
  const router = useRouter();
  const { t } = useTranslation("reportManagement");

  useEffect(() => {
    if (param.id && user) {
      fetchReportDetail();
    }
  }, [param.id, user]);

  const fetchReportDetail = async () => {
    try {
      const response = await fetchReportById(param.id);
      setReportDetail(response.data?.data);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        router.push("/404");
      }
    }
  };

  if (!reportDetail) {
    return <LoadingSpinner />;
  }

  const hasViewPermission =
    user?.permissions?.includes(PERMISSIONS.VIEW_REPORT) || user?.is_superuser;

  return (
    <AppLayout name={t("Report Detail")}>
      <div className="relative flex flex-col items-center min-h-screen p-4">
        <div className="w-full max-w-2xl text-center">
          <div className="absolute left-4 top-4">
            <button
              className="bg-gray-400 rounded px-4 py-2 text-white"
              onClick={() => router.push("/admin/reports")}
            >
              {t("Back to report list")}
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
            ></div>
          )}
          <div>
            <ReportDetail report={reportDetail} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
export default ReportDetalPage;
