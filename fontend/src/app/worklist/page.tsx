"use client";
import { useTranslation } from "../../i18n";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchWorklist } from "@/services/apiService";
import { useUser } from "@/context/UserContext";
import { WorkList } from "@/app/types/WorkList";
import { toast } from "react-toastify";
import logo from "../../../public/images/custom_logo.png";
import Image from "next/image";
import "./worklist.css";
import WorklistList from "@/components/worklist/WorklistList";
import DetailInfor from "@/components/worklist/DetailInfor";
import UserAvatar from "../../components/Avatar";
import withLoading from "@/components/withLoading";

const Worklist = () => {
  const router = useRouter();
  // router.push("/worklist");
  const { user } = useUser();
  const [t, setT] = useState(() => (key: string) => key);

  useEffect(() => {
    const loadTranslation = async () => {
      const { t } = await useTranslation("worklist");
      setT(() => t);
    };
    loadTranslation();
    if (user) {
      router.push("/worklist");
    }
    //to hidden or apprear left panel based on pc or moblie
    if (typeof window !== "undefined") {
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
    }
  }, []);
  const [workList, setWorkList] = useState<WorkList[]>([]);
  const [numRecord, setNumRecord] = useState(Number); //to show quantity of record (... số ca)
  const [isAdvancedSearch, setAdvancedSearch] = useState(false);
  const [searchParams, setSearchParams] = useState({
    pid: "",
    fullName: "",
    acn: "",
    fromDate: "",
    toDate: "",
    selectedStatuses: [] as string[],
    selectedDevices: [] as string[],
    searchQuery: "",
  });
  const [collapsed, setCollapsed] = useState(false);
  const [selectedProcID, setSelectedProcID] = useState(""); // get proc_id for fetch report information
  const [reportInf, setReportInf] = useState<any>(); // to get data for print pdf
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedButtonDay, setSelectedButtonDay] = useState<string>("All");
  const [collapsedDetail, setCollapseDetail] = useState(false); //flexible width of the right panel when open or close detail panel
  const [loadFirst, setLoadFirst] = useState(false);
  const [loading, setLoading] = useState(false); //icon loading

  const CollapseDetail = () => {
    setCollapseDetail(!collapsedDetail);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    //get init data today and yesterday when first come
    if (user !== undefined) {
      //check here to get exactly user (beacause user can be undefined -> router.push("/login"))
      if (user) {
        handleFilterToday();
        setLoadFirst(true);
      } else {
        router.push("/login");
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && loadFirst) {
      fetchWorkList(currentPage, searchParams.searchQuery, true).then((r) => r);
    }
  }, [
    searchParams.searchQuery,
    currentPage,
    searchParams.selectedDevices,
    searchParams.selectedStatuses,
  ]);

  useEffect(() => {
    //advance search
    if (user && loadFirst) {
      handleSearch();
    }
  }, [
    searchParams.pid,
    searchParams.fullName,
    searchParams.acn,
    searchParams.fromDate,
    searchParams.toDate,
    searchParams.selectedDevices,
    searchParams.selectedStatuses,
  ]);

  const fetchWorkList = async (page: number, query: string, onReFresh: any) => {
    setLoading(true);
    try {
      const response = await fetchWorklist({
        page,
        search: query,
        modality_type: searchParams.selectedDevices.join(","),
        status: searchParams.selectedStatuses.join(","),
      });

      if (response) {
        setWorkList(response.data.data);
        setNumRecord(response.data.count);
        setTotalPages(Math.ceil(response.data.count / response.data.page_size));
      } else {
        console.log("a");
      }
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(t("You don't have permission to view worklist"));
      } else {
        toast.error(t("Failed to fetch worklist"));
      }
    } finally {
      setLoading(false);
    }
    if (onReFresh) {
      setSelectedButtonDay("All");
    }
  };

  const handleSearch = async () => {
    //for advance search
    const searchParamsObj = {
      modality_type: searchParams.selectedDevices.join(","),
      status: searchParams.selectedStatuses.join(","),
      patient_name: searchParams.fullName,
      accession_no: searchParams.acn,
      patient_pid: searchParams.pid,
      created_at_after: searchParams.fromDate,
      created_at_before: searchParams.toDate,
    };

    // Filter out empty values
    const filteredParams = Object.fromEntries(
      Object.entries(searchParamsObj).filter(([key, value]) => value)
    );

    const search = new URLSearchParams(filteredParams);
    const params = Object.fromEntries(search.entries());
    setLoading(true);
    try {
      const response = await fetchWorklist(params);
      if (response.status === 200 && response.data?.result?.status === "OK") {
        setWorkList(response?.data.data);
        setNumRecord(response?.data?.count);
        setTotalPages(
          Math.ceil(response.data?.count / response?.data?.page_size)
        );
      } else {
        setWorkList([]);
        setNumRecord(0);
      }
    } catch (error) {
      console.error("Error fetching orders list:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleAdvancedSearch = () => {
    if (isAdvancedSearch) {
      setSelectedButtonDay("All");
    }
    setAdvancedSearch(!isAdvancedSearch);
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
      setSearchParams((prev) => ({ ...prev, searchQuery: query }));
    }, 1000),
    []
  );
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(event.target.value);
  };

  const handleCheckboxChange = (
    //left panel: choose "all" -> disable others checkbox and vice versa
    event: React.ChangeEvent<HTMLInputElement>,
    filterKey: "selectedStatuses" | "selectedDevices"
  ) => {
    const { value, checked } = event.target;
    setSearchParams((prev) => ({
      ...prev,
      [filterKey]:
        value === ""
          ? checked
            ? [""]
            : [""]
          : checked
          ? prev[filterKey].filter((item) => item !== "").concat(value)
          : prev[filterKey].filter((item) => item !== value),
    }));
  };

  const handleCheckboxModality = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    handleCheckboxChange(event, "selectedDevices");
  };

  const handleCheckboxStatus = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleCheckboxChange(event, "selectedStatuses");
  };

  const formatDateToISOString = (date: any) => {
    // to get local Datetime
    const timezoneOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date - timezoneOffset)
      .toISOString()
      .slice(0, -1);
    return localISOTime;
  };

  const handleFilterToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    setSearchParams((prev) => ({
      ...prev,
      fromDate: formatDateToISOString(today),
      toDate: formatDateToISOString(endOfDay),
    }));
    setSelectedButtonDay("Today");
  };

  const handleFilterYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);
    setSearchParams((prev) => ({
      ...prev,
      fromDate: formatDateToISOString(yesterday),
      toDate: formatDateToISOString(endOfYesterday),
    }));
    setSelectedButtonDay("Yesterday");
  };
  const handleFilterLast7Days = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    setSearchParams((prev) => ({
      ...prev,
      fromDate: formatDateToISOString(sevenDaysAgo),
      toDate: formatDateToISOString(today),
    }));
    setSelectedButtonDay("7 days");
  };

  const handleFilterAll = () => {
    setSearchParams((prev) => ({
      ...prev,
      fromDate: "",
      toDate: "",
    }));
    setSelectedButtonDay("All");
  };

  const handlesearchPid = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSearchParams((prev) => ({ ...prev, pid: value }));
  };

  const handlesearchFullName = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSearchParams((prev) => ({ ...prev, fullName: value }));
  };

  const handlesearchAcn = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSearchParams((prev) => ({ ...prev, acn: value }));
  };

  const handlesearchFromDate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSearchParams((prev) => ({ ...prev, fromDate: `${value} 00:00` }));
  };

  const handlesearchToDate = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    setSearchParams((prev) => ({ ...prev, toDate: `${value} 23:59` }));
  };

  const handleClearSearchParams = () => {
    //advance search: button clear data
    setSearchParams((prev) => ({
      ...prev,
      pid: "",
      fullName: "",
      acn: "",
      fromDate: "",
      toDate: "",
      searchQuery: "",
    }));
  };

  const handleProcIDSelect = (ProcID: string) => {
    setSelectedProcID(ProcID);
  };
  const handleReportInf = (reportInf: any) => {
    setReportInf(reportInf);
  };

  const linkStudyList =
    process.env.NEXT_PUBLIC_DICOM_VIEWER_URL || "https://localhost:3000";

  return (
    <div className="flex flex-col h-screen text-sm md:text-base">
      <title>Worklist</title>
      <header className="w-full flex justify-between items-center bg-top text-white p-1">
        <div className="justify-start flex">
          {/* <Image src={logo} className="w-8 h-8 mx-1 my-1 mr-4" alt="logo" /> */}
          <img
            src="../assets/custom_logo.png"
            className="w-8 h-8 mx-1 my-1 mr-4"
            alt="logo"
          />
          <p className="flex items-center justify-center ml-7">
            {t("Worklist |")}
          </p>
          <a
            href={linkStudyList}
            className="flex items-center justify-center ml-1 text-red-400 underline"
          >
            {"Studylist"}
          </a>
        </div>

        <div className="mr-2">
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
      <div className="md:flex md:flex-1 md:h-screen backgroundcolor overflow-y-hidden">
        {/* left panel  */}
        {!collapsed && (
          <div className="w-56 body-left inboxlist transition-all duration-300 ease-in-out h-screen border-r-4 border-color-col md:static absolute left-0 z-50">
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
                      title={t("Collapse")}
                    >
                      {collapsed ? (
                        ""
                      ) : (
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
                      )}
                    </button>
                  </div>
                  <ul className="p-2 backgroundcolor">
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox cursor-pointer"
                        value=""
                        checked={searchParams.selectedDevices.includes("")}
                        onChange={handleCheckboxModality}
                      />
                      {t("All")}
                    </li>
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox cursor-pointer"
                        value="MR"
                        checked={searchParams.selectedDevices.includes("MR")}
                        onChange={handleCheckboxModality}
                      />
                      MR
                    </li>
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox cursor-pointer"
                        value="CT"
                        checked={searchParams.selectedDevices.includes("CT")}
                        onChange={handleCheckboxModality}
                      />
                      CT
                    </li>
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox cursor-pointer"
                        value="X-Ray"
                        checked={searchParams.selectedDevices.includes("X-Ray")}
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
                  <ul className="p-2 backgroundcolor">
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox cursor-pointer"
                        value=""
                        checked={searchParams.selectedStatuses.includes("")}
                        onChange={handleCheckboxStatus}
                      />
                      {t("All")}
                    </li>
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox cursor-pointer"
                        value="SC"
                        checked={searchParams.selectedStatuses.includes("SC")}
                        onChange={handleCheckboxStatus}
                      />
                      {t("Scheduled")}
                    </li>
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox cursor-pointer"
                        value="IM"
                        checked={searchParams.selectedStatuses.includes("IM")}
                        onChange={handleCheckboxStatus}
                      />
                      {t("Unreported")}
                    </li>
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox cursor-pointer"
                        value="IP"
                        checked={searchParams.selectedStatuses.includes("IP")}
                        onChange={handleCheckboxStatus}
                      />
                      {t("Reporting")}
                    </li>
                    <li>
                      <input
                        type="checkbox"
                        className="custom-checkbox cursor-pointer"
                        value="CM"
                        checked={searchParams.selectedStatuses.includes("CM")}
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
        <div
          className={`backgroundcolor ${
            collapsed && !collapsedDetail
              ? "w-full"
              : collapsedDetail
              ? "w-full md:w-[75%]"
              : "w-full md:w-[88%]"
          }`}
        >
          {!isAdvancedSearch && (
            <div className="flex flex-col md:pr-9 md:pl-2 md:pb-1 md:mb-1 md:flex-row md:justify-between items-center pt-1 backgroundcolor-box justify-center">
              <div className="w-full md:w-1/4 md:mb-0 flex items-center">
                {collapsed && (
                  <div className="flex items-center mr-2">
                    <button
                      className="toggle-button backgroundcolor-box text-white flex justify-center items-center"
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
                    className={`button px-2 py-1 rounded mb-1 md:mb-0 md:mr-1 w-full md:w-auto text-sm hover-purple ${
                      selectedButtonDay === "Today" ? "purple-selectedrow" : ""
                    }`}
                    onClick={handleFilterToday}
                  >
                    {t("Today")}
                  </button>
                </div>
                <div className="w-1/2 md:w-auto p-1">
                  <button
                    className={`button px-2 py-1 rounded mb-1 md:mb-0 md:mr-1 w-full md:w-auto text-sm hover-purple ${
                      selectedButtonDay === "Yesterday"
                        ? "purple-selectedrow"
                        : ""
                    }`}
                    onClick={handleFilterYesterday}
                  >
                    {t("Yesterday")}
                  </button>
                </div>
                <div className="w-1/2 md:w-auto p-1">
                  <button
                    className={`button px-2 py-1 rounded mb-1 md:mb-0 md:mr-1 w-full md:w-auto text-sm hover-purple ${
                      selectedButtonDay === "7 days" ? "purple-selectedrow" : ""
                    }`}
                    onClick={handleFilterLast7Days}
                  >
                    {t("7 days")}
                  </button>
                </div>
                <div className="w-1/2 md:w-auto p-1">
                  <button
                    className={`button px-2 py-1 rounded w-full md:w-auto text-sm hover-purple ${
                      selectedButtonDay === "All" ? "purple-selectedrow" : ""
                    }`}
                    onClick={handleFilterAll}
                  >
                    {t("All")}
                  </button>
                </div>
              </div>
            </div>
          )}
          {isAdvancedSearch && (
            <div className="advanced-search inbox p-1 mb-1 rounded md:py-1 md:px-2">
              <div className="flex flex-col md:flex-row w-full">
                {collapsed && (
                  <div className="flex items-center">
                    <button
                      className="toggle-button backgroundcolor-box text-white flex justify-center items-center"
                      onClick={toggleSidebar}
                      title={t("Expand")}
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
                )}
                <div className="flex items-center justify-center md:flex-col md:flex-grow md:px-0 px-2 text-white">
                  <label className="w-1/3 md:w-full text-white md:text-center text-sm">
                    {t("PID")}
                  </label>
                  <input
                    type="text"
                    className="py-1 px-1 mt-2 transition duration-300 appearance-none border border-inputfield-main focus:border-inputfield-focus focus:outline-none disabled:border-inputfield-disabled rounded w-2/4 md:w-3/4 md:h-8 text-sm text-white placeholder-inputfield-placeholder leading-tight bg-black"
                    value={searchParams.pid}
                    onChange={handlesearchPid}
                  />
                </div>
                <div className="flex items-center justify-center md:flex-col md:flex-grow md:px-0 px-2">
                  <label className="w-1/3 md:w-full text-white md:text-center text-sm">
                    {t("Patient Name")}
                  </label>
                  <input
                    type="text"
                    className="py-1 px-1 mt-2 transition duration-300 appearance-none border border-inputfield-main focus:border-inputfield-focus focus:outline-none disabled:border-inputfield-disabled rounded w-2/4 md:w-3/4 md:h-8 text-sm text-white placeholder-inputfield-placeholder leading-tight bg-black"
                    value={searchParams.fullName}
                    onChange={handlesearchFullName}
                  />
                </div>
                <div className="flex items-center justify-center md:flex-col md:flex-grow md:px-0 px-2">
                  <label className="w-1/3 md:w-full text-white md:text-center text-sm">
                    {t("Accession No")}
                  </label>
                  <input
                    type="text"
                    className="py-1 px-1 mt-2 transition duration-300 appearance-none border border-inputfield-main focus:border-inputfield-focus focus:outline-none disabled:border-inputfield-disabled rounded w-2/4 md:w-3/4 md:h-8 text-sm text-white placeholder-inputfield-placeholder leading-tight bg-black"
                    value={searchParams.acn}
                    onChange={handlesearchAcn}
                  />
                </div>
                <div className="flex items-center justify-center md:flex-col md:flex-grow md:px-0 px-2">
                  <label className="w-1/3 md:w-full text-white md:text-center text-sm">
                    {t("From")}
                  </label>
                  <input
                    type="date"
                    className="logo-cal h-7 py-1 px-1 mt-2 transition duration-300 appearance-none border border-inputfield-main focus:border-inputfield-focus focus:outline-none disabled:border-inputfield-disabled rounded w-2/4 md:w-11/12 md:h-8 text-sm text-white placeholder-inputfield-placeholder leading-tight bg-black"
                    value={searchParams.fromDate.split(" ")[0]}
                    onChange={handlesearchFromDate}
                  />
                </div>
                <div className="flex items-center justify-center md:flex-col md:flex-grow md:px-0 px-2">
                  <label className="w-1/3 md:w-full text-white md:text-center text-sm">
                    {t("To")}
                  </label>
                  <input
                    type="date"
                    className="logo-cal h-7 py-1 px-1 mt-2 transition duration-300 appearance-none border border-inputfield-main focus:border-inputfield-focus focus:outline-none disabled:border-inputfield-disabled rounded w-2/4 md:w-11/12 md:h-8 text-sm text-white placeholder-inputfield-placeholder leading-tight bg-black"
                    value={searchParams.toDate.split(" ")[0]}
                    onChange={handlesearchToDate}
                  />
                </div>

                <div className="justify-center items-end flex mt-2 md:mt-0 md:mb-1">
                  <button
                    className="btn-red-square btn-clear"
                    onClick={handleClearSearchParams}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-delete"
                    >
                      <g transform="scale(0.8, 0.8) translate(3, 3)">
                        <path d="M10 5a2 2 0 0 0-1.344.519l-6.328 5.74a1 1 0 0 0 0 1.481l6.328 5.741A2 2 0 0 0 10 19h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2z" />
                        <path d="m12 9 6 6" />
                        <path d="m18 9-6 6" />
                      </g>
                    </svg>
                    <div className="text-[12px] px-1">{t("Clear")}</div>
                  </button>
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
            reportInf={reportInf}
            numRecord={numRecord}
            loading={loading}
          />
        </div>
        {selectedProcID && (
          <DetailInfor
            reportInf={handleReportInf}
            proc_id={selectedProcID}
            t={t}
            setCollapseDetail={CollapseDetail}
          />
        )}
      </div>
    </div>
  );
};

export default withLoading(Worklist);
