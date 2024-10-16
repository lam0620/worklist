"use client";
import { useTranslation } from "../../../i18n/client";
import { PERMISSIONS } from "@/utils/constant";
import { ReportDetailProps } from "@/app/types/ReportDetail";

import React, { useRef } from "react";

interface ReportListProps {
  reports: ReportDetailProps[];
  reportPermissions: string[];
  isAdminUser: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSelectReport: (reportId: string) => void;
}

const ReportList = ({
  reports,
  reportPermissions,
  isAdminUser,
  currentPage,
  totalPages,
  onPageChange,
  onSelectReport,
}: ReportListProps) => {
  const { t } = useTranslation("reportManagement");
  //const componentRef = useRef<HTMLDivElement>(null);
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const hasDeletePermission =
    (reportPermissions ?? []).includes(PERMISSIONS.VIEW_REPORT) || isAdminUser;

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-4 border-b bg-gray-100">
        <div className="w-1/12 font-semibold text-center">
          {t("Accession Number")}
        </div>
        <div className="w-1/12 font-semibold text-center">{t("Procedure")}</div>
        <div className="w-1/12 font-semibold text-center">
          {t("Patient ID")}
        </div>
        <div className="w-2/12 font-semibold text-center">
          {t("Patient Name")}
        </div>
        <div className="w-2/12 font-semibold text-center">{t("Findings")}</div>
        <div className="w-2/12 font-semibold text-center">
          {t("Conclusions")}
        </div>
        <div className="w-1/12 font-semibold text-center">
          {t("Radiologist")}
        </div>
        <div className="w-1/12 font-semibold text-center">
          {t("Created Time")}
        </div>
        <div className="w-1/12 font-semibold text-center">
          {t("View Image")}
        </div>
      </div>
      <ul className="flex-grow">
        {reports
          .filter((report) => report.status === "F" || report.status === "C")
          .map((report) => (
            <li
              key={report.accession_no}
              className="flex items-center justify-between p-4 border-b gap-x-4"
            >
              <div
                className="w-1/12 text-center cursor-pointer"
                onClick={() => onSelectReport(report.id)}
              >
                {report.accession_no}
              </div>
              <div className="w-1/12 text-center">{report.procedure.name}</div>
              <div className="w-1/12 text-center">{report.patient.pid}</div>
              <div className="w-2/12 text-center">
                {report.patient.fullname}
              </div>
              <div
                className="w-2/12 text-center px-5"
                dangerouslySetInnerHTML={{
                  __html:
                    report.findings.substring(0, 30) +
                    (report.findings.length > 30 ? "..." : ""),
                }}
              ></div>
              <div
                className="w-2/12 text-center px-5"
                dangerouslySetInnerHTML={{
                  __html:
                    report.conclusion.substring(0, 30) +
                    (report.conclusion.length > 30 ? "..." : ""),
                }}
              ></div>
              <div className="w-1/12 text-center">
                {report.radiologist.fullname}
              </div>
              <div className="w-1/12 text-center">{report.created_time}</div>
              <div className="w-1/12 text-center">
                <a
                  href={report.image_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-500 hover:underline"
                >
                  {t("View")}
                </a>
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
export default ReportList;
