import React from "react";
import { PermissionListProps } from "@/app/types/Permission";
import { MyInfoProps } from "@/app/types/UserDetail";

interface CheckboxGroupProps {
  options: PermissionListProps[];
  selectedOptions: string[];
  onChange: (selectedOptions: string[]) => void;
  user: MyInfoProps;
}

const CheckboxGroup = ({
  options,
  selectedOptions,
  onChange,
  user,
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
  const thirdIndex = Math.ceil(groupedEntries.length / 3);
  const twoThirdIndex = Math.ceil((groupedEntries.length * 2) / 3);

  const leftGroups = groupedEntries.slice(0, thirdIndex);
  const midGroups = groupedEntries.slice(thirdIndex, twoThirdIndex);
  const rightGroups = groupedEntries.slice(twoThirdIndex);

  return (
    <div className="max-h-60 overflow-y-auto">
      <div className="grid grid-cols-3 gap-4">
      <div>
        {leftGroups.map(([tag, group]) => (
          <fieldset key={tag} className="border p-4 mb-4 w-full">
            <legend className="font-bold">{tag}</legend>
            {group.map((option) => (
              <label key={option.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option.id)}
                  onChange={() => handleCheckboxChange(option.id)}
                  className="form-checkbox"
                  disabled={
                    !user.is_superuser &&
                    !user.permissions.includes(option.code)
                  }
                />
                <span className="whitespace-nowrap">{option.name}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>
      <div>
          {midGroups.map(([tag, group]) => (
            <fieldset key={tag} className="border p-4 mb-4 w-full">
              <legend className="font-bold">{tag}</legend>
              {group.map((option) => (
                <label key={option.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedOptions.includes(option.id)}
                    onChange={() => handleCheckboxChange(option.id)}
                    className="form-checkbox"
                    disabled={
                      !user.is_superuser &&
                      !user.permissions.includes(option.code)
                    }
                  />
                  <span className="whitespace-nowrap">{option.name}</span>
                </label>
              ))}
            </fieldset>
          ))}
        </div>      
      <div>
        {rightGroups.map(([tag, group]) => (
          <fieldset key={tag} className="border p-4 mb-4 w-full">
            <legend className="font-bold">{tag}</legend>
            {group.map((option) => (
              <label key={option.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedOptions.includes(option.id)}
                  onChange={() => handleCheckboxChange(option.id)}
                  className="form-checkbox"
                  disabled={
                    !user.is_superuser &&
                    !user.permissions.includes(option.code)
                  }
                />
                <span className="whitespace-nowrap">{option.name}</span>
              </label>
            ))}
          </fieldset>
        ))}
        </div>
      </div>
    </div>
  );
};

export default CheckboxGroup;
