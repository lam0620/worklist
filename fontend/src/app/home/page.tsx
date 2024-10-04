"use client";

import withLoading from "@/components/withLoading";
import AppLayout from "@/components/AppLayout";
import PieChart from "@/components/chart/PieChart";
import BarChart from "@/components/chart/BarChart";
import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { PERMISSIONS } from "@/utils/constant";
import { useTranslation } from "../../i18n/client";

interface DataPieChart {
  fullname: string;
  doctor_no: string;
  count: number;
}

interface DataBarChart {
  month: number;
  count: number;
}

const HomePage = () => {
  const year: string = new Date().getFullYear().toString();
  const [type, setType] = useState(""); //type = orders, studies, reports
  const [selectedType, setSelectedType] = useState("orders");
  const [selectedYear, setSelectedYear] = useState(year);
  const [selectedDWM, setSelectedDWM] = useState("today"); //day,week,month
  const [dataPieChart, setDataPieChart] = useState<DataPieChart[]>([]);
  const [dataBarChart, setDataBarChart] = useState<DataBarChart[]>([]);
  const { user } = useUser();

  // const [t, setT] = useState(() => (key: string) => key);

  // useEffect(() => {
  //   const loadTranslation = async () => {
  const { t } = useTranslation("chartHome");
  //     setT(() => t);
  //   };
  //   loadTranslation();
  // }, []);
  const handleDataFetchedBarChart = (fetchedData: DataBarChart[]) => {
    setDataBarChart(fetchedData);
  };
  const handleDataFetchedPieChart = (fetchedData: DataPieChart[]) => {
    setDataPieChart(fetchedData);
  };
  const onChangeType = (event: React.ChangeEvent<HTMLSelectElement>) => {
    //change text label "tong so luong ... trong 1 nam"
    setType(event.target.value);
    setSelectedType(event.target.value);
  };
  const onChangeYear = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(event.target.value);
  };
  const onChangeDWM = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDWM(event.target.value);
  };

  const hasViewStatisticsPermission =
    user?.permissions?.includes(PERMISSIONS.VIEW_STATISTICS) ||
    user?.is_superuser;

  return (
    <AppLayout name={t("Statistics")}>
      {!hasViewStatisticsPermission && (
        <div className="flex flex-row items-center space-x-2 w-full m-5">
          <label>{t("You do not have view permission.")}</label>
        </div>
      )}

      {hasViewStatisticsPermission && (
        <>
          <div className="flex flex-row items-center space-x-2 w-full m-5">
            <label>{t("Filter by:")}</label>
            <div className="text-sm flex-grow">
              <select
                className="p-2 border rounded w-48"
                onChange={onChangeType}
              >
                <option value={"orders"}>{t("Number of orders")}</option>
                <option value={"reports"}>{t("Number of reports")}</option>
                <option value={"studies"}>{t("Number of studies")}</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col md:flex-row">
            {/* Left Section */}
            <div className="flex flex-col w-full md:w-1/2 space-y-4 mr-5 mb-5">
              <div className="flex flex-row items-center space-x-2 w-full">
                <p className="ml-5">
                  {t("Sum of")}{" "}
                  {type === "orders"
                    ? t("Number of orders")
                    : type === "reports"
                    ? t("Number of reports")
                    : t("Number of studies")}{" "}
                  {t("in 1 year")}
                </p>
              </div>
              <div className="flex flex-row items-center space-x-2 w-full ml-5">
                <label className="mr-8">{t("Year:")}</label>
                <div className="text-sm flex-grow">
                  <select
                    className="p-2 border rounded w-48"
                    onChange={onChangeYear}
                  >
                    {Array.from(
                      { length: new Date().getFullYear() - 2019 },
                      (_, i) => {
                        const year = new Date().getFullYear() - i;
                        return (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        );
                      }
                    )}
                  </select>
                </div>
              </div>

              <div className="h-96 w-full items-center flex justify-center">
                <BarChart
                  selectedType={selectedType}
                  selectedYear={selectedYear}
                  onDataFetched={handleDataFetchedBarChart}
                />
              </div>
              <div className="w-full text-xs">
                <table className="border-collapse border border-neutral-950 px-1 w-full">
                  <thead style={{ backgroundColor: "#ffe699" }}>
                    <tr>
                      <th className="border border-neutral-950 px-1 py-1">
                        {t("Month")}
                      </th>
                      {dataBarChart.map((item, index) => (
                        <th
                          key={index}
                          className="border border-neutral-950 px-1 py-1"
                        >
                          {item.month}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-neutral-950 px-1 py-1 text-center">
                        {t("Quantity")}
                      </td>
                      {dataBarChart.map((item, index) => (
                        <td
                          key={index}
                          className="border border-neutral-950 px-1 py-1 text-center"
                        >
                          {item.count}
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Section */}
            {type !== "studies" && (
              <div className="flex flex-col w-full md:w-1/2 space-y-4 mr-5 md:mt-0">
                <div className="flex flex-row items-center space-x-2 w-full ml-5">
                  <label className="mr-8">
                    {t("Number by doctor in the latest period")}
                  </label>
                </div>
                <div className="flex flex-row items-center space-x-2 w-full ml-5">
                  <label className="mr-8">{t("Time:")}</label>
                  <div className="text-sm flex-grow">
                    <select
                      className="p-2 border rounded w-48"
                      onChange={onChangeDWM}
                    >
                      <option value={"today"}>{t("Today")}</option>
                      <option value={"1week"}>{t("1 week ago")}</option>
                      <option value={"1month"}>{t("1 month ago")}</option>
                    </select>
                  </div>
                </div>
                {selectedType !== "studies" && (
                  <div className="h-96 flex items-center justify-center">
                    <PieChart
                      selectedDWM={selectedDWM}
                      selectedType={selectedType}
                      onDataFetched={handleDataFetchedPieChart}
                    />
                  </div>
                )}
                <div className="w-full text-xs">
                  <table className="border-collapse border border-neutral-950 px-1 w-full">
                    <thead style={{ backgroundColor: "#ffe699" }}>
                      <tr>
                        <th className="border border-neutral-950 px-1 py-1">
                          {t("Doctor")}
                        </th>
                        <th className="border border-neutral-950 px-1 py-1">
                          {t("Quantity")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dataPieChart.map((item, index) => (
                        <tr key={index}>
                          <td className="border border-neutral-950 px-1 py-1 text-center">
                            {selectedType === "studies" ? "" : item.fullname}
                          </td>
                          <td className="border border-neutral-950 px-1 py-1 text-center">
                            {selectedType === "studies" ? 0 : item.count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </AppLayout>
  );
};
export default withLoading(HomePage);
