import { UUID } from "crypto";
import { useState, useRef, useEffect } from "react";

interface MultiSelectProps {
  options: {
    id: UUID;
    first_name?: string;
    last_name?: string;
    name?: string;
  }[];
  selectedOptions: string[];
  onChange: (selected: string[]) => void;
  placeholder: string;
}

const MultiSelect = ({
  options,
  selectedOptions,
  onChange,
  placeholder,
}: MultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleSelect = (id: string) => {
    if (selectedOptions.includes(id)) {
      onChange(selectedOptions.filter((option) => option !== id));
    } else {
      onChange([...selectedOptions, id]);
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={ref} className="relative">
      <div
        className="w-full px-3 py-2 border border-gray-300 rounded-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedOptions.length > 0
          ? options
              .filter((option) => selectedOptions.includes(option.id))
              .map(
                (option) =>
                  option.name || `${option.first_name} ${option.last_name}`
              )
              .join(", ")
          : placeholder}
      </div>
      {isOpen && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md max-h-60 overflow-auto">
          {options.map((option) => (
            <li
              key={option.id}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-200 ${
                selectedOptions.includes(option.id) ? "bg-gray-200" : ""
              }`}
              onClick={() => handleSelect(option.id)}
            >
              {option.name || `${option.first_name} ${option.last_name}`}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MultiSelect;
