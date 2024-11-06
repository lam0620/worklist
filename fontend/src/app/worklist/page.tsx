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
import * as Avatar from "@radix-ui/react-avatar";
import "react-datepicker/dist/react-datepicker.css";
import WorklistList from "@/components/worklist/WorklistList";
import DetailInfor from "@/components/worklist/DetailInfor";

const Worklist = () => {
  const API_TEST11 = process.env.NEXT_PUBLIC_API_TEST;
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
  const [selectedPID, setSelectedPID] = useState("");

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

  useEffect(() => {
    if (user) {
      fetchWorkList(searchQuery).then((r) => r);
    }
  }, [user, searchQuery]);

  useEffect(() => {
    handleSearch();
  }, [
    selectedDate,
    selectedDevices,
    selectedStatuses,
    searchPid,
    searchFullName,
    searchAcn,
    searchFromDate,
    searchToDate,
  ]);

  const fetchWorkList = async (query: string) => {
    try {
      const response = await fetchWorklist({ search: query });
      console.log(response);
      setWorkList(response?.data);
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
  const handleSearch = () => {
    const searchDevice = selectedDevices.join(",");
    const searchStatus = selectedStatuses.join(",");
    const searchParams = new URLSearchParams({
      devices: searchDevice,
      status: searchStatus,
      date: selectedDate,
      acn: searchAcn,
      pid: searchPid,
      fullname: searchFullName,
      from_date: searchFromDate,
      to_date: searchToDate,
    });
    fetch(`${API_TEST11}/data?${searchParams}`)
      .then((response) => response.json())
      .then((data) => setWorkList(data))
      .catch((error) => console.error("Error:", error));
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
      value === "all"
        ? checked
          ? ["all"]
          : []
        : checked
        ? prev.filter((item) => item !== "all").concat(value)
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

  const handleButtonToday = () => {
    setSelectedDate("today");
  };

  const handleButtonYesterday = () => {
    setSelectedDate("yesterday");
  };

  const handleButtonWeek = () => {
    setSelectedDate("7days");
  };

  const handleButtonAllday = () => {
    setSelectedDate("");
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

  const handlePIDSelect = (PID: string) => {
    setSelectedPID(PID);
  };

  return (
    <div className="flex flex-col h-screen text-sm md:text-base">
      <header className="w-full flex justify-between items-center bg-top text-white p-1">
        <Image src={logo} className="max-w-16 ml-5" alt="logo" />
        <div className="mr-5">
          <Avatar.Root className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-800 cursor-pointer">
            <Avatar.Image
              className="w-full h-full rounded-full"
              src=""
              alt="User avatar"
            />
            <Avatar.Fallback className="flex items-center justify-center w-full h-full rounded-full text-white"></Avatar.Fallback>
          </Avatar.Root>
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
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
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
                        value="all"
                        checked={selectedDevices.includes("all")}
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
                        value="all"
                        checked={selectedStatuses.includes("all")}
                        onChange={handleCheckboxStatus}
                      />
                      {t("All")}
                    </li>
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        value="P"
                        checked={selectedStatuses.includes("P")}
                        onChange={handleCheckboxStatus}
                      />
                      {t("Pending")}
                    </li>
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        value="Unread"
                        checked={selectedStatuses.includes("Unread")}
                        onChange={handleCheckboxStatus}
                      />
                      {t("Unread")}
                    </li>
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        value="D"
                        checked={selectedStatuses.includes("D")}
                        onChange={handleCheckboxStatus}
                      />
                      {t("Reading")}
                    </li>
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox"
                        value="F"
                        checked={selectedStatuses.includes("F")}
                        onChange={handleCheckboxStatus}
                      />
                      {t("Approved")}
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
                    onClick={handleButtonToday}
                  >
                    {t("Today")}
                  </button>
                </div>
                <div className="w-1/2 md:w-auto p-1">
                  <button
                    className="button px-2 py-1 rounded mb-1 md:mb-0 md:mr-1 w-full md:w-auto text-sm hover-purple"
                    onClick={handleButtonYesterday}
                  >
                    {t("Yesterday")}
                  </button>
                </div>
                <div className="w-1/2 md:w-auto p-1">
                  <button
                    className="button px-2 py-1 rounded mb-1 md:mb-0 md:mr-1 w-full md:w-auto text-sm hover-purple"
                    onClick={handleButtonWeek}
                  >
                    {t("7 days")}
                  </button>
                </div>
                <div className="w-1/2 md:w-auto p-1">
                  <button
                    className="button px-2 py-1 rounded w-full md:w-auto text-sm hover-purple"
                    onClick={handleButtonAllday}
                  >
                    {t("All")}
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
            onSelectPID={handlePIDSelect}
            t={t}
          />
        </div>
        {selectedPID && <DetailInfor pid={selectedPID} t={t} />}
      </div>
    </div>
  );
};

export default Worklist;
