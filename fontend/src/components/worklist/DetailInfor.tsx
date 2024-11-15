import { useState, useEffect } from "react";
import { fetchReportByProcId } from "@/services/apiService";
import { toast } from "react-toastify";
import { formatDate, getReportStatusName } from "@/utils/utils";
import { ReportDetailProps } from "@/app/types/ReportDetail";
import { useUser } from "@/context/UserContext";
import { PERMISSIONS } from "@/utils/constant";
interface DetailInforProps {
  proc_id: string;
  t: (key: string) => string;
  reportInf: (report: ReportDetailProps) => void;
  setCollapseDetail: React.Dispatch<React.SetStateAction<boolean>>;
}

const DetailInfor = ({
  proc_id,
  t,
  reportInf,
  setCollapseDetail,
}: DetailInforProps) => {
  const emptyReport = {
    id: "",
    accession_no: "",
    study_iuid: "",
    findings: "",
    conclusion: "",
    scan_protocol: "",
    status: "",
    clinical_diagnosis: "",
    referring_phys_code: "",
    referring_phys_name: "",
    created_time: "",
    image_link: "",
    modality_type: "",
    radiologist: { id: "", doctor_no: "", fullname: "", sign: "", title: "" },
    patient: {
      pid: "",
      fullname: "",
      gender: "",
      dob: "",
      tel: "",
      address: "",
      insurance_no: "",
    },
    procedure: { proc_id: "", code: "", name: "" },
  };

  const { user } = useUser();
  const [collapsed, setCollapsed] = useState(false);
  const [report, setReport] = useState<ReportDetailProps>();
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    setCollapseDetail(collapsed);
  }, [collapsed]);

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
        reportInf(response.data?.data);
      } else {
        reportInf(emptyReport);
        setReport(emptyReport);
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        //router.back();
      } else {
        toast.error(error);
        //router.back();
      }
      setReport(emptyReport);
    }
  };

  const hasReportPermission =
    user?.permissions?.includes(PERMISSIONS.VIEW_REPORT) || user?.is_superuser;

  return (
    <div className={`${collapsed ? "w-0" : "w-1/4"}`}>
      {collapsed && (
        <div>
          <button
            className="toggle-button backgroundcolor-box text-white flex justify-center items-center z-50 fixed right-0 md:block hidden"
            style={{ top: "60px" }}
            onClick={toggleSidebar}
            title={t("Mở rộng")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              className="text-primary-active"
            >
              <g fill="none" fillRule="evenodd">
                <path d="M20 0H0v20h20z"></path>
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M17 10.406H7.166M11.235 6.337l-4.069 4.07 4.07 4.068M3.758 14.475V6.337"
                ></path>
              </g>
            </svg>
          </button>
        </div>
      )}
      {!collapsed && (
        <div className="md:block hidden ohif-scrollbar scrollbar overflow-y-auto border-l-4 h-full border-color-col">
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
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      className="text-primary-active"
                    >
                      <g fill="none" fillRule="evenodd">
                        <path d="M0 0h20v20H0z"></path>
                        <path
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M3 10.406h9.834M8.765 6.337l4.069 4.07-4.07 4.068M16.242 14.475V6.337"
                        ></path>
                      </g>
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
                      {report?.clinical_diagnosis}
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
                      {report?.referring_phys_name}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-1 font-semibold text-blue-300 text-base backgroundcolor-box p-2">
                {t("Report Information")}
              </div>

              <div className="flex w-full flex-col text-right inboxlist text-sm">
                <div className="mt-1 flex flex-row justify-between p-1">
                  <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                    <span className="w-full text-left font-semibold">
                      {t("Status")}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={
                        report?.status === "D" ? "text-red-500" : "text-white"
                      }
                    >
                      {t(getReportStatusName(report?.status))}
                    </span>
                  </div>
                </div>
                <div className="mt-1 flex flex-row justify-between p-1">
                  <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                    <span className="w-full text-right font-semibold">
                      {t("Radiologist")}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {report?.radiologist.fullname}
                  </div>
                </div>
                <div className="mt-1 flex flex-row justify-between p-1">
                  <div className="mr-4 flex flex-col items-center whitespace-nowrap">
                    <span className="w-full text-right font-semibold">
                      {t("Report Date")}
                    </span>
                  </div>
                  <div className="flex flex-col">{report?.created_time}</div>
                </div>
              </div>
              <div className="px-1 pt-1 text-blue-300 font-semibold text-base">
                {t("Scan Protocol")}
              </div>
              <p
                className="inboxlist p-1"
                dangerouslySetInnerHTML={{
                  __html: report?.scan_protocol || "",
                }}
              ></p>
              <div className="px-1 pt-1 text-blue-300 font-semibold text-base">
                {t("Findings")}
              </div>
              <p
                className="inboxlist p-1"
                dangerouslySetInnerHTML={{ __html: report?.findings || "" }}
              ></p>
              <div className="px-1 pt-1 text-blue-300 font-semibold text-base">
                {t("Conclusion")}
              </div>
              <p
                className="inboxlist p-1"
                dangerouslySetInnerHTML={{ __html: report?.conclusion || "" }}
              ></p>
            </div>
          ) : (
            <div>
              <button
                className="toggle-button text-white"
                onClick={toggleSidebar}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  className="text-primary-active"
                >
                  <g fill="none" fillRule="evenodd">
                    <path d="M0 0h20v20H0z"></path>
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M3 10.406h9.834M8.765 6.337l4.069 4.07-4.07 4.068M16.242 14.475V6.337"
                    ></path>
                  </g>
                </svg>
              </button>
              <div className="justify-center items-center text-center text-white mx-5">
                {!hasReportPermission
                  ? t("You don't have permission to view report")
                  : t("No report yet")}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default DetailInfor;
