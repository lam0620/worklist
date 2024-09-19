import React, { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import {
  fetchStatsOrders,
  fetchStatsReports,
  fetchStatsStudies,
} from "@/services/apiService";
import { showErrorMessage } from "@/utils/showMessageError";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

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
        if (selectedType === "studies" && selectedYear) {
          response = await fetchStatsStudies(selectedYear);
        } else if (selectedType === "reports" && selectedYear) {
          response = await fetchStatsReports(selectedYear);
        } else if (selectedType === "orders" && selectedYear) {
          response = await fetchStatsOrders(selectedYear);
        }
        if (
          response?.status === 200 &&
          response.data?.result?.status === "OK"
        ) {
          console.log(selectedYear, response);
          const data = response.data.data;

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
        } else if (response?.data.result.status === "NG") {
          const code = response?.data?.result?.code;
          const item = response?.data?.result?.item;
          const msg = response?.data?.result?.msg;
          const message = showErrorMessage(code, item, msg);
          console.log(message);
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
        title: {
          display: true,
          text: "Tháng",
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Số lượng",
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default BarChart;
