"use client";
import { WorkList } from "@/app/types/WorkList";
import { useState } from "react";
import RelatedSession from "./RelatedSession";
interface WorklistProps {
  worklist: WorkList[];
  onSelectPID: (PID: string) => void;
  t: (key: string) => string;
}
const WorklistList = ({ worklist, onSelectPID, t }: WorklistProps) => {
  const [selectedItem, setSelectedItem] = useState("");
  const handleItemSelect = (id: string) => {
    setSelectedItem(id);
  };

  return (
    <div className="h-full">
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
                className="grid grid-cols-3 md:grid-cols-8 items-center px-4 py-4 border-b bordervalue inboxlist hover-purple"
              >
                <div className="text-center hidden md:block">{item.status}</div>
                <div
                  className="text-center cursor-pointer"
                  onClick={() => {
                    handleItemSelect(item.patient.pid);
                    onSelectPID(item.patient.pid);
                  }}
                >
                  {item.patient.pid}
                </div>
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
            <span className="text-white">No data available</span>
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
