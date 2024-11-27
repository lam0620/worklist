import React from "react";
import classNames from "classnames";
import Button from "../Button";

interface Action {
  id: string;
  text: string;
  value?: any;
  type: "primary" | "secondary";
  classes?: string[];
}

interface FooterProps {
  actions?: Action[];
  onSubmit: (params: {
    action: Action;
    value: any;
    event: React.MouseEvent<HTMLButtonElement, MouseEvent>;
  }) => void;
  value?: any;
  className?: string;
}

const Footer: React.FC<FooterProps> = ({
  actions,
  onSubmit,
  value,
  className,
}) => {
  const footerClasses = classNames(
    "flex items-center justify-end pt-[20px]",
    className
  );

  return (
    <div className={footerClasses}>
      {actions?.map((action, index) => {
        const isFirst = index === 0;
        const onClickHandler = (
          event: React.MouseEvent<HTMLButtonElement, MouseEvent>
        ) => onSubmit({ action, value, event });

        return (
          <Button
            key={action.id}
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

export default Footer;
