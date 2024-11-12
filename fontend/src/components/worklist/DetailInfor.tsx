import { useState, useEffect } from "react";
import { fetchReportByProcId } from "@/services/apiService";
import { ReportDetailByProcID } from "@/app/types/ReportDetailByProcID";
import { toast } from "react-toastify";
import { formatDate,getReportStatusName } from "@/utils/utils";
interface DetailInforProps {
  proc_id: string;
  t: (key: string) => string;
}

const DetailInfor = ({ proc_id, t }: DetailInforProps) => {
  const emptyReport = {
    id: "",
    accession_no: "",
    study_iuid: "",
    findings: "",
    conclusion: "",
    scan_protocol: "",
    status: "",
    created_time: "",
    image_link: "",
    radiologist: { id: "", doctor_no: "", fullname: "", sign: "", title: "" },
    patient: { pid: "", fullname: "", gender: "", dob: "" },
    procedure: { proc_id: "", code: "", name: "" },
  };

  const [collapsed, setCollapsed] = useState(false);
  const [report, setReport] = useState<ReportDetailByProcID>();
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    if (proc_id) {
      fetchReport(proc_id);
    }
  }, [proc_id]);

  const fetchReport = async (id: string) => {
    try {
      const response = await fetchReportByProcId(id);
      if (
        response.status === 200 &&
        response.data?.result?.status === "OK" &&
        response.data?.result?.msg === ""
      ) {
        setReport(response.data?.data);
      } else {
        setReport(emptyReport);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(t("You don't have permission to view report"));
        //router.back();
      } else {
        toast.error(t("Failed to fetch report"));
        //router.back();
      }
      setReport(emptyReport);
    }
  };

  return (
    <div className={`${collapsed ? "w-0" : "w-1/4"}`}>
      {collapsed && (
        <div>
          <button
            className="toggle-button backgroundcolor-box text-white flex justify-center items-center z-50 fixed top-12 right-0"
            onClick={toggleSidebar}
            title={t("Mở rộng")}
          >
            {" "}
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
              className="lucide lucide-align-justify"
            >
              {" "}
              <path d="M3 12h18" /> <path d="M3 18h18" /> <path d="M3 6h18" />{" "}
            </svg>{" "}
          </button>
        </div>
      )}
      {!collapsed && (
        <div className="md:block hidden ohif-scrollbar overflow-y-auto border-l-4 h-full border-color-col">
          {report?.id ? (
            <div className="font-semibold text-sm ">
              <div className="flex justify-between items-center backgroundcolor-box p-2">
                <div className="text-blue-300 text-base">
                  {t("Patient Information")}
                </div>
                <div>
                  <button
                    className="toggle-button text-white"
                    onClick={toggleSidebar}
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
                      className="lucide lucide-align-justify"
                    >
                      <path d="M3 12h18" />
                      <path d="M3 18h18" />
                      <path d="M3 6h18" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mt-1 mb-1 flex flex-row justify-between inboxlist p-1">
                <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                  <span className="w-full text-left font-semibold">
                    {t("Patient Name")}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="pl-0 text-right">
                    {report?.patient.fullname}
                  </span>
                </div>
              </div>
              <div className="mb-1 flex flex-row justify-between inboxlist p-1">
                <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                  <span className="w-full text-left font-semibold">
                    {t("PID")}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="pl-0 text-right">{report?.patient.pid}</span>
                </div>
              </div>
              <div className="mb-1 flex flex-row justify-between inboxlist p-1">
                <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                  <span className="w-full text-left font-semibold">
                    {t("DOB")}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="pl-0 text-right">
                    {formatDate(report?.patient.dob)}
                  </span>
                </div>
              </div>

              <div className="px-1 font-semibold text-base text-blue-300 backgroundcolor-box p-2">
                {t("Order Information")}
              </div>

              <div className="mt-1 flex w-full flex-col p-1 text-right inboxlist text-sm">
                <div className="mb-1 flex flex-row justify-between">
                  <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                    <span className="w-full text-left font-semibold">
                      {t("Accession No")}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="pl-0 text-right">
                      {report?.accession_no}
                    </span>
                  </div>
                </div>
                <div className="mb-1 flex flex-row justify-between">
                  <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                    <span className="w-full text-left font-semibold">
                      {t("Procedure")}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="pl-0 text-right">
                      {report?.procedure.name}
                    </span>
                  </div>
                </div>
                <div className="mb-1 mt-1 flex flex-row justify-between">
                  <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                    <span className="w-full text-left font-semibold">
                      {t("Indication")}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="pl-0 text-right">
                      {report?.procedure.name}
                    </span>
                  </div>
                </div>

                <div className="mb-1 flex flex-row justify-between">
                  <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                    <span className="w-full text-left font-semibold">
                      {t("Referring Physician")}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="pl-0 text-right">
                      {report?.radiologist.fullname}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-1 font-semibold text-blue-300 text-base backgroundcolor-box p-2">
                {t("Report Information")}
              </div>

              <div className="flex w-full flex-col p-1 text-right inboxlist text-sm">
                <div className="mt-1 flex flex-row justify-between">
                  <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                    <span className="w-full text-left font-semibold">
                      {t("Status")}
                    </span>
                  </div>
                  <div className="flex flex-col">{t(getReportStatusName(report?.status))}</div>
                </div>

                <div className="mt-1 flex flex-row justify-between">
                  <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                    <span className="w-full text-right font-semibold">
                      {t("Radiologist")}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {report?.radiologist.fullname}
                  </div>
                </div>
              </div>

              <div className="px-1 pt-1 font-semibold text-blue-300 text-base backgroundcolor-box p-2">
                {t("Findings")}
              </div>
              <p
                className="inboxlist p-1"
                dangerouslySetInnerHTML={{ __html: report?.findings || "" }}
              ></p>
              <div className="px-1 pt-1 font-semibold text-blue-300 text-base backgroundcolor-box p-2">
                {t("Conclusion")}
              </div>
              <p
                className="inboxlist p-1"
                dangerouslySetInnerHTML={{ __html: report?.conclusion || "" }}
              ></p>
            </div>
          ) : (
            <div className="">
              <button
                className="toggle-button text-white"
                onClick={toggleSidebar}
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
                  className="lucide lucide-align-justify"
                >
                  <path d="M3 12h18" />
                  <path d="M3 18h18" />
                  <path d="M3 6h18" />
                </svg>
              </button>
              <div className="justify-center items-center text-center text-white">
                {t("No report yet")}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default DetailInfor;
