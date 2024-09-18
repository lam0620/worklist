import React, { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

import { fetchOrderDoctors, fetchReportDoctors } from "@/services/apiService";

interface Data {
  doctor_name: string;
  doctor_id: string;
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
        let response;
        if (selectedType === "orders" && selectedDWM === "today") {
          response = await fetchOrderDoctors("today");
        } else if (selectedType === "reports" && selectedDWM === "today") {
          response = await fetchReportDoctors("today");
        }
        if (response) {
          const data = response?.data;

          const labels = data.map((item: Data) => item.doctor_name);
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
          tooltip: {
            callbacks: {
              label: function (tooltipItem: any) {
                const data = tooltipItem.dataset.data;
                const total = data.reduce(
                  (acc: number, value: number) => acc + value,
                  0
                );
                const currentValue = data[tooltipItem.dataIndex];
                const percentage = ((currentValue / total) * 100).toFixed(2);
                return `${tooltipItem.label}: ${currentValue} (${percentage}%)`;
              },
            },
          },
          legend: {
            position: "right",
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
