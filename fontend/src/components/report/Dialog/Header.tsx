import React from "react";
import classNames from "classnames";
import Typography from "../Typography";

interface HeaderProps {
  title?: string;
  noCloseButton?: boolean;
  onClose?: () => void;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  title,
  noCloseButton = false,
  onClose,
  className,
}) => {
  const headerClasses = classNames(
    "bg-primary-dark flex items-center justify-between pb-[20px]",
    className
  );

  return (
    <div className={headerClasses}>
      <Typography variant="h6" className="!leading-[1.2] text-[18px]">
        {title}
      </Typography>
      {!noCloseButton && (
        <button
          onClick={onClose}
          className="text-white text-[16px] p-2 hover:bg-gray-600 rounded"
        >
          ✖
        </button>
      )}
    </div>
  );
};

export default Header;
