import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Data {
  age_group: string;
  values: {
    yes: number;
    no: number;
    unknown: number;
  };
}

const LineChart = ({ data, type }: { data: Data[]; type: string }) => {
  const ageGroups = data.map((item) => item.age_group);
  const smokingYes = data.map((item) => item.values.yes);
  const smokingNo = data.map((item) => item.values.no);
  const smokingUnknown = data.map((item) => item.values.unknown);

  const chartData = {
    labels: ageGroups,
    datasets: [
      {
        label: `${type === "ht" ? "HIGHT BP" : `${type.toUpperCase()} YES`}`,
        data: smokingYes,
        borderColor: "#4CAF50",
        backgroundColor: "rgba(76, 175, 80, 0.2)",
        fill: true,
      },
      {
        label: `${type === "ht" ? "LOWER BP" : `${type.toUpperCase()} NO`}`,
        data: smokingNo,
        borderColor: "#F44336",
        backgroundColor: "rgba(244, 67, 54, 0.2)",
        fill: true,
      },
      {
        label: `${
          type === "ht" ? "NORMAL BP" : `${type.toUpperCase()} UNKNOWN`
        }`,
        data: smokingUnknown,
        borderColor: "#FFC107",
        backgroundColor: "rgba(255, 193, 7, 0.2)",
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as string,
      },
      title: {
        display: true,
        text: `${
          type === "ht"
            ? "Blood Pressure Status by Age Group"
            : `${type.toUpperCase()} Status by Age Group`
        }`,
        position: "bottom",
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 5,
      },
    },
  } as any;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <div style={{ width: "1000px", height: "800px" }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

export default LineChart;
