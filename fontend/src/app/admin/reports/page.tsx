"use client";

import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import ReportList from "@/components/Admin/report/ReportList";
import withLoading from "@/components/withLoading";
import AppLayout from "@/components/AppLayout";
import { PERMISSIONS } from "@/utils/constant";
import { ReportDetailProps } from "@/app/types/ReportDetail";
import { toast } from "react-toastify";
import { useTranslation } from "../../../i18n/client";
import { fetchReportsList } from "@/services/apiService";

const ReportsPage = () => {
  const { user } = useUser();
  const [reports, setReports] = useState<ReportDetailProps[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { t } = useTranslation("reportManagement");

  useEffect(() => {
    if (user) {
      fetchReports(currentPage, searchQuery);
    }
  }, [user, currentPage, searchQuery]);

  const fetchReports = async (page: number, query: string) => {
    try {
      const response = await fetchReportsList({ page, search: query });
      setReports(response.data?.data);
      console.log("1", response.data?.data);
      setTotalPages(
        Math.ceil(response.data?.count / response?.data?.page_size)
      );
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(t("You don't have permission to view reports"));
        router.back();
      } else {
        toast.error(t("Failed to fetch reports"));
        router.back();
      }
    }
  };

  const handleReportSelect = (reportId: string) => {
    router.push(`/admin/reports/${reportId}`);
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

  const hasViewReportPermission =
    user?.permissions?.includes(PERMISSIONS.VIEW_REPORT) || user?.is_superuser;

  return (
    <AppLayout name={t("Reports")}>
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
            placeholder={t("Search reports...")}
            onChange={handleSearchChange}
            className="mb-4 p-2 border-2 rounded "
          />
          <ReportList
            reports={reports}
            onSelectReport={handleReportSelect}
            reportPermissions={user?.permissions}
            isAdminUser={hasViewReportPermission}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>
    </AppLayout>
  );
};
export default withLoading(ReportsPage);
