"use client";
import { useState, useEffect } from "react";
import { fetchRelatedStudies } from "@/services/apiService";
import { RelatedStudies } from "@/app/types/RelatedStudies";
import { toast } from "react-toastify";
import "../../app/worklist/worklist.css";
import DetailInfor from "@/components/worklist/DetailInfor";
interface DetailInforProps {
  pid: string;
  t: (key: string) => string;
}

const RelatedSession = ({ pid, t }: DetailInforProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [relatedStudies, setRelatedStudies] = useState<RelatedStudies[]>([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedRow, setSelectedRow] = useState(null);

  const handleSelectedRow = (id: any) => {
    setSelectedRow(id);
    handleItemSelect(id);
    setSelectedRow(selectedRow === id ? null : id);
  };

  const handleItemSelect = (id: string) => {
    setSelectedItem(id);
  };
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  useEffect(() => {
    if (pid) {
      setCollapsed(false);
      fetchRelatedStudy(pid);
    }
  }, [pid]);
  const fetchRelatedStudy = async (id: string) => {
    try {
      const response = await fetchRelatedStudies(id);
      console.log(response);
      setRelatedStudies(response?.data);
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
    !collapsed && (
      <div className="h-full bottom-0 mt-2 border-t-4 border-color-col">
        <div className="flex justify-between items-center backgroundcolor-box px-2 py-2">
          <div className="text-blue-300 text-base">{t("Related Studies")}</div>
          {/* <div>
            <button
              className="toggle-button text-white"
              onClick={toggleSidebar}
            >
              <svg
                stroke="currentColor"
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11,15.2928932 L11,4.5 C11,4.22385763 11.2238576,4 11.5,4 C11.7761424,4 12,4.22385763 12,4.5 L12,15.2928932 L15.1464466,12.1464466 C15.3417088,11.9511845 15.6582912,11.9511845 15.8535534,12.1464466 C16.0488155,12.3417088 16.0488155,12.6582912 15.8535534,12.8535534 L11.8535534,16.8535534 C11.6582912,17.0488155 11.3417088,17.0488155 11.1464466,16.8535534 L7.14644661,12.8535534 C6.95118446,12.6582912 6.95118446,12.3417088 7.14644661,12.1464466 C7.34170876,11.9511845 7.65829124,11.9511845 7.85355339,12.1464466 L11,15.2928932 Z M4.5,20 C4.22385763,20 4,19.7761424 4,19.5 C4,19.2238576 4.22385763,19 4.5,19 L18.5,19 C18.7761424,19 19,19.2238576 19,19.5 C19,19.7761424 18.7761424,20 18.5,20 L4.5,20 Z" />
              </svg>
            </button>
          </div> */}
        </div>
        <div className="mt-1">
          <div className="px-2 flex flex-row inbox py-1 whitespace-nowrap">
            <div className="w-1/12 font-semibold text-center ">
              {t("Status")}
            </div>
            <div className="w-1/12 font-semibold text-center hidden md:block">
              {t("PID")}
            </div>
            <div className="w-1/12 font-semibold text-center hidden md:block">
              {t("Accession No")}
            </div>
            <div className="w-2/12 font-semibold text-center">
              {t("Produce")}
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
        <div
          className="scrollbar h-1/3"
          // style={{ maxHeight: "704px" }}
        >
          {relatedStudies.length > 0 && (
            <ul>
              {relatedStudies.map((item) => (
                <li
                  key={item.id}
                  className={` mt-1 bordervalue inboxlist hover-purple cursor-pointer ${
                    selectedRow === item.id ? "purple-selectedrow" : ""
                  }`}
                  onClick={() => {
                    handleSelectedRow(item.id);
                  }}
                >
                  <div className="flex flex-row py-2 whitespace-nowrap">
                    <div className="mx-2 w-1/12 font-semibold text-center hidden md:block">
                      {item.status}
                    </div>
                    <div className="w-1/12 font-semibold text-center  hidden md:block ">
                      {item.pid}
                    </div>
                    <div className="w-1/12 font-semibold text-center hidden md:block">
                      {item.acn}
                    </div>
                    <div className="w-2/12 font-semibold text-center">
                      {item.procedu}
                    </div>
                    <div className="w-1/12 font-semibold text-center hidden md:block">
                      {item.created_date}
                    </div>
                    <div className="w-2/12 font-semibold text-center">
                      {item.modality}
                    </div>
                    <div className="w-2/12 font-semibold text-center">
                      {item.ordering_physician}
                    </div>
                    <div className="w-2/12 font-semibold text-center">
                      {item.reading_physician}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* {selectedItem && <DetailInfor pid={selectedItem} t={t} />} */}
      </div>
    )
  );
};
export default RelatedSession;
