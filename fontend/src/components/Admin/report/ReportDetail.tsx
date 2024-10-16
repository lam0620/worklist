import React, { useRef } from "react";
import ReactToPrint from "react-to-print"; //build error
import { useTranslation } from "../../../i18n/client";
import { ReportDetailProps } from "@/app/types/ReportDetail";

interface Props {
  report: ReportDetailProps | null;
}

const ReportDetail: React.FC<Props> = ({ report }) => {
  const { t } = useTranslation("reportManagement");
  const componentRef = useRef<HTMLDivElement>(null);

  return (
    <div className="flex flex-col items-center justify-center min-h-8 px-4">
      <div className="bg-white rounded shadow-md w-full max-w-4xl">
        <div ref={componentRef}>
          <form className="space-y-6">
            {[
              { label: t("Accession Number"), value: report?.accession_no },
              //   { label: t("Study IUID"), value: report?.study_iuid },
              { label: t("Patient ID"), value: report?.patient.pid },
              { label: t("Patient Name"), value: report?.patient.fullname },
              { label: t("Procedure"), value: report?.procedure.name },
              {
                label: t("Radiologist"),
                value: `${report?.radiologist.title} ${report?.radiologist.fullname}`,
              },
              {
                label: t("Findings"),
                value: (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: report?.findings || "",
                    }}
                  />
                ),
              },
              {
                label: t("Conclusion"),
                value: (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: report?.conclusion || "",
                    }}
                  />
                ),
              },
              { label: t("Created time"), value: report?.created_time },
            ].map((field, index) => (
              <div key={index} className="flex items-center">
                <label className="w-1/3 font-medium text-right">
                  {field.label}
                </label>
                <div className="flex-1 border rounded p-3 bg-gray-50 ml-4">
                  {field.value}
                </div>
              </div>
            ))}
          </form>
        </div>
        <div className="flex flex-col items-center justify-center min-h-8 px-4">
          {/* <ReactToPrint
            trigger={() => (
              <button className="button-class">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ fill: "none" }}
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-printer"
                >
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
                  <rect x="6" y="14" width="12" height="8" rx="1" />
                </svg>
                {t("Print Preview")}
              </button>
            )}
            content={() => componentRef.current}
          />
          <div style={{ display: "none" }}>
            <PDFComponent ref={componentRef} report={report} />
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default ReportDetail;
