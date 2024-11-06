import { useState, useEffect } from "react";
import { fetchReportById } from "@/services/apiService";
import { ReportDetailProps } from "@/app/types/ReportDetail";
import { toast } from "react-toastify";
import { formatDate } from "@/utils/utils";
interface DetailInforProps {
  pid: string;
  t: (key: string) => string;
}

const DetailInfor = ({ pid, t }: DetailInforProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [report, setReport] = useState<ReportDetailProps>();
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    if (pid) {
      setCollapsed(false);
      fetchReport("6bc2da41-5b60-4999-b648-42dfd66e9d4c");
    }
  }, [pid]);
  const fetchReport = async (id: string) => {
    try {
      const response = await fetchReportById(id);
      console.log(response);
      setReport(response.data?.data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(t("You don't have permission to view report"));
        //router.back();
      } else {
        toast.error(t("Failed to fetch report"));
        //router.back();
      }
    }
  };

  return (
    !collapsed && (
      <div className="md:block hidden ohif-scrollbar overflow-y-hidden w-0 md:w-1/6 border-l-4 border-color-col">
        <div className="font-semibold text-sm">
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
              <span className=" w-full text-left  font-semibold">
                {t("Patient Name")}
              </span>
            </div>
            <div className="flex flex-col">
              <span className=" pl-0 text-right ">
                {report?.patient.fullname}
              </span>
            </div>
          </div>
          <div className="mb-1 flex flex-row justify-between inboxlist p-1">
            <div className="mr-4 flex flex-col items-center whitespace-nowrap">
              <span className=" w-full text-left  font-semibold">
                {t("PID")}
              </span>
            </div>
            <div className="flex flex-col">
              <span className=" pl-0 text-right ">{pid}</span>
            </div>
          </div>
          <div className="mb-1 flex flex-row justify-between inboxlist p-1">
            <div className="mr-4 flex flex-col items-center whitespace-nowrap">
              <span className=" w-full text-left  font-semibold">
                {t("DOB")}
              </span>
            </div>
            <div className="flex flex-col">
              <span className=" pl-0 text-right ">
                {formatDate(report?.patient.dob)}
              </span>
            </div>
          </div>
        </div>

        <div className="px-1 font-semibold text-base text-blue-300 backgroundcolor-box p-2">
          {t("Order Information")}
        </div>

        <div className="mt-1 flex w-full flex-col p-1 text-right inboxlist text-sm">
          <div className="mb-1 flex flex-row justify-between">
            <div className="mr-4 flex flex-col items-center whitespace-nowrap">
              <span className=" w-full text-left  font-semibold">
                {t("Accession No")}
              </span>
            </div>
            <div className="flex flex-col">
              <span className=" pl-0 text-right ">{report?.accession_no}</span>
            </div>
          </div>
          <div className="mb-1 flex flex-row justify-between">
            <div className="mr-4 flex flex-col items-center whitespace-nowrap">
              <span className=" w-full text-left  font-semibold">
                {t("Produce")}
              </span>
            </div>
            <div className="flex flex-col">
              <span className=" pl-0 text-right ">
                {report?.procedure.name}
              </span>
            </div>
          </div>
          <div className="mb-1 mt-1 flex flex-row justify-between">
            <div className="mr-4 flex flex-col items-center whitespace-nowrap">
              <span className=" w-full text-left  font-semibold">
                {t("Indication")}
              </span>
            </div>
            <div className="flex flex-col">
              <span className=" pl-0 text-right ">
                {/* {orderData.clinical_diagnosis} */}
              </span>
            </div>
          </div>

          <div className="mb-1 flex flex-row justify-between">
            <div className="mr-4 flex flex-col items-center whitespace-nowrap">
              <span className=" w-full text-left  font-semibold">
                {t("Ordering Physician")}
              </span>
            </div>
            <div className="flex flex-col">
              <span className=" pl-0 text-right ">
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
              <span className=" w-full text-left  font-semibold">
                {t("Status")}
              </span>
            </div>
            <div className="flex flex-col">{report?.status}</div>
          </div>

          <div className=" mt-1 flex flex-row justify-between">
            <div className="mr-4 flex flex-col items-center whitespace-nowrap">
              <span className="w-full text-right  font-semibold">
                {t("Radiologist")}
              </span>
            </div>
            <div className="flex flex-col ">{report?.radiologist.fullname}</div>
          </div>
        </div>

        <div className="px-1 pt-1 font-semibold text-blue-300 text-base backgroundcolor-box p-2">
          {t("Findings")}
        </div>
        {/* {["F", "C"].includes(reportData.status) ? (
          <div className="mt-1 pl-2">
            <span className=" text-left ">
              <div dangerouslySetInnerHTML={{ __html: reportData.findings }} />
            </span>
          </div>
        ) : (
          <span className=" pl-1 text-left ">
            No report yet
          </span>
        )} */}
        <p
          className="inboxlist p-1"
          dangerouslySetInnerHTML={{ __html: report?.findings || "" }}
        ></p>

        <div className="px-1 pt-1 font-semibold text-blue-300 text-base backgroundcolor-box p-2">
          {t("Conclusion")}
        </div>
        {/* {["F", "C"].includes(reportData.status) ? (
          <div className="mt-1 pl-2">
            <span className=" text-left ">
              <div
                dangerouslySetInnerHTML={{ __html: reportData.conclusion }}
              />
            </span>
          </div>
        ) : (
          <span className=" pl-1 text-left ">
            No report yet
          </span>
        )} */}
        <p
          className="inboxlist p-1"
          dangerouslySetInnerHTML={{ __html: report?.conclusion || "" }}
        ></p>
      </div>
    )
  );
};
export default DetailInfor;
