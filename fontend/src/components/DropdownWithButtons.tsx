import React, { useState, useEffect } from "react";
import * as Select from "@radix-ui/react-select";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import {
  fetchChartData,
  fetchProviders,
  exportCSV,
} from "@/services/apiService";

interface Provider {
  id: string;
  name: string;
}

const DropdownWithButtons = ({
  setData,
  setChartType,
  setSelectedOption2,
}: {
  setData: React.Dispatch<React.SetStateAction<any>>;
  setChartType: React.Dispatch<React.SetStateAction<string>>;
  setSelectedOption2: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [selectedOption1, setSelectedOption1] = useState<Provider[]>([]);
  const [selectedOption2, setSelectedOption2State] = useState("dm");
  const [selectedChartType, setSelectedChartType] = useState("Bar");
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    const fetchProvider = async () => {
      try {
        const response = await fetchProviders({ isPage: false });
        setProviders(response.data?.data);
      } catch (error) {
        console.error("Failed to fetch providers:", error);
      }
    };
    fetchProvider().then((r) => r);
  }, []);

  const mapBackendValues = (data: any[], type: string) => {
    if (type === "ht") {
      return data.map((item) => {
        const mappedValues: { [key: string]: any } = Object.keys(
          item.values
        ).reduce((acc, key) => {
          switch (key) {
            case "height_bp":
              acc["yes"] = item.values[key];
              break;
            case "lower_bp":
              acc["no"] = item.values[key];
              break;
            case "normal_bp":
              acc["unknown"] = item.values[key];
              break;
            default:
              acc[key as string] = item.values[key];
          }
          return acc;
        }, {} as { [key: string]: any });
        return { ...item, values: mappedValues };
      });
    }
    return data;
  };

  const handleApply = () => {
    if (selectedOption1.length === 0) {
      fetchChartData({ type: selectedOption2 }).then((response) => {
        const mappedData = mapBackendValues(response.data, selectedOption2);
        setData(mappedData);
      });
      setChartType(selectedChartType);
      setSelectedOption2(selectedOption2);
      return;
    }
    fetchChartData({
      type: selectedOption2,
      provider_id: selectedOption1[0].id,
    }).then((response) => {
      const mappedData = mapBackendValues(response.data, selectedOption2);
      setData(mappedData);
    });
    setChartType(selectedChartType);
    setSelectedOption2(selectedOption2);
  };

  const handleExport = () => {
    console.log(selectedOption2, selectedOption1);
    if (selectedOption1.length === 0) {
      exportCSV({ type: selectedOption2 })
        .then((response) => {
          const blob = new Blob([response.data], { type: "text/csv" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = "data.csv";
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
        })
        .catch((error) => {
          console.error("Failed to export CSV:", error);
        });
      return;
    }
    exportCSV({ type: selectedOption2, provider_id: selectedOption1[0].id })
      .then((response) => {
        const blob = new Blob([response.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "data.csv";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error("Failed to export CSV:", error);
      });
  };

  return (
    <div className="flex flex-col items-center mt-4 space-y-4">
      <div className="flex space-x-4">
        <Select.Root
          onValueChange={(value: string) => {
            if (value === "all") {
              setSelectedOption1([]);
            } else {
              const selectedProvider = providers.find(
                (provider) => provider.name === value
              );
              if (selectedProvider) {
                setSelectedOption1([selectedProvider]);
              }
            }
          }}
          defaultValue="all"
        >
          <Select.Trigger className="inline-flex items-center justify-between bg-gray-200 px-4 py-2 rounded-md">
            <Select.Value>
              {selectedOption1.length === 0
                ? "all"
                : selectedOption1.map((option) => option.name).join(", ")}
            </Select.Value>
            <Select.Icon>
              <ChevronDownIcon />
            </Select.Icon>
          </Select.Trigger>
          <Select.Content className="bg-white shadow-lg rounded-md">
            <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-gray-100">
              <ChevronUpIcon />
            </Select.ScrollUpButton>
            <Select.Viewport className="p-2">
              <Select.Item
                key="all"
                value="all"
                className="px-4 py-2 cursor-pointer hover:bg-gray-200"
              >
                <Select.ItemText>all</Select.ItemText>
              </Select.Item>
              {providers.map((option) => (
                <Select.Item
                  key={option.id}
                  value={option.name}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-200"
                >
                  <Select.ItemText>{option.name}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-gray-100">
              <ChevronDownIcon />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Root>

        <Select.Root onValueChange={setSelectedOption2State} defaultValue="dm">
          <Select.Trigger className="inline-flex items-center justify-between bg-gray-200 px-4 py-2 rounded-md">
            <Select.Value placeholder="Select Option 2" />
            <Select.Icon>
              <ChevronDownIcon />
            </Select.Icon>
          </Select.Trigger>
          <Select.Content className="bg-white shadow-lg rounded-md">
            <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-gray-100">
              <ChevronUpIcon />
            </Select.ScrollUpButton>
            <Select.Viewport className="p-2">
              {["dm", "ht", "smoking"].map((value) => (
                <Select.Item
                  key={value}
                  value={value}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-200"
                >
                  <Select.ItemText>{value.toUpperCase()}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-gray-100">
              <ChevronDownIcon />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Root>

        <Select.Root onValueChange={setSelectedChartType} defaultValue="Bar">
          <Select.Trigger className="inline-flex items-center justify-between bg-gray-200 px-4 py-2 rounded-md">
            <Select.Value placeholder="Select Chart Type" />
            <Select.Icon>
              <ChevronDownIcon />
            </Select.Icon>
          </Select.Trigger>
          <Select.Content className="bg-white shadow-lg rounded-md">
            <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-gray-100">
              <ChevronUpIcon />
            </Select.ScrollUpButton>
            <Select.Viewport className="p-2">
              {["Line", "Pie", "Bar"].map((value) => (
                <Select.Item
                  key={value}
                  value={value}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-200"
                >
                  <Select.ItemText>{value}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
            <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-gray-100">
              <ChevronDownIcon />
            </Select.ScrollDownButton>
          </Select.Content>
        </Select.Root>
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleApply}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Apply
        </button>
        <button
          onClick={handleExport}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
        >
          Export
        </button>
      </div>
    </div>
  );
};

export default DropdownWithButtons;
