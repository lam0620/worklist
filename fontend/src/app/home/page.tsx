"use client";

import withLoading from "@/components/withLoading";
import AppLayout from "@/components/AppLayout";
import PieChart from "@/components/chart/PieChart";
import BarChart from "@/components/chart/BarChart";
import { useState } from "react";

interface DataPieChart {
  doctor_name: string;
  doctor_id: string;
  count: number;
}

interface DataBarChart {
  month: number;
  count: number;
}

const HomePage = () => {
  const year: string = new Date().getFullYear().toString();
  const [text, setText] = useState("");
  const [selectedType, setSelectedType] = useState("orders");
  const [selectedYear, setSelectedYear] = useState(year);
  const [selectedDWM, setSelectedDWM] = useState("today");
  const [dataPieChart, setDataPieChart] = useState<DataPieChart[]>([]);
  const [dataBarChart, setDataBarChart] = useState<DataBarChart[]>([]);

  const handleDataFetchedBarChart = (fetchedData: DataBarChart[]) => {
    setDataBarChart(fetchedData);
  };
  const handleDataFetchedPieChart = (fetchedData: DataPieChart[]) => {
    setDataPieChart(fetchedData);
  };
  const onChangeText = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setText(event.target.value);
    setSelectedType(event.target.value);
  };
  const onChangeYear = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(event.target.value);
  };
  const onChangeDWM = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDWM(event.target.value);
  };

  return (
    <AppLayout name="">
      <div>
        <div className="flex flex-col items-start space-y-4">
          <div className="flex flex-col items-end space-y-2">
            <div className="flex flex-row items-center space-x-2 w-full">
              <label>Lọc theo:</label>
              <div className="text-sm flex-grow">
                <select
                  className="p-2 border rounded w-full"
                  onChange={onChangeText}
                >
                  <option value={"orders"}>Số lượng chỉ định</option>
                  <option value={"reports"}>Số lượng kết quả</option>
                  <option value={"studies"}>Số lượng ảnh chụp</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-between w-full h-2/6">
            <div className="flex flex-row items-center space-x-2 w-full">
              <div className="mt-3">
                <p>
                  Tổng{" "}
                  {text === "orders"
                    ? "số lượng chỉ định"
                    : text === "reports"
                    ? "số lượng kết quả"
                    : "số lượng ảnh chụp"}{" "}
                  trong 1 năm
                </p>
              </div>
            </div>
            <div className="flex flex-row items-center space-x-2 w-full ml-20">
              <label className="mr-8">
                Số lượng theo bác sĩ trong khoảng thời gian mới nhất{" "}
              </label>
            </div>
          </div>
          <div className="flex justify-between w-full h-2/6">
            <div className="flex flex-row items-center space-x-2 w-full">
              <label className="mr-8"> Năm: </label>
              <div className="text-sm flex-grow">
                <select
                  className="p-2 border rounded w-48"
                  onChange={onChangeYear}
                >
                  {Array.from(
                    { length: new Date().getFullYear() - 1999 },
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
            <div className="flex flex-row items-center space-x-2 w-full ml-20">
              <label className="mr-8"> Lọc theo: </label>
              <div className="text-sm flex-grow">
                <select
                  className="p-2 border rounded w-48"
                  onChange={onChangeDWM}
                >
                  <option value={"today"}>1 ngày</option>
                  <option value={"1week"}>1 tuần</option>
                  <option value={"1month"}>1 tháng</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex flex-col w-full h-2/6">
            <div className="flex justify-between w-full">
              <div className="w-1/2 flex flex-col p-4 items-center">
                <div className="w-full p-3 text-xs">
                  <table className="border-collapse border border-neutral-950 px-1 py-1 w-full">
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
                        <td className="border border-neutral-950 px-1 py-1">
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
                <div className="w-full items-center">
                  <BarChart
                    selectedType={selectedType}
                    selectedYear={selectedYear}
                    onDataFetched={handleDataFetchedBarChart}
                  />
                </div>
              </div>
              <div className="w-1/2 flex flex-col p-4 items-center">
                <div className="w-full p-3 text-xs">
                  <table className="border-collapse border border-neutral-950 px-1 py-1 w-full">
                    <thead style={{ backgroundColor: "#ffe699" }}>
                      <tr>
                        <th className="border border-neutral-950 px-1 py-1">
                          Bác sĩ
                        </th>
                        {dataPieChart.map((item, index) => (
                          <th
                            key={index}
                            className="border border-neutral-950 px-1 py-1"
                          >
                            {item.doctor_name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-neutral-950 px-1 py-1">
                          Số lượng
                        </td>
                        {dataPieChart.map((item, index) => (
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
                <div className="w-11/12 h-11/12">
                  <PieChart
                    selectedDWM={selectedDWM}
                    selectedType={selectedType}
                    onDataFetched={handleDataFetchedPieChart}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default withLoading(HomePage);
