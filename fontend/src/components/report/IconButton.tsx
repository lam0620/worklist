import React, { useRef, FC, ReactElement, MouseEvent } from "react";
import classnames from "classnames";

const baseClasses =
  "text-center items-center justify-center transition duration-300 ease-in-out outline-none font-bold focus:outline-none";

const roundedClasses = {
  none: "",
  small: "rounded",
  medium: "rounded-md",
  large: "rounded-lg",
  full: "rounded-full",
} as const;

const disabledClasses = {
  true: "ohif-disabled",
  false: "",
} as const;

const variantClasses = {
  text: {
    default:
      "text-white hover:bg-primary-light hover:text-black active:opacity-80 focus:bg-primary-light focus:text-black",
    primary:
      "text-primary-main hover:bg-primary-main hover:text-white active:opacity-80 focus:bg-primary-main focus:text-white",
    secondary:
      "text-secondary-light hover:bg-secondary-light hover:text-white active:opacity-80 focus:bg-secondary-light focus:text-white",
    white:
      "text-white hover:bg-white hover:text-black active:opacity-80 focus:bg-white focus:text-black",
    black:
      "text-black hover:bg-black hover:text-white focus:bg-black focus:text-white active:opacity-80",
  },
  outlined: {
    default:
      "border border-primary-light text-white hover:opacity-80 active:opacity-100 focus:opacity-80",
    primary:
      "border border-primary-main text-primary-main hover:opacity-80 active:opacity-100 focus:opacity-80",
    secondary:
      "border border-secondary-light text-secondary-light hover:opacity-80 active:opacity-100 focus:opacity-80",
    white:
      "border border-white text-white hover:opacity-80 active:opacity-100 focus:opacity-80",
    black:
      "border border-primary-main text-white hover:bg-primary-main focus:bg-primary-main hover:border-black focus:border-black",
  },
  contained: {
    default:
      "text-common-bright hover:opacity-80 active:opacity-100 focus:opacity-80",
    primary: "text-white hover:opacity-80 active:opacity-100 focus:opacity-80",
    secondary:
      "text-white hover:opacity-80 active:opacity-100 focus:opacity-80",
    white: "text-black hover:opacity-80 active:opacity-100 focus:opacity-80",
    black: "text-white hover:opacity-80 active:opacity-100 focus:opacity-80",
  },
} as const;

const sizeClasses = {
  small: "py-2 px-2 text-base",
  medium: "py-3 px-3 text-lg",
  large: "py-4 px-4 text-xl",
  initial: "",
  toolbar: "text-lg",
  toolbox: "w-[24px] h-[24px]",
} as const;

const iconSizeClasses = {
  small: "w-4 h-4",
  medium: "w-5 h-5",
  large: "w-6 h-6",
  toolbar: "w-[28px] h-[28px]",
  toolbox: "w-[24px] h-[24px]",
  initial: "",
} as const;

const fullWidthClasses = {
  true: "flex w-full",
  false: "inline-flex",
} as const;

interface IconButtonProps {
  children: ReactElement;
  variant?: "text" | "outlined" | "contained";
  color?: "default" | "primary" | "secondary" | "white" | "black";
  size?: "small" | "medium" | "large" | "initial" | "toolbar" | "toolbox";
  rounded?: "none" | "small" | "medium" | "large" | "full";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  fullWidth?: boolean;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  id?: string;
  [key: string]: any;
}

const IconButton: FC<IconButtonProps> = ({
  children,
  variant = "contained",
  color = "default",
  size = "medium",
  rounded = "medium",
  disabled = false,
  type = "button",
  fullWidth = false,
  onClick = () => {},
  className,
  id,
  ...rest
}) => {
  const buttonElement = useRef<HTMLButtonElement>(null);

  const handleOnClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (buttonElement.current) {
      buttonElement.current.blur();
    }
    onClick(e);
  };

  const padding =
    size === "toolbar" ? "6px" : size === "toolbox" ? "4px" : undefined;

  const variantClass =
    variantClasses[variant]?.[color as keyof (typeof variantClasses)["text"]] ||
    "";
  const sizeClass = sizeClasses[size as keyof typeof sizeClasses] || "";
  const iconSizeClass =
    iconSizeClasses[size as keyof typeof iconSizeClasses] || "";
  const fullWidthClass = fullWidth
    ? fullWidthClasses.true
    : fullWidthClasses.false;
  const disabledClass = disabled ? disabledClasses.true : disabledClasses.false;

  return (
    <button
      className={classnames(
        baseClasses,
        variantClass,
        roundedClasses[rounded],
        sizeClass,
        fullWidthClass,
        disabledClass,
        className
      )}
      style={{ padding }}
      ref={buttonElement}
      onClick={handleOnClick}
      type={type}
      data-cy={rest["data-cy"] ?? id}
      data-tool={rest["data-tool"]}
      disabled={disabled}
    >
      {React.cloneElement(children, {
        className: classnames(iconSizeClass, "fill-current"),
      })}
    </button>
  );
};

export default IconButton;
