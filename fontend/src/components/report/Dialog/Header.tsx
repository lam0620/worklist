import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types";

import Typography from "../Typography";

interface HeaderProps {
  className?: string;
  title: string;
  noCloseButton?: boolean;
  onClose?: () => void;
}
const Header = ({ title, noCloseButton = false, onClose }: HeaderProps) => {
  const theme = "bg-primary-dark";
  const flex = "flex items-center justify-between";
  const padding = "pb-[20px]";

  return (
    <div className={classNames(theme, flex, padding)}>
      <Typography variant="h6" className="!leading-[1.2] text-[18px]">
        {title}
      </Typography>
    </div>
  );
};

Header.propTypes = {
  className: PropTypes.string,
  title: PropTypes.string,
  noCloseButton: PropTypes.bool,
  onClose: PropTypes.func,
};

export default Header;
