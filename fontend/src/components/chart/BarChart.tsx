import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

import { fetchOrders, fetchReports, fetchStudies } from "@/services/apiService";
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Data {
  month: number;
  count: number;
}

interface BarChartProps {
  selectedYear: string;
  selectedType: string;
  onDataFetched: (data: Data[]) => void;
}

const BarChart: React.FC<BarChartProps> = ({
  selectedType,
  selectedYear,
  onDataFetched,
}) => {
  const [chartData, setChartData] = useState({
    labels: [] as (string | number)[],
    datasets: [
      {
        label: "Appointments",
        data: [] as number[],
        backgroundColor: [] as string[],
        borderColor: [] as string[],
        borderWidth: 1,
      },
    ],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        let response;
        if (selectedType === "studies" && selectedYear === "2024") {
          response = await fetchStudies("year");
        } else if (selectedType === "reports" && selectedYear === "2024") {
          response = await fetchReports("year");
        } else if (selectedType === "orders" && selectedYear === "2024") {
          response = await fetchOrders("year");
        }

        if (response) {
          console.log("year", response);
          const data = response.data;

          const labels = data.map((item: Data) => item.month);
          const counts = data.map((item: Data) => item.count);
          const backgroundColor = ["#36A2EB"];

          setChartData({
            labels: labels,
            datasets: [
              {
                label: "Appointments",
                data: counts,
                backgroundColor: backgroundColor.slice(0, counts.length),
                borderColor: backgroundColor.slice(0, counts.length),
                borderWidth: 1,
              },
            ],
          });
          onDataFetched(data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [selectedType, selectedYear]);

  const options = {
    scales: {
      x: {
        beginAtZero: true,
      },
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default BarChart;
