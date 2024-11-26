import React, { useRef, FC } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
import * as ButtonEnums from "./ButtonEnums";
import "./style.css";

const sizeClasses = {
  [ButtonEnums.size.small]: "h-[26px] text-[13px]",
  [ButtonEnums.size.medium]: "h-[32px] text-[14px]",
};

const layoutClasses =
  "box-content inline-flex flex-row items-center justify-center gap-[5px] justify center px-[10px] outline-none rounded";
const baseFontTextClasses =
  "leading-[1.2] font-sans text-center whitespace-nowrap";

const fontTextClasses = {
  [ButtonEnums.type.primary]: classnames(baseFontTextClasses, "font-semibold"),
  [ButtonEnums.type.secondary]: classnames(baseFontTextClasses, "font-400"),
};

const baseEnabledEffectClasses =
  "transition duration-300 ease-in-out focus:outline-none";

const enabledEffectClasses = {
  [ButtonEnums.type.primary]: classnames(
    baseEnabledEffectClasses,
    "hover:bg-customblue-80 active:bg-customblue-40"
  ),
  [ButtonEnums.type.secondary]: classnames(
    baseEnabledEffectClasses,
    "hover:bg-customblue-50 active:bg-customblue-20"
  ),
};

const baseEnabledClasses = "text-white";

const enabledClasses = {
  [ButtonEnums.type.primary]: classnames(
    "primary-bg",
    baseEnabledClasses,
    enabledEffectClasses[ButtonEnums.type.primary]
  ),
  [ButtonEnums.type.secondary]: classnames(
    "secondary-bg",
    baseEnabledClasses,
    enabledEffectClasses[ButtonEnums.type.secondary]
  ),
};
const disabledClasses = "disabled-bg";

const defaults = {
  color: "default",
  disabled: false,
  rounded: "small",
  size: ButtonEnums.size.medium,
  type: ButtonEnums.type.primary,
};

interface ButtonProps {
  children?: React.ReactNode;
  size?: "small" | "medium";
  disabled?: boolean;
  type?: "primary" | "secondary";
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  name?: string;
  className?: string;
  style?: React.CSSProperties | null | undefined;
  onClick?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  dataCY?: string;
  startIconTooltip?: React.ReactNode;
  endIconTooltip?: React.ReactNode;
}

const Button: FC<ButtonProps> = ({
  children = "",
  size = defaults.size,
  disabled = defaults.disabled,
  type = defaults.type,
  startIcon: startIconProp,
  endIcon: endIconProp,
  name,
  style,
  className,
  onClick = () => {},
  dataCY,
  startIconTooltip = null,
  endIconTooltip = null,
}) => {
  dataCY = dataCY || `${name}-btn`;

  const buttonElement = useRef<HTMLButtonElement>(null);

  const handleOnClick = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    if (buttonElement.current) {
      buttonElement.current.blur();
    }
    if (!disabled) {
      onClick(e);
    }
  };

  const finalClassName = classnames(
    layoutClasses,
    fontTextClasses[type],
    disabled ? disabledClasses : enabledClasses[type],
    sizeClasses[size],
    children ? "min-w-[32px]" : "",
    className
  );

  return (
    <button
      className={finalClassName}
      disabled={disabled}
      ref={buttonElement}
      onClick={handleOnClick}
      data-cy={dataCY}
    >
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node,
  onClick: PropTypes.func.isRequired,
  size: PropTypes.oneOf([ButtonEnums.size.medium, ButtonEnums.size.small]),
  disabled: PropTypes.bool,
  type: PropTypes.oneOf([ButtonEnums.type.primary, ButtonEnums.type.secondary]),
  name: PropTypes.string,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  className: PropTypes.string,
  style: PropTypes.shape({ fill: PropTypes.string }),
  startIconTooltip: PropTypes.node,
  endIconTooltip: PropTypes.node,
  dataCY: PropTypes.string,
};

export default Button;
