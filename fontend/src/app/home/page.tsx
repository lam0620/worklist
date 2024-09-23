"use client";

import withLoading from "@/components/withLoading";
import AppLayout from "@/components/AppLayout";
import PieChart from "@/components/chart/PieChart";
import BarChart from "@/components/chart/BarChart";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { PERMISSIONS } from "@/utils/constant";

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

  const router = useRouter();
  const { user } = useUser();

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
    <AppLayout name="Statistics">
      {!hasViewStatisticsPermission && (
        <div className="flex flex-row items-center space-x-2 w-full m-5">
          <label>You don't have view permission.</label>
        </div>
      )}

      {hasViewStatisticsPermission && (
        <>
          <div className="flex flex-row items-center space-x-2 w-full m-5">
            <label>Lọc theo:</label>
            <div className="text-sm flex-grow">
              <select
                className="p-2 border rounded w-48"
                onChange={onChangeType}
              >
                <option value={"orders"}>Số lượng chỉ định</option>
                <option value={"reports"}>Số lượng kết quả</option>
                <option value={"studies"}>Số lượng ảnh chụp</option>
              </select>
            </div>
          </div>
          <div className="flex flex-col md:flex-row">
            {/* Left Section */}
            <div className="flex flex-col w-full md:w-1/2 space-y-4 mr-5 mb-5">
              <div className="flex flex-row items-center space-x-2 w-full">
                <p className="ml-5">
                  Tổng{" "}
                  {type === "orders"
                    ? "số lượng chỉ định"
                    : type === "reports"
                    ? "số lượng kết quả"
                    : "số lượng ảnh chụp"}{" "}
                  trong 1 năm
                </p>
              </div>
              <div className="flex flex-row items-center space-x-2 w-full ml-5">
                <label className="mr-8">Năm:</label>
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
                        Tháng
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
                        Số lượng
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
                    Số lượng theo bác sĩ trong khoảng thời gian mới nhất
                  </label>
                </div>
                <div className="flex flex-row items-center space-x-2 w-full ml-5">
                  <label className="mr-8">Thời gian:</label>
                  <div className="text-sm flex-grow">
                    <select
                      className="p-2 border rounded w-48"
                      onChange={onChangeDWM}
                    >
                      <option value={"today"}>Hôm nay</option>
                      <option value={"1week"}>1 tuần qua</option>
                      <option value={"1month"}>1 tháng qua</option>
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
                          Bác sĩ
                        </th>
                        <th className="border border-neutral-950 px-1 py-1">
                          Số lượng
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
