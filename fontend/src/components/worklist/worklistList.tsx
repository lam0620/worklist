"use client";
import { WorkList } from "@/app/types/WorkList";
import { use, useState, useEffect } from "react";
import RelatedSession from "./RelatedSession";
import { fetchReportById } from "@/services/apiService";
interface WorklistProps {
  worklist: WorkList[];
  onSelectPID: (PID: string) => void;
  t: (key: string) => string;
  onRefresh: (page: number, query: string) => void;
  totalPages: number;
  onPageChange: (page: number) => void;
  currentPage: number;
}
const WorklistList = ({
  worklist,
  onSelectPID,
  t,
  onRefresh,
  totalPages,
  onPageChange,
  currentPage,
}: WorklistProps) => {
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedRow, setSelectedRow] = useState("");
  const [reportCheck, setReportCheck] = useState(Boolean);
  const [linkImage, setLinkImage] = useState("");

  const handleSelectedRow = (pid: any) => {
    setSelectedRow(pid);
    handleItemSelect(pid);
    onSelectPID(pid);
    setSelectedRow(selectedRow === pid ? null : pid);
  };

  const handleItemSelect = (id: string) => {
    setSelectedItem(id);
  };

  const checkReportSelectedRow = async (id: any) => {
    //check button viewer, report by report id
    try {
      const response = await fetchReportById(id);
      if (response.status === 200 && response.data?.data.image_link) {
        setLinkImage(response.data?.data.image_link);
        setReportCheck(true);
      } else {
        setReportCheck(false);
      }
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        setReportCheck(false);
        console.error("Report not found");
      } else {
        console.error("An error occurred:", error);
      }
    }
  };
  let viewerWindow: Window | null = null;
  let reportWindow: Window | null = null;

  const handleViewerButton = () => {
    if (!viewerWindow || viewerWindow.closed) {
      viewerWindow = window.open(linkImage, "viewerWindow");
    } else {
      viewerWindow.focus();
    }
  };

  const handleReportButton = () => {
    const reportLink =
      "http://192.168.201.46:3000/report?StudyInstanceUIDs=2.25.138033689927558170645655251560996505939&acn=578358"; // test link
    if (!reportWindow || reportWindow.closed) {
      reportWindow = window.open(reportLink, "reportWindow");
    } else {
      reportWindow.focus();
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

  return (
    <div className="h-full">
      <div className="flex md:flex-grow my-1 text-white px-4 py-2 backgroundcolor-box">
        <div className="justify-between flex-row flex w-full">
          <div className="flex flex-row">
            <button
              title={t("Viewer")}
              className={`btn-red-square mx-2 ${
                selectedRow && reportCheck ? "" : "btn-disable"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24ds"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                onClick={handleViewerButton}
                className={`lucide lucide-eye ${
                  selectedRow && reportCheck ? "" : "svg-disabled"
                }`}
              >
                <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
            <button
              title={t("Report")}
              className={`btn-red-square mx-2 ${
                selectedRow && reportCheck ? "" : "btn-disable"
              }`}
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
                onClick={handleReportButton}
                className={`lucide lucide-file-text ${
                  selectedRow && reportCheck ? "" : "svg-disabled"
                }`}
              >
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M10 9H8" />
                <path d="M16 13H8" />
                <path d="M16 17H8" />
              </svg>
            </button>
            <button title={t("Refresh")} className="btn-red-square mx-2">
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
                onClick={handleRefreshButton}
                className="lucide lucide-refresh-cw"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                <path d="M21 3v5h-5" />
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                <path d="M8 16H3v5" />
              </svg>
            </button>
          </div>
          <div>
            {totalPages > 1 && (
              <div className="sticky">
                <div className="flex justify-center text-sm">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-2 py-1 mx-1 button disabled:opacity-30"
                  >
                    {t("Previous")}
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-3 py-1 mx-1  button `}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 mx-1 button disabled:opacity-30"
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
          {t("Created_time")}
        </div>
        <div className="font-semibold text-center ml-[-15px] hidden md:block">
          {t("Modality")}
        </div>
        <div className="font-semibold text-center ml-[-20px] hidden md:block">
          {t("Produce")}
        </div>
        <div className="font-semibold text-center ml-[-20px] hidden md:block">
          {t("Quantity Image")}
        </div>
      </div>
      <div className="scrollbar h-3/4 md:h-1/2">
        {worklist.length > 0 ? (
          <ul>
            {worklist.map((item) => (
              <li
                key={item.id}
                className={`grid grid-cols-3 md:grid-cols-8 items-center px-4 py-4 border-b bordervalue inboxlist hover-purple cursor-pointer ${
                  selectedRow === item.patient.pid ? "purple-selectedrow" : ""
                }`}
                onClick={() => {
                  handleSelectedRow(item.patient.pid);
                  checkReportSelectedRow(item.id);
                }}
              >
                <div className="text-center hidden md:block">{item.status}</div>
                <div className="text-center">{item.patient.pid}</div>
                <div className="text-center">{item.patient.fullname}</div>
                <div className="text-center">{item.accession_no}</div>
                <div className="text-center hidden md:block">
                  {new Date(item.created_time).toLocaleDateString()}
                </div>
                <div className="text-center hidden md:block">
                  {item.modality_type}
                </div>
                <div className="text-center hidden md:block">
                  {item.procedure?.map((procedure) => (
                    <div key={procedure.proc_id}>
                      <span>{procedure.name}</span>
                    </div>
                  ))}
                </div>
                <div className="text-center hidden md:block">
                  {item.procedure.map((procedure) => (
                    <span key={procedure.proc_id}>{procedure.count_image}</span>
                  ))}
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
        <RelatedSession pid={selectedItem} t={t} />
      </div>
    </div>
  );
};

export default WorklistList;
