"use client";
import { useTranslation } from "../../i18n";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchWorklist } from "@/services/apiService";
import { useUser } from "@/context/UserContext";
import { WorkList } from "@/app/types/WorkList";
import { toast } from "react-toastify";
import logo from "../../../public/images/org_logo.png";
import Image from "next/image";
import "./worklist.css";
import WorklistList from "@/components/worklist/WorklistList";
import DetailInfor from "@/components/worklist/DetailInfor";
import UserAvatar from "../../components/Avatar";

const Worklist = () => {
  const router = useRouter();
  router.push("/worklist");
  const { user } = useUser();
  const [t, setT] = useState(() => (key: string) => key);
  useEffect(() => {
    const loadTranslation = async () => {
      const { t } = await useTranslation("worklist");
      setT(() => t);
    };
    loadTranslation();
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [workList, setWorkList] = useState<WorkList[]>([]);
  const [initialWorkList, setInitialWorkList] = useState<WorkList[]>([]);
  const [isAdvancedSearch, setAdvancedSearch] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [searchPid, setSearchPid] = useState("");
  const [searchFullName, setSearchFullName] = useState("");
  const [searchAcn, setSearchAcn] = useState("");
  const [searchFromDate, setSearchFromDate] = useState("");
  const [searchToDate, setSearchToDate] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [selectedProcID, setSelectedProcID] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    //use for expand or collapse if pc or phone (left panel)
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (user) {
      fetchWorkList(currentPage, searchQuery).then((r) => r);
    }
  }, [user, searchQuery, currentPage]);

  useEffect(() => {
    if (user) {
      handleSearch();
    }
  }, [
    selectedDate,
    searchPid,
    searchFullName,
    searchAcn,
    searchFromDate,
    searchToDate,
    selectedDevices,
    selectedStatuses,
  ]);

  const fetchWorkList = async (page: number, query: string) => {
    try {
      const response = await fetchWorklist({ page, search: query });
      setWorkList(response?.data.data);
      setInitialWorkList(response?.data.data);
      setTotalPages(
        Math.ceil(response.data?.count / response?.data?.page_size)
      );
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

  const handleSearch = async () => {
    const searchParams = new URLSearchParams({
      modality_type: selectedDevices.join(","),
      status: selectedStatuses.join(","),
      patient_name: searchFullName,
      accession_no: searchAcn,
      patient_pid: searchPid,
      created_at_after: searchFromDate,
      created_at_before: searchToDate,
    });

    const params = Object.fromEntries(searchParams.entries());

    try {
      const response = await fetchWorklist(params);
      if (response.status === 200 && response.data?.result?.status === "OK") {
        setWorkList(response?.data.data);
      } else {
        setWorkList([]);
      }
    } catch (error) {
      console.error("Error fetching orders list:", error);
    }
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleAdvancedSearch = () => {
    setAdvancedSearch(!isAdvancedSearch);
    setSearchQuery("");
    setSearchPid("");
    setSearchFullName("");
    setSearchAcn("");
    setSearchFromDate("");
    setSearchToDate("");
    setSelectedDate("");
  };

  const debounce = (func: Function, wait: number) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 1000),
    []
  );
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(event.target.value);
  };

  const handleCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    stateUpdater: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const { value, checked } = event.target;
    stateUpdater((prev) =>
      value === "All"
        ? checked
          ? ["All"]
          : []
        : checked
        ? prev.filter((item) => item !== "All").concat(value)
        : prev.filter((item) => item !== value)
    );
  };

  const handleCheckboxModality = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleCheckboxChange(event, setSelectedDevices);
  };

  const handleCheckboxStatus = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleCheckboxChange(event, setSelectedStatuses);
  };

  const handleFilterByDate = (startDate: Date, endDate: Date) => {
    const filteredItems = initialWorkList.filter((item) => {
      const createdDate = new Date(item.created_time);
      return createdDate >= startDate && createdDate <= endDate;
    });
    setWorkList(filteredItems);
  };
  const handleFilterToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    handleFilterByDate(today, tomorrow);
  };
  const handleFilterYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const today = new Date(yesterday);
    today.setDate(yesterday.getDate() + 1);
    handleFilterByDate(yesterday, today);
  };
  const handleFilterLast7Days = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const last7Days = new Date(today);
    last7Days.setDate(today.getDate() - 7);
    handleFilterByDate(last7Days, today);
  };
  const handleFilterAll = () => {
    setWorkList(initialWorkList);
  };
  const handlesearchPid = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchPid(event.target.value);
  };

  const handlesearchFullName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchFullName(event.target.value);
  };

  const handlesearchAcn = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchAcn(event.target.value);
  };
  const handlesearchFromDate = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchFromDate(event.target.value);
  };
  const handlesearchToDate = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchToDate(event.target.value);
  };

  const handleProcIDSelect = (ProcID: string) => {
    setSelectedProcID(ProcID);
  };

  return (
    <div className="flex flex-col h-screen text-sm md:text-base">
      <header className="w-full flex justify-between items-center bg-top text-white p-1">
        <Image src={logo} className="max-w-16 ml-5" alt="logo" />
        <div className="mr-5">
          {/* <Avatar.Root className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-800 cursor-pointer">
            <Avatar.Image
              className="w-full h-full rounded-full"
              src=""
              alt="User avatar"
            />
            <Avatar.Fallback className="flex items-center justify-center w-full h-full rounded-full text-white"></Avatar.Fallback>
          </Avatar.Root> */}
          <div className="z-50 text-black">
            {user && (
              <UserAvatar
                firstName={user.first_name}
                lastName={user.last_name}
                avatarColor={user.avatar_color}
              />
            )}
          </div>
        </div>
      </header>
      <div className="flex flex-1 backgroundcolor overflow-y-hidden">
        {/* left panel  */}
        {!collapsed && (
          <div className="body-left inboxlist w-56 transition-all duration-300 ease-in-out h-screen border-r-4 border-color-col md:static absolute left-0 z-50">
            <div className="">
              {!collapsed && (
                <div className="">
                  <div className="flex justify-between items-center backgroundcolor-box">
                    <span className="flex p-2 text-left justify-start">
                      {t("Modality")}
                    </span>

                    <button
                      className="toggle-button backgroundcolor-box px-2 py-1 text-white"
                      onClick={toggleSidebar}
                      title={t("Thu gọn")}
                    >
                      {collapsed ? (
                        ""
                      ) : (
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
                      )}
                    </button>
                  </div>
                  <ul className="p-2 backgroundcolor">
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        value="All"
                        checked={selectedDevices.includes("All")}
                        onChange={handleCheckboxModality}
                      />
                      {t("All")}
                    </li>
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        value="MR"
                        checked={selectedDevices.includes("MR")}
                        onChange={handleCheckboxModality}
                      />
                      MR
                    </li>
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        value="CT"
                        checked={selectedDevices.includes("CT")}
                        onChange={handleCheckboxModality}
                      />
                      CT
                    </li>
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        value="X-Ray"
                        checked={selectedDevices.includes("X-Ray")}
                        onChange={handleCheckboxModality}
                      />
                      X-Ray
                    </li>
                  </ul>
                </div>
              )}
              {!collapsed && (
                <div>
                  <div className="flex justify-between items-center backgroundcolor-box">
                    <span className="p-2">{t("Status")}</span>
                  </div>
                  <ul className="p-4 backgroundcolor">
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        value="All"
                        checked={selectedStatuses.includes("All")}
                        onChange={handleCheckboxStatus}
                      />
                      {t("All")}
                    </li>
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        value="SC"
                        checked={selectedStatuses.includes("SC")}
                        onChange={handleCheckboxStatus}
                      />
                      {t("Scheduled")}
                    </li>
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        value="IM"
                        checked={selectedStatuses.includes("IM")}
                        onChange={handleCheckboxStatus}
                      />
                      {t("No report")}
                    </li>
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        value="IP"
                        checked={selectedStatuses.includes("IP")}
                        onChange={handleCheckboxStatus}
                      />
                      {t("Reporting")}
                    </li>
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        value="CM"
                        checked={selectedStatuses.includes("CM")}
                        onChange={handleCheckboxStatus}
                      />
                      {t("Reported")}
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        {/* right panel  */}
        <div className="w-full backgroundcolor">
          {!isAdvancedSearch && (
            <div className="flex flex-col pr-9 pl-2 pb-1 mb-1 md:flex-row justify-between items-center pt-1 backgroundcolor-box">
              <div className="w-full md:w-1/4 mb-2 md:mb-0 flex items-center">
                {collapsed && (
                  <div className="flex items-center mr-2">
                    <button
                      className="toggle-button backgroundcolor-box text-white flex justify-center items-center"
                      onClick={toggleSidebar}
                      title={t("Mở rộng")}
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
                )}
                <input
                  type="text"
                  placeholder={t("Quick search ...")}
                  onChange={handleSearchChange}
                  className="transition duration-300 appearance-none border border-inputfield-main focus:border-inputfield-focus focus:outline-none disabled:border-inputfield-disabled rounded w-3/5 py-2 px-3 text-sm text-white placeholder-inputfield-placeholder leading-tight bg-black"
                />
                <button
                  onClick={toggleAdvancedSearch}
                  className="text-red-400 underline ml-1 md:ml-2 text-sm whitespace-nowrap"
                >
                  {t("Advanced search")}
                </button>
              </div>
              <div className="w-full md:w-auto flex flex-wrap">
                <div className="w-1/2 md:w-auto p-1">
                  <button
                    className="button px-2 py-1 rounded mb-1 md:mb-0 md:mr-1 w-full md:w-auto text-sm hover-purple"
                    onClick={handleFilterToday}
                  >
                    Today
                  </button>
                </div>
                <div className="w-1/2 md:w-auto p-1">
                  <button
                    className="button px-2 py-1 rounded mb-1 md:mb-0 md:mr-1 w-full md:w-auto text-sm hover-purple"
                    onClick={handleFilterYesterday}
                  >
                    Yesterday
                  </button>
                </div>
                <div className="w-1/2 md:w-auto p-1">
                  <button
                    className="button px-2 py-1 rounded mb-1 md:mb-0 md:mr-1 w-full md:w-auto text-sm hover-purple"
                    onClick={handleFilterLast7Days}
                  >
                    7 days
                  </button>
                </div>
                <div className="w-1/2 md:w-auto p-1">
                  <button
                    className="button px-2 py-1 rounded w-full md:w-auto text-sm hover-purple"
                    onClick={handleFilterAll}
                  >
                    All
                  </button>
                </div>
              </div>
            </div>
          )}
          {isAdvancedSearch && (
            <div className="advanced-search inbox p-1 mb-1 rounded md:p-3">
              <div className="flex flex-col md:flex-row w-full md:space-x-4">
                {collapsed && (
                  <div className="flex items-center">
                    <button
                      className="toggle-button backgroundcolor-box text-white flex justify-center items-center"
                      onClick={toggleSidebar}
                      title={t("Mở rộng")}
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
                )}
                <div className="flex items-center justify-center md:flex-col md:flex-grow px-2 text-white">
                  <label className="w-1/3 md:w-full text-white md:text-center text-sm">
                    {t("PID")}
                  </label>
                  <input
                    type="text"
                    className="py-1 px-1 mt-2 transition duration-300 appearance-none border border-inputfield-main focus:border-inputfield-focus focus:outline-none disabled:border-inputfield-disabled rounded w-2/4 md:w-3/4 text-sm text-white placeholder-inputfield-placeholder leading-tight bg-black"
                    onChange={handlesearchPid}
                  />
                </div>
                <div className="flex items-center justify-center md:flex-col md:flex-grow px-2">
                  <label className="w-1/3 md:w-full text-white md:text-center text-sm">
                    {t("Patient Name")}
                  </label>
                  <input
                    type="text"
                    className="py-1 px-1 mt-2 transition duration-300 appearance-none border border-inputfield-main focus:border-inputfield-focus focus:outline-none disabled:border-inputfield-disabled rounded w-2/4 md:w-3/4 text-sm text-white placeholder-inputfield-placeholder leading-tight bg-black"
                    onChange={handlesearchFullName}
                  />
                </div>
                <div className="flex items-center justify-center md:flex-col md:flex-grow px-2">
                  <label className="w-1/3 md:w-full text-white md:text-center text-sm">
                    {t("Accession No")}
                  </label>
                  <input
                    type="text"
                    className="py-1 px-1 mt-2 transition duration-300 appearance-none border border-inputfield-main focus:border-inputfield-focus focus:outline-none disabled:border-inputfield-disabled rounded w-2/4 md:w-3/4 text-sm text-white placeholder-inputfield-placeholder leading-tight bg-black"
                    onChange={handlesearchAcn}
                  />
                </div>
                <div className="flex items-center justify-center md:flex-col md:flex-grow px-2">
                  <label className="w-1/3 md:w-full text-white md:text-center text-sm">
                    {t("From")}
                  </label>
                  <input
                    type="date"
                    placeholder="mm/dd/yyyy"
                    className="h-7 py-1 px-1 mt-2 transition duration-300 appearance-none border border-inputfield-main focus:border-inputfield-focus focus:outline-none disabled:border-inputfield-disabled rounded w-2/4 md:w-3/4 md:h-8 text-sm text-white placeholder-inputfield-placeholder leading-tight bg-black"
                    onChange={handlesearchFromDate}
                  />
                </div>
                <div className="flex items-center justify-center md:flex-col md:flex-grow px-2">
                  <label className="w-1/3 md:w-full text-white md:text-center text-sm">
                    {t("To")}
                  </label>
                  <input
                    type="date"
                    className="h-7 py-1 px-1 mt-2 transition duration-300 appearance-none border border-inputfield-main focus:border-inputfield-focus focus:outline-none disabled:border-inputfield-disabled rounded w-2/4 md:w-3/4 md:h-8 text-sm text-white placeholder-inputfield-placeholder leading-tight bg-black"
                    onChange={handlesearchToDate}
                  />
                </div>
                <div className="flex justify-center md:flex-col md:flex-grow px-2">
                  <button
                    onClick={toggleAdvancedSearch}
                    className="text-red-400 underline mt-4 text-xs md:text-base"
                  >
                    {t("Back Quick Search")}
                  </button>
                </div>
              </div>
            </div>
          )}
          <WorklistList
            worklist={workList}
            onRefresh={fetchWorkList}
            onSelectProcID={handleProcIDSelect}
            t={t}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
        {selectedProcID && <DetailInfor proc_id={selectedProcID} t={t} />}
      </div>
    </div>
  );
};

export default Worklist;
