import { Pie } from "react-chartjs-2";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Data {
  age_group: string;
  values: {
    yes: number;
    no: number;
    unknown: number;
  };
}

const PieChart = ({ data, type }: { data: Data[]; type: string }) => {
  const ValuesYes = data.reduce((acc, item) => acc + item.values.yes, 0);
  const ValuesNo = data.reduce((acc, item) => acc + item.values.no, 0);
  const ValuesUnknown = data.reduce(
    (acc, item) => acc + item.values.unknown,
    0
  );

  const chartData = {
    labels: [
      `${type === "ht" ? "HIGHT BP" : `${type.toUpperCase()} YES`}`,
      `${type === "ht" ? "LOWER BP" : `${type.toUpperCase()} NO`}`,
      `${type === "ht" ? "NORMAL BP" : `${type.toUpperCase()} UNKNOWN`}`,
    ],
    datasets: [
      {
        data: [ValuesYes, ValuesNo, ValuesUnknown],
        backgroundColor: ["#4CAF50", "#F44336", "#FFC107"],
        hoverOffset: 4,
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
            ? "Blood Pressure Status"
            : `${type.toUpperCase()} Status`
        }`,
        position: "bottom",
      },
    },
  } as any;
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "70vh",
      }}
    >
      <div style={{ width: "600px", height: "600px" }}>
        <Pie data={chartData} options={options} />
      </div>
    </div>
  );
};

export default PieChart;
