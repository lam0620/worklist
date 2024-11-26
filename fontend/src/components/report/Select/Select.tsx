import React from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
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
      menuPortalTarget={document.body}
      styles={{
        control: (base) => ({
          ...base,
          height: 30,
          minHeight: 30,
          backgroundColor: "black", // Màu nền đen
          color: "#4eadcc", // Chữ trắng
          fontSize: "12px", // Cỡ chữ
          borderColor: "#364395", // Màu viền xanh đậm
          borderWidth: "1px", // Độ dày viền
        }),
        valueContainer: (base) => ({
          ...base,
          height: 30,
          minHeight: 30,
          display: "flex",
          justifyContent: "center",
          alignItems: "center", // Căn giữa giá trị
          color: "#4eadcc", // Chữ trắng
          fontSize: "12px", // Cỡ chữ
        }),
        input: (base) => ({
          ...base,
          height: 30,
          minHeight: 30,
          color: "#4eadcc", // Chữ trắng
          fontSize: "12px", // Cỡ chữ
        }),
        indicatorsContainer: (base) => ({
          ...base,
          height: 30,
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: "black", // Màu nền đen cho menu
          color: "#4eadcc", // Chữ trắng cho menu
          fontSize: "12px", // Cỡ chữ
          borderColor: "darkblue", // Màu viền xanh đậm
          borderWidth: "1px", // Độ dày viền
        }),
        menuList: (base) => ({
          ...base,
          backgroundColor: "black", // Màu nền đen cho danh sách menu
          color: "#4eadcc", // Chữ trắng cho danh sách menu
          fontSize: "12px", // Cỡ chữ
          borderColor: "darkblue", // Màu viền xanh đậm
          borderWidth: "1px", // Độ dày viền
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isSelected
            ? "#09336c"
            : state.isFocused
            ? "lightpurple"
            : "black", // Màu nền khi hover và khi được chọn
          color: "#4eadcc", // Chữ trắng cho tùy chọn
          fontSize: "12px", // Cỡ chữ
        }),
        singleValue: (base) => ({
          ...base,
          color: "#4eadcc", // Chữ trắng cho giá trị đơn
          fontSize: "12px", // Cỡ chữ
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
