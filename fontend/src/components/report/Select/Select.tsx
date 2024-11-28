import React from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
import { useState, useEffect } from "react";
import ReactSelect, {
  components,
  OptionProps,
  MultiValueProps,
} from "react-select";

const MultiValue = (props: MultiValueProps<any>) => {
  const values = props.selectProps.value as any[];
  const lastValue = values[values.length - 1];
  let label = props.data.label;
  if (lastValue.label !== label) {
    label += ", ";
  }

  return <span>{label}</span>;
};

const Option = (props: OptionProps<any>) => {
  return (
    <components.Option {...props}>
      <div className="flex items-center">
        <div className="h-2 w-2"></div>
        <label id={props.data.value} className="ml-3 mt-1">
          <span>{props.data.label}</span>
        </label>
      </div>
    </components.Option>
  );
};

interface SelectProps {
  id: string;
  className?: string;
  closeMenuOnSelect?: boolean;
  hideSelectedOptions?: boolean;
  isClearable?: boolean;
  isDisabled?: boolean;
  isMulti?: boolean;
  isSearchable?: boolean;
  onChange: (value: any, action: any) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
  noIcons?: boolean;
  menuPlacement?: "auto" | "bottom" | "top";
  components?: any;
  value?: any[];
}

const Select: React.FC<SelectProps> = ({
  id,
  className = "",
  closeMenuOnSelect = true,
  hideSelectedOptions = false,
  isClearable = true,
  isDisabled = false,
  isMulti = false,
  isSearchable = true,
  onChange,
  options,
  placeholder,
  noIcons = false,
  menuPlacement = "auto",
  components = {},
  value = [],
}) => {
  const _noIconComponents = {
    DropdownIndicator: () => null,
    IndicatorSeparator: () => null,
  };

  let _components = isMulti ? { Option, MultiValue } : {};
  _components = noIcons
    ? { ..._components, ..._noIconComponents }
    : { ..._components, ...components };

  const selectedOptions: any[] = [];

  // Map array of values to an array of selected options
  if (value && Array.isArray(value)) {
    value.forEach((val) => {
      const found = options.find((opt) => opt.value === val);
      if (found) {
        selectedOptions.push({ ...found });
      }
    });
  }
  const [menuPortalTarget, setMenuPortalTarget] = useState<HTMLElement | null>(
    null
  );

  useEffect(() => {
    setMenuPortalTarget(document.body);
  }, []);

  return (
    <ReactSelect
      inputId={`input-${id}`}
      className={classnames(className, "flex flex-1 flex-col")}
      data-cy={`input-${id}`}
      classNamePrefix=""
      isDisabled={isDisabled}
      isClearable={isClearable}
      isMulti={isMulti}
      isSearchable={isSearchable}
      menuPlacement={menuPlacement}
      closeMenuOnSelect={closeMenuOnSelect}
      hideSelectedOptions={hideSelectedOptions}
      components={_components}
      placeholder={placeholder}
      options={options}
      blurInputOnSelect={true}
      menuPortalTarget={menuPortalTarget}
      styles={{
        control: (base) => ({
          ...base,
          height: 30,
          minHeight: 30,
          backgroundColor: "black",
          color: "#4eadcc",
          fontSize: "12px",
          borderColor: "#364395",
          borderWidth: "1px",
        }),
        valueContainer: (base) => ({
          ...base,
          height: 30,
          minHeight: 30,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#4eadcc",
          fontSize: "12px",
        }),
        input: (base) => ({
          ...base,
          height: 30,
          minHeight: 30,
          color: "#4eadcc",
          fontSize: "12px",
        }),
        indicatorsContainer: (base) => ({
          ...base,
          height: 30,
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: "black",
          color: "#4eadcc",
          fontSize: "12px",
          borderColor: "darkblue",
          borderWidth: "1px",
        }),
        menuList: (base) => ({
          ...base,
          backgroundColor: "black",
          color: "#4eadcc",
          fontSize: "12px",
          borderColor: "darkblue",
          borderWidth: "1px",
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected
            ? "#09336c"
            : state.isFocused
            ? "lightpurple"
            : "black",
          color: "#4eadcc",
          fontSize: "12px",
        }),
        singleValue: (base) => ({
          ...base,
          color: "#4eadcc",
          fontSize: "12px",
          marginBottom: "9px",
        }),
        menuPortal: (base) => ({
          ...base,
          zIndex: 9999,
        }),
      }}
      value={Array.isArray(value) ? selectedOptions : value}
      onChange={(selectedOptions, { action }) => {
        const newSelection = Array.isArray(selectedOptions)
          ? selectedOptions.map((option: any) => option.value)
          : selectedOptions;
        onChange(newSelection, action);
      }}
    />
  );
};

Select.propTypes = {
  id: PropTypes.string.isRequired,
  className: PropTypes.string,
  closeMenuOnSelect: PropTypes.bool,
  hideSelectedOptions: PropTypes.bool,
  isClearable: PropTypes.bool,
  isDisabled: PropTypes.bool,
  isMulti: PropTypes.bool,
  isSearchable: PropTypes.bool,
  noIcons: PropTypes.bool,
  menuPlacement: PropTypes.oneOf(["auto", "bottom", "top"]),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    }).isRequired
  ).isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.string),
    PropTypes.array,
    PropTypes.any,
  ]),
  components: PropTypes.object,
};

export default Select;
