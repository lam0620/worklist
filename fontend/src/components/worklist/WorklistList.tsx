"use client";
import { WorkList } from "@/app/types/WorkList";
import { useEffect, useRef, useState } from "react";
import RelatedSession from "./RelatedSession";
import { fetchReportByProcId } from "@/services/apiService";
import ReactToPrint from "react-to-print";
import PdfComponent from "../../app/report/PDF/PdfComponent";
import { ReportDetailWorklist } from "@/app/types/ReportDetailWorkList";
import { PERMISSIONS } from "@/utils/constant";
import { useUser } from "@/context/UserContext";
import * as Util from "@/utils/utils";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation";

interface WorklistProps {
  worklist: WorkList[];
  onSelectProcID: (PID: string) => void;
  t: (key: string) => string;
  onRefresh: (page: number, query: string, onReFresh: boolean) => void;
  totalPages: number;
  onPageChange: (page: number) => void;
  currentPage: number;
  reportInf: ReportDetailWorklist;
  numRecord: number;
  loading: boolean;
  isAdvancedSearch: boolean;
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
  loading,
  isAdvancedSearch,
}: WorklistProps) => {
  const { user } = useUser();
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedRow, setSelectedRow] = useState("");
  const [reportCheck, setReportCheck] = useState(false); // to check the row has report?
  const [viewerCheck, setViewerCheck] = useState(false); // to check the row has image?
  const [patientInf, setPatientInf] = useState({
    pid: "",
    patientName: "",
    acn: "",
    study_iuid: "",
    status: "",
    procid: "",
  });
  const componentRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_DICOM_VIEWER_URL;

  const checkSelectedRow = async (item: any) => {
    try {
      setPatientInf((prev) => ({
        ...prev,
        pid: item.pat_pid,
        patientName: item.pat_fullname,
        acn: item.accession_no,
        study_iuid: item.study_iuid,
      }));

      // Get report data
      const response = await fetchReportByProcId(item.proc_id);

      if (response.status === 200 && response.data?.data.id) {
        const studyIuid = response.data?.data.study_iuid;
        const procStudyIuid = response.data?.data.proc_study_iuid;
        // Update studyiud
        setPatientInf((prev) => ({
          ...prev,
          study_iuid: procStudyIuid ? procStudyIuid : studyIuid, //priority to get proc_id, because in data have both
        }));
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        console.error("Error");
      } else {
        console.error("An error occurred:", error);
      }
    }

    setPatientInf((prev) => ({ ...prev, procid: item.proc_id }));
    handleCheckStatus(item.proc_status);

    onSelectProcID(item.proc_id);
    setSelectedRow(item.proc_id);
  };
  let viewerWindow: Window | null = null;
  let reportWindow: Window | null = null;

  const router = useRouter();

  const handleReportButton = () => {
    // const reportLink = `${API_BASE_URL}/report?StudyInstanceUIDs=${patientInf.study_iuid}&acn=${patientInf.acn}`;
    // if (!reportWindow || reportWindow.closed) {
    //   //handle no open new tab if this report screen exist (error)
    //   reportWindow = window.open(reportLink, "reportWindow");
    // } else {
    //   reportWindow.focus();
    // }
    const reportLink = `/report?StudyInstanceUIDs=${patientInf.study_iuid}&procid=${patientInf.procid}`;
    window.open(reportLink, "_blank");
  };

  const handleViewerButton = () => {
    const viewerLink = `${API_BASE_URL}/viewer?StudyInstanceUIDs=${patientInf.study_iuid}`;
    if (!viewerWindow || viewerWindow.closed) {
      //handle no open new tab if this viewer screen exist (error)
      viewerWindow = window.open(viewerLink, "viewerWindow");
    } else {
      viewerWindow.focus();
    }
  };

  const handleDownloadButton = () => {
    // Download
    const hostname = "http://192.168.201.54:8080";
    const baseUrl = `${hostname}/dcm4chee-arc/aets/DCM4CHEE/rs`;
    //const hostname = window.location.origin;
    //const baseUrl = `${hostname}/dicomweb/VHC/rs`;
    const url = `${baseUrl}/studies/${patientInf.study_iuid}?accept=application/zip;transfer-syntax=*`;
    //window.open(url, '_blank');
    // create <a> element dynamically
    let fileLink = document.createElement("a");
    fileLink.href = url;

    // suggest a name for the downloaded file
    fileLink.download = `${patientInf.study_iuid}.zip`;
    console.info(`Download... ${patientInf.study_iuid}`);
    // simulate click
    document.body.appendChild(fileLink);
    fileLink.click();
    document.body.removeChild(fileLink);
  };

  const handleRefreshButton = () => {
    onRefresh(1, "", false);
  };
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };
  const handleCheckStatus = (status: any) => {
    //check status when click a row
    setPatientInf((prev) => ({ ...prev, status: status }));
    setViewerCheck(Util.checkViewStatus(status));
    setReportCheck(Util.checkReportStatus(status));
  };

  const getVisiblePages = (currentPage: any, totalPages: any) => {
    //make sure only show the maximum pagination is 5 not if totalPages > 5
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, currentPage + 2);
    if (endPage - startPage < 4) {
      if (startPage === 1) {
        endPage = Math.min(startPage + 4, totalPages);
      } else if (endPage === totalPages) {
        startPage = Math.max(1, endPage - 4);
      }
    }
    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };
  const hasButtonViewerPermission =
    user?.permissions?.includes(PERMISSIONS.VIEW_IMAGE) || user?.is_superuser; // use this permission to view button and download button

  const hasButtonReportPermission =
    user?.permissions?.includes(PERMISSIONS.VIEW_REPORT) || user?.is_superuser;

  const hasButtonPrintPermission =
    user?.permissions?.includes(PERMISSIONS.PRINT_REPORT) || user?.is_superuser;
  return (
    <div className="h-screen">
      <div className="flex md:flex-grow my-1 text-white px-4 md:py-1.5 backgroundcolor-box">
        <div className="justify-between flex-col md:flex-row flex w-full">
          <div className="flex flex-col md:flex-row whitespace-nowrap">
            <div className="flex flex-row mb-2 md:mb-0 justify-center md:justify-start">
              {hasButtonViewerPermission && (
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
              )}
              {hasButtonReportPermission && (
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
                    {patientInf.status === "CM"
                      ? t("View Report")
                      : t("Report")}
                  </div>
                </button>
              )}
              {hasButtonPrintPermission && (
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
              )}
            </div>
            <div className="md:ml-14 flex flex-row justify-center md:justify-start">
              {hasButtonViewerPermission && (
                <button
                  title={t("Download")}
                  className={`btn-red-square mx-2   ${
                    selectedRow && viewerCheck
                      ? ""
                      : "btn-disable cursor-not-allowed"
                  }`}
                  onClick={handleDownloadButton}
                  disabled={!viewerCheck}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ fill: "none" }}
                    className={`lucide lucide-download ml-0  ${
                      selectedRow && viewerCheck ? "" : "svg-disabled"
                    }`}
                  >
                    <g transform="scale(0.8, 0.8) translate(3, 3)">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" x2="12" y1="15" y2="3" />
                    </g>
                  </svg>
                  <div className="text-[12px] px-2">{t("Download")}</div>
                </button>
              )}
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
          </div>
          <div className="mt-3 md:mt-0">
            <div className="flex flex-row justify-center md:justify-end">
              {numRecord > 0 && (
                <div className="flex items-center mr-3">
                  <span>
                    {numRecord} {t(numRecord > 1 ? "records" : "record")}
                  </span>
                </div>
              )}
              {totalPages > 1 && (
                <div className="sticky md:mr-5 mr-0">
                  <div className="flex text-xs md:text-sm">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-2 md:py-1 md:mx-1 button disabled:opacity-30 ${
                        currentPage === 1 ? "purple-selectedrow" : ""
                      }`}
                    >
                      {t("Previous")}
                    </button>
                    {getVisiblePages(currentPage, totalPages).map((page) => (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`px-3 py-1 md:mx-1 mx-0.5 button ${
                          currentPage === page ? "purple-selectedrow" : ""
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-2 md:py-1 md:mx-1  button disabled:opacity-30 ${
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
      </div>
      <div className="h-full md:h-[55%] scrollbar overflow-x-auto overflow-y-auto box-content">
        <div className="md:w-[1800px] whitespace-nowrap flex flex-row inbox rounded-t border-b bordervalue p-1">
          <div className="font-semibold text-center hidden md:block w-[6%]">
            {t("Status")}
          </div>
          <div className="font-semibold text-center md:hidden block w-[5%]"></div>
          <div className="font-semibold text-center w-1/3 md:w-[6%]">
            {t("PID")}
          </div>
          <div className="font-semibold text-center w-1/3 md:w-2/12">
            {t("Patient Name")}
          </div>
          <div className="font-semibold text-center w-1/3 md:w-[6%]">
            {t("Accession No")}
          </div>
          <div className="font-semibold text-center  hidden md:block w-1/12">
            {t("Order Date")}
          </div>
          <div className="font-semibold text-center hidden md:block w-1/12">
            {t("Study Date")}
          </div>
          <div className="font-semibold text-center  hidden md:block w-[6%]">
            {t("Modality")}
          </div>
          <div className="font-semibold text-center  hidden md:block w-[20%]">
            {t("Procedure")}
          </div>
          <div className="font-semibold text-center  hidden md:block w-2/12">
            {t("Referring Physician")}
          </div>
          <div className="font-semibold text-center  hidden md:block w-[3%]">
            {t("Instances")}
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-1/2 md:h-full">
            <LoadingSpinner />
          </div>
        ) : (
          <div
            className={`scrollbar overflow-y-auto md:overflow-auto ${
              isAdvancedSearch ? "h-1/2" : "h-2/3" //to responsive (scrollbar-y) the list when viewing mobile
            } md:h-[90%] md:w-[1800px]`}
          >
            {worklist.length > 0 ? (
              <ul>
                {worklist.map((item) => (
                  <li
                    key={`${item.id}-${item.proc_id}`} // make sure key is not duplicate, because item.id can have 2 in db
                    className={`flex flex-row items-center px-1 py-4 border-b bordervalue inboxlist hover-purple cursor-pointer ${
                      selectedRow === item.proc_id ? "purple-selectedrow" : ""
                    }`}
                    onClick={() => {
                      checkSelectedRow(item);
                    }}
                  >
                    <div className="text-center hidden md:block w-[6%]">
                      {t(Util.getStatusName(item.proc_status))}
                    </div>
                    <div className="text-center md:hidden block w-[5%]">
                      {item.proc_status}
                    </div>
                    <div className="text-center w-1/3 md:w-[6%]">
                      {item.pat_pid}
                    </div>
                    <div className="text-center w-1/3 md:w-2/12">
                      {item.pat_fullname}
                    </div>
                    <div className="text-center w-1/3 md:w-[6%]">
                      {item.accession_no}
                    </div>
                    <div className="text-center hidden md:block w-1/12">
                      {item.created_time.split(" ")[0]}
                    </div>
                    <div className="text-center hidden md:block w-1/12">
                      {item.study_created_time.split(" ")[0]}
                    </div>
                    <div className="text-center hidden md:block w-[6%]">
                      {item.modality_type}
                    </div>
                    <div className="text-center hidden md:block w-[20%]">
                      {item.proc_name}
                    </div>
                    <div className="text-center hidden md:block w-2/12">
                      {item.referring_phys_name}
                    </div>
                    <div className="text-center hidden md:block w-[3%] ml-2">
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
        )}
      </div>
      <div className=" md:block hidden h-3/4">
        <RelatedSession
          // pid={selectedItem}
          pid={patientInf.pid}
          patientName={patientInf.patientName}
          t={t}
          onSelectProcID={onSelectProcID}
        />
      </div>
      {reportInf != undefined && (
        <div style={{ display: "none" }}>
          <PdfComponent
            ref={componentRef}
            reportData={reportInf}
            templateData={true}
          />
        </div>
      )}
    </div>
  );
};

export default WorklistList;
