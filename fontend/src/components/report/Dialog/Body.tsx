import React from "react";
import classNames from "classnames";
import Typography from "../Typography";

interface BodyProps {
  text?: string;
  className?: string;
}

const Body: React.FC<BodyProps> = ({ text, className }) => {
  const bodyClasses = classNames(
    "relative flex-auto bg-primary-dark",
    className
  );

  return (
    <div className={bodyClasses}>
      <Typography
        variant="inherit"
        color="initial"
        className="text-[14px] !leading-[1.2]"
      >
        {text}
      </Typography>
    </div>
  );
};

export default Body;
