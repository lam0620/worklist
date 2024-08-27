"use client";
import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import BarChart from "@/components/chart/BarChart";
import LineChart from "@/components/chart/LineChart";
import PieChart from "@/components/chart/PieChart";
import DropdownWithButtons from "@/components/DropdownWithButtons";

const Chart = () => {
  const [data, setData] = useState([]);
  const [chartType, setChartType] = useState("Bar");
  const [selectedOption2, setSelectedOption2] = useState("dm");

  const renderChart = () => {
    switch (chartType) {
      case "Line":
        return <LineChart data={data} type={selectedOption2} />;
      case "Pie":
        return <PieChart data={data} type={selectedOption2} />;
      case "Bar":
        <BarChart data={data} type={selectedOption2} />;
      default:
        return <BarChart data={data} type={selectedOption2} />;
    }
  };

  return (
    <AppLayout name="Chart">
      <h1 className="text-2xl font-bold text-center mb-4">Data Chart</h1>
      <div>
        <DropdownWithButtons
          setData={setData}
          setChartType={setChartType}
          setSelectedOption2={setSelectedOption2}
        />
      </div>
      {renderChart()}
    </AppLayout>
  );
};

export default Chart;
