import React from "react";
import classNames from "classnames";
import PropTypes from "prop-types";

import Button, { ButtonEnums } from "../Button";

interface Action {
  id: string;
  text: string;
  value?: any;
  type: "primary" | "secondary";
  classes?: string[];
}

interface FooterProps {
  actions: Action[];
  className?: string;
  onSubmit: ({
    action,
    value,
    event,
  }: {
    action: Action;
    value: any;
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>;
  }) => void;
  value: any;
}

const Footer: React.FC<FooterProps> = ({
  actions = [],
  className,
  onSubmit = () => {},
  value,
}) => {
  const flex = "flex items-center justify-end";
  const padding = "pt-[20px]";

  return (
    <div className={classNames(flex, padding, className)}>
      {actions?.map((action, index) => {
        const isFirst = index === 0;

        const onClickHandler = (
          event: React.MouseEvent<HTMLButtonElement, MouseEvent>
        ) => onSubmit({ action, value, event });

        return (
          <Button
            key={index}
            name={action.text}
            className={classNames({ "ml-2": !isFirst }, action.classes)}
            type={action.type}
            onClick={onClickHandler}
          >
            {action.text}
          </Button>
        );
      })}
    </div>
  );
};

Footer.propTypes = {
  className: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
};

export default Footer;
