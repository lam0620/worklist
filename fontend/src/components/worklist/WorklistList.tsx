"use client";
import { WorkList } from "@/app/types/WorkList";
import { useRef, useState } from "react";
import RelatedSession from "./RelatedSession";
import * as Constants from "./Constants";
import { fetchReportByProcId } from "@/services/apiService";
import ReactToPrint from "react-to-print";
import PdfComponent from "./PdfComponent";
import { ReportDetailProps } from "@/app/types/ReportDetail";

interface WorklistProps {
  worklist: WorkList[];
  onSelectProcID: (PID: string) => void;
  t: (key: string) => string;
  onRefresh: (page: number, query: string) => void;
  totalPages: number;
  onPageChange: (page: number) => void;
  currentPage: number;
  reportInf: ReportDetailProps;
  numRecord: number;
}
const WorklistList = ({
  worklist,
  onSelectProcID,
  t,
  onRefresh,
  totalPages,
  onPageChange,
  currentPage,
  reportInf,
  numRecord,
}: WorklistProps) => {
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedRow, setSelectedRow] = useState("");
  const [reportCheck, setReportCheck] = useState(false);
  const [viewerCheck, setViewerCheck] = useState(false);
  const [patientInf, setPatientInf] = useState({
    patientName: "",
    acn: "",
    study_iuid: "",
    status: "",
  });
  const componentRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_DICOM_VIEWER_URL;

  const handleSelectedRowPid = (pid: any) => {
    setSelectedItem(pid);
  };

  const checkSelectedRow = async (id: any) => {
    try {
      const response = await fetchReportByProcId(id);
      if (response.status === 200 && response.data?.data.image_link) {
      }
      if (response.status === 200 && response.data?.data.id) {
        setPatientInf((prev) => ({
          ...prev,
          acn: response.data?.data.accession_no,
        }));
        const studyIuid = response.data?.data.study_iuid;
        const procStudyIuid = response.data?.data.proc_study_iuid;
        setPatientInf((prev) => ({
          ...prev,
          study_iuid: procStudyIuid ? procStudyIuid : studyIuid,
        }));
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        console.error("Error");
      } else {
        console.error("An error occurred:", error);
      }
    }
    onSelectProcID(id);
    setSelectedRow(id);
  };
  let viewerWindow: Window | null = null;
  let reportWindow: Window | null = null;

  const handleReportButton = () => {
    const reportLink = `${API_BASE_URL}/report?StudyInstanceUIDs=${patientInf.study_iuid}&acn=${patientInf.acn}`;
    if (!reportWindow || reportWindow.closed) {
      reportWindow = window.open(reportLink, "reportWindow");
    } else {
      reportWindow.focus();
    }
  };
  const handleViewerButton = () => {
    const viewerLink = `${API_BASE_URL}/viewer?StudyInstanceUIDs=${patientInf.study_iuid}`;
    if (!viewerWindow || viewerWindow.closed) {
      viewerWindow = window.open(viewerLink, "reportWindow");
    } else {
      viewerWindow.focus();
    }
  };

  const handleRefreshButton = () => {
    onRefresh(1, "");
  };
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };
  const handleCheckStatus = (status: any) => {
    setPatientInf((prev) => ({ ...prev, status: status }));
    setViewerCheck(Constants.checkViewStatus(status));
    setReportCheck(Constants.checkReportStatus(status));
  };

  return (
    <div className="h-full">
      <div className="flex md:flex-grow my-1 text-white px-4 py-2 backgroundcolor-box">
        <div className="justify-between flex-col md:flex-row flex w-full">
          <div className="flex flex-row whitespace-nowrap">
            <button
              title={t("View Image")}
              className={`btn-red-square mx-2   ${
                selectedRow && viewerCheck
                  ? ""
                  : "btn-disable cursor-not-allowed"
              }`}
              onClick={handleViewerButton}
              disabled={!viewerCheck}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`lucide lucide-eye ml-0  ${
                  selectedRow && viewerCheck ? "" : "svg-disabled"
                }`}
              >
                <g transform="scale(0.8, 0.8) translate(3, 3)">
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                  <circle cx="12" cy="12" r="3" />
                </g>
              </svg>
              <div className="text-[12px] px-2">{t("View Image")}</div>
            </button>
            <button
              title={t("Report")}
              className={`btn-red-square mx-2 ${
                selectedRow && reportCheck
                  ? ""
                  : "btn-disable cursor-not-allowed"
              }`}
              onClick={handleReportButton}
              disabled={!reportCheck}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="19"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`lucide lucide-file-text  ${
                  selectedRow && reportCheck ? "" : "svg-disabled"
                }`}
              >
                <g transform="scale(0.8, 0.8) translate(3, 3)">
                  <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                  <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  <path d="M10 9H8" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                </g>
              </svg>
              <div className="text-[12px] px-2">
                {patientInf.status === "CM" ? t("View Report") : t("Report")}
              </div>
            </button>
            <ReactToPrint
              trigger={() => (
                <button
                  title={t("Print")}
                  className={`btn-red-square mx-2 ${
                    selectedRow && patientInf.status === "CM"
                      ? ""
                      : "btn-disable cursor-not-allowed"
                  }`}
                  disabled={patientInf.status !== "CM"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ fill: "none" }}
                    width="22"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`lucide lucide-printer ${
                      selectedRow && patientInf.status === "CM"
                        ? ""
                        : "svg-disabled"
                    }`}
                  >
                    <g transform="scale(0.8, 0.8) translate(3, 3)">
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
                      <rect x="6" y="14" width="12" height="8" rx="1" />
                    </g>
                  </svg>
                  <div className="text-[12px] px-2">{t("Print")}</div>
                </button>
              )}
              content={() => componentRef.current}
            />
            <button
              title={t("Refresh")}
              className="btn-red-square mx-2"
              onClick={handleRefreshButton}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-refresh-cw"
              >
                <g transform="scale(0.8, 0.8) translate(3, 3)">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M8 16H3v5" />
                </g>
              </svg>
              <div className="text-[12px] px-2">{t("Refresh")}</div>
            </button>
          </div>
          <div className="mt-3 md:mt-0">
            {totalPages > 1 && (
              <div className="sticky flex flex-row justify-center md:justify-end md:mr-5 mr-0">
                <div className="flex items-center mr-3">
                  <span>
                    {numRecord} {t(numRecord > 1 ? "records" : "record")}
                  </span>
                </div>
                <div className="flex justify-center text-sm">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-2 py-1 mx-1 button disabled:opacity-30 ${
                      currentPage === 1 ? "purple-selectedrow" : ""
                    }`}
                  >
                    {t("Previous")}
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-3 py-1 mx-1 button ${
                        currentPage === index + 1 ? "purple-selectedrow" : ""
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-2 py-1 mx-1 button disabled:opacity-30 ${
                      currentPage === totalPages ? "purple-selectedrow" : ""
                    }`}
                  >
                    {t("Next")}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="whitespace-nowrap grid grid-cols-3 md:grid-cols-8 inbox rounded-t border-b bordervalue px-4 py-2">
        <div className="font-semibold text-center ml-[-10px] hidden md:block">
          {t("Status")}
        </div>
        <div className="font-semibold text-center ml-[-10px]">{t("PID")}</div>
        <div className="font-semibold text-center ml-[-10px]">
          {t("Patient Name")}
        </div>
        <div className="font-semibold text-center ml-[-10px]">
          {t("Accession No")}
        </div>
        <div className="font-semibold text-center ml-[-10px] hidden md:block">
          {t("Order Date")}
        </div>

        <div className="font-semibold text-center ml-[-15px] hidden md:block">
          {t("Modality")}
        </div>
        <div className="font-semibold text-center ml-[-20px] hidden md:block">
          {t("Procedure")}
        </div>

        <div className="font-semibold text-center ml-[-20px] hidden md:block">
          {t("Instances")}
        </div>
      </div>
      <div className="scrollbar overflow-y-auto h-3/4 md:h-1/2">
        {worklist.length > 0 ? (
          <ul>
            {worklist.map((item) => (
              <li
                key={`${item.id}-${item.proc_id}`} // make sure key is not duplicate, because item.id can have 2 in db
                className={`grid grid-cols-3 md:grid-cols-8 items-center px-4 py-4 border-b bordervalue inboxlist hover-purple cursor-pointer ${
                  selectedRow === item.proc_id ? "purple-selectedrow" : ""
                }`}
                onClick={() => {
                  checkSelectedRow(item.proc_id);
                  handleSelectedRowPid(item.pat_pid);
                  setPatientInf((prev) => ({
                    ...prev,
                    patientName: item.pat_fullname,
                  }));
                  handleCheckStatus(item.proc_status);
                }}
              >
                <div className="text-center hidden md:block">
                  {t(Constants.getStatusName(item.proc_status))}
                </div>
                <div className="text-center">{item.pat_pid}</div>
                <div className="text-center">{item.pat_fullname}</div>
                <div className="text-center">{item.accession_no}</div>
                <div className="text-center hidden md:block">
                  {item.created_time.split(" ")[0]}
                </div>

                <div className="text-center hidden md:block">
                  {item.modality_type}
                </div>
                <div className="text-center hidden md:block">
                  {item.proc_name}
                </div>
                <div className="text-center hidden md:block">
                  {item.num_instances}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center pt-44 md:pt-44">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="111"
              height="111"
              viewBox="0 0 111 111"
              className="mb-4"
            >
              <g
                fill="none"
                fillRule="evenodd"
                stroke="#3A3F99"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                transform="translate(2 2)"
              >
                <circle
                  cx="53.419"
                  cy="53.419"
                  r="53.419"
                  fill="#06081D"
                ></circle>
                <circle cx="49.411" cy="49.411" r="23.862"></circle>
                <path d="M66.282 66.282 81.29 81.29"></path>
              </g>
            </svg>
            <span className="text-white">{t("No data available")}</span>
          </div>
        )}
      </div>
      <div className=" md:block hidden h-3/4">
        <RelatedSession
          pid={selectedItem}
          patientName={patientInf.patientName}
          t={t}
          onSelectProcID={onSelectProcID}
        />
      </div>
      <div style={{ display: "none" }}>
        <PdfComponent ref={componentRef} reportInf={reportInf} />
      </div>
    </div>
  );
};

export default WorklistList;
