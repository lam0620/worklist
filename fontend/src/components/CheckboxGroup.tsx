import React from "react";
import { PermissionListProps } from "@/app/types/Permission";

interface CheckboxGroupProps {
  options: PermissionListProps[];
  selectedOptions: string[];
  onChange: (selectedOptions: string[]) => void;
}

const CheckboxGroup = ({
  options,
  selectedOptions,
  onChange,
}: CheckboxGroupProps) => {
  const handleCheckboxChange = (id: string) => {
    if (selectedOptions.includes(id)) {
      onChange(selectedOptions.filter((option) => option !== id));
    } else {
      onChange([...selectedOptions, id]);
    }
  };

  const groupedOptions = options.reduce((acc, option) => {
    const tag = option.tag || "Khác";
    if (!acc[tag]) {
      acc[tag] = [];
    }
    acc[tag].push(option);
    return acc;
  }, {} as Record<string, PermissionListProps[]>);

  const groupedEntries = Object.entries(groupedOptions);
  const midIndex = Math.ceil(groupedEntries.length / 2);
  const leftGroups = groupedEntries.slice(0, midIndex);
  const rightGroups = groupedEntries.slice(midIndex);

  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        {leftGroups.map(([tag, group]) => (
          <fieldset key={tag} className="border p-4 mb-4">
            <legend className="font-bold">{tag}</legend>
            {group.map((option) => (
              <label key={option.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option.id)}
                  onChange={() => handleCheckboxChange(option.id)}
                  className="form-checkbox"
                />
                <span>{option.name}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
      <div>
        {rightGroups.map(([tag, group]) => (
          <fieldset key={tag} className="border p-4 mb-4">
            <legend className="font-bold">{tag}</legend>
            {group.map((option) => (
              <label key={option.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option.id)}
                  onChange={() => handleCheckboxChange(option.id)}
                  className="form-checkbox"
                />
                <span>{option.name}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
    </div>
  );
};

export default CheckboxGroup;
