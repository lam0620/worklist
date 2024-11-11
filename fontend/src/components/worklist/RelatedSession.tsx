"use client";
import { useState, useEffect } from "react";
import { fetchRelatedStudies } from "@/services/apiService";
import { OrderDetailProps } from "@/app/types/OrderDetail";
import { toast } from "react-toastify";
import "../../app/worklist/worklist.css";
import DetailInfor from "@/components/worklist/DetailInfor";
import * as Constants from "./Constants";
interface DetailInforProps {
  pid: string;
  patientName: string;
  t: (key: string) => string;
  onSelectProcID: (PID: string) => void;
}

const RelatedSession = ({
  pid,
  t,
  patientName,
  onSelectProcID,
}: DetailInforProps) => {
  const [relatedStudies, setRelatedStudies] = useState<OrderDetailProps[]>([]);
  //const [selectedItem, setSelectedItem] = useState("");
  const [selectedRow, setSelectedRow] = useState("");
  const [selectedProcID, setSelectedProcID] = useState("");

  // const handleSelectedRow = (id: any) => {
  //   setSelectedItem(id);
  // };

  const handleProcIDSelect = (ProcID: string) => {
    onSelectProcID(ProcID);
    setSelectedProcID(ProcID);
    setSelectedRow(ProcID);
  };

  useEffect(() => {
    if (pid) {
      fetchRelatedStudy(pid);
    }
  }, [pid]);
  const fetchRelatedStudy = async (id: string) => {
    try {
      const response = await fetchRelatedStudies(id);
      setRelatedStudies(response?.data.data);
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(t("You don't have permission to view worklist"));
        //router.back();
      } else {
        toast.error(t("Failed to fetch worklist"));
        //router.back();
      }
    }
  };
  return (
    <div className="h-full bottom-0 mt-2 border-t-4 border-color-col">
      <div className="flex justify-between items-center backgroundcolor-box px-2 py-2">
        <div className="text-blue-300 text-base">
          {t("Related Studies")} : {patientName}
        </div>
      </div>
      <div className="mt-1">
        <div className="px-2 flex flex-row inbox py-1 whitespace-nowrap">
          <div className="w-1/12 font-semibold text-center ">{t("Status")}</div>
          <div className="w-1/12 font-semibold text-center hidden md:block">
            {t("PID")}
          </div>
          <div className="w-1/12 font-semibold text-center hidden md:block">
            {t("Accession No")}
          </div>
          <div className="w-2/12 font-semibold text-center">
            {t("Procedure")}
          </div>
          <div className="w-1/12 font-semibold text-center hidden md:block">
            {t("Created_time")}
          </div>
          <div className="w-2/12 font-semibold text-center">
            {t("Modality")}
          </div>
          <div className="w-2/12 font-semibold text-center">
            {t("Ordering Physician")}
          </div>
          <div className="w-2/12 font-semibold text-center">
            {t("Reading Physician")}
          </div>
        </div>
      </div>
      <div className="scrollbar overflow-y-auto h-1/3">
        {relatedStudies.length > 0 && (
          <ul>
            {relatedStudies.flatMap((item) =>
              item.procedures?.map((procedure) => (
                <li
                  key={`${item.id}-${procedure.proc_id}`}
                  className={`mt-1 bordervalue inboxlist hover-purple cursor-pointer ${
                    selectedRow === procedure.proc_id
                      ? "purple-selectedrow"
                      : ""
                  }`}
                  onClick={() => {
                    //handleSelectedRow(item.id);
                    handleProcIDSelect(procedure.proc_id);
                  }}
                >
                  <div className="flex flex-row py-2 whitespace-nowrap">
                    <div className="mx-2 w-1/12 font-semibold text-center hidden md:block">
                      {Constants.getStatusName(
                        item.procedures?.map((procedure) => procedure.status)
                      )}
                    </div>
                    <div className="w-1/12 font-semibold text-center hidden md:block">
                      {item.patient.pid}
                    </div>
                    <div className="w-1/12 font-semibold text-center hidden md:block">
                      {item.accession_no}
                    </div>
                    <div className="w-2/12 font-semibold text-center">
                      <span>{procedure.name}</span>
                    </div>
                    <div className="w-1/12 font-semibold text-center hidden md:block">
                      {item.created_time}
                    </div>
                    <div className="w-2/12 font-semibold text-center">
                      {item.modality_type}
                    </div>
                    <div className="w-2/12 font-semibold text-center">
                      {item.referring_phys_name}
                    </div>
                    <div className="w-2/12 font-semibold text-center">
                      {procedure.report.radiologist && (
                        <span>{procedure.report.radiologist.fullname}</span>
                      )}
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
      {selectedProcID && <DetailInfor proc_id={selectedProcID} t={t} />}
    </div>
  );
};
export default RelatedSession;
