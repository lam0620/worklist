import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import {
  fetchStatsOrderDoctors,
  fetchStatsReportDoctors,
} from "@/services/apiService";
import { showErrorMessage } from "@/utils/showMessageError";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface Data {
  fullname: string;
  doctor_no: string;
  count: number;
}

interface PieChartProps {
  selectedDWM: string;
  selectedType: string;
  onDataFetched: (data: Data[]) => void;
}

const PieChart: React.FC<PieChartProps> = ({
  selectedDWM,
  selectedType,
  onDataFetched,
}) => {
  const [chartData, setChartData] = useState({
    labels: [] as (string | number)[],
    datasets: [
      {
        data: [] as number[],
        backgroundColor: [] as string[],
      },
    ],
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Reset the piechart's data to empty, avoid being stuck every time choose another option.
        setChartData({
          labels: [],
          datasets: [
            {
              data: [],
              backgroundColor: [],
            },
          ],
        });

        let response;
        if (selectedType === "orders" && selectedDWM) {
          response = await fetchStatsOrderDoctors(selectedDWM);
        } else if (selectedType === "reports" && selectedDWM) {
          response = await fetchStatsReportDoctors(selectedDWM);
        }
        if (
          response?.status === 200 &&
          response.data?.result?.status === "OK"
        ) {
          const data = response?.data.data;
          const labels = data.map((item: Data) => item.fullname);
          const counts = data.map((item: Data) => item.count);
          const backgroundColor = [
            "#FF6384",
            "#36A2EB",
            "#FFCE56",
            "#4BC0C0",
            "#9966FF",
            "#FF2311",
            "#4B2145",
            "#4B2777",
          ];
          setChartData({
            labels: labels,
            datasets: [
              {
                data: counts,
                backgroundColor: backgroundColor.slice(0, counts.length),
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
  }, [selectedDWM, selectedType]);

  return (
    <Pie
      data={chartData}
      options={{
        plugins: {
          legend: {
            position: "top",
            labels: {
              boxWidth: 20,
              padding: 10,
              font: {
                size: 11,
              },
            },
          },
          datalabels: {
            formatter: (value: number, context: any) => {
              const total = context.dataset.data.reduce(
                (acc: number, val: number) => acc + val,
                0
              );
              const percentage = ((value / total) * 100).toFixed(2);
              return `${percentage}%`;
            },
            color: "#fff",
          },
        },
      }}
    />
  );
};

export default PieChart;
