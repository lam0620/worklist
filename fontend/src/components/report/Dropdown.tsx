import React, { useEffect, useCallback, useState, useRef } from "react";
import PropTypes from "prop-types";
import classnames from "classnames";
import ReactDOM from "react-dom";
import Typography from "./Typography";

const borderStyle = "border-b last:border-b-0 border-secondary-main";

interface DropdownItemProps {
  id: string;
  title: string;
  icon?: string | null; // Allow null to match PropTypes
  onClick: () => void;
}

interface DropdownProps {
  id: string;
  children: React.ReactNode;
  showDropdownIcon?: boolean;
  list: DropdownItemProps[];
  itemsClassName?: string;
  titleClassName?: string;
  showBorders?: boolean;
  alignment?: "left" | "right";
  maxCharactersPerLine?: number;
}

const Dropdown: React.FC<DropdownProps> = ({
  id,
  children,
  showDropdownIcon = true,
  list,
  itemsClassName,
  titleClassName,
  showBorders = true,
  alignment,
  maxCharactersPerLine = 20,
}) => {
  const [open, setOpen] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  // Chọn số ký tự tối đa trên mỗi dòng dựa trên tiêu đề dài nhất
  const longestTitle = list.reduce(
    (acc, item) => Math.max(acc, item.title.length),
    0
  );
  maxCharactersPerLine = maxCharactersPerLine ?? longestTitle;

  const DropdownItem: React.FC<DropdownItemProps> = useCallback(
    ({ id, title, icon, onClick }) => {
      const lines = [];
      for (let i = 0; i < title.length; i += maxCharactersPerLine) {
        lines.push(title.substring(i, i + maxCharactersPerLine));
      }

      return (
        <div
          key={title}
          className={classnames(
            "hover:bg-secondary-main flex cursor-pointer items-center px-4 py-2 transition duration-300",
            titleClassName,
            showBorders && borderStyle
          )}
          onClick={() => {
            setOpen(false);
            onClick();
          }}
          data-cy={id}
        >
          {icon && <span className="mr-2 w-4">📌</span>}{" "}
          {/* Placeholder for the icon */}
          <div style={{ whiteSpace: "nowrap" }}>
            {title.length > maxCharactersPerLine ? (
              <div>
                {lines.map((line, index) => (
                  <Typography key={index} className={itemsClassName}>
                    {line}
                  </Typography>
                ))}
              </div>
            ) : (
              <Typography className={itemsClassName}>{title}</Typography>
            )}
          </div>
        </div>
      );
    },
    [maxCharactersPerLine, itemsClassName, titleClassName, showBorders]
  );

  const renderTitleElement = () => (
    <div className="flex items-center">
      {children}
      {showDropdownIcon && <span className="ml-1">⬇️</span>}{" "}
      {/* Placeholder for the dropdown icon */}
    </div>
  );

  const toggleList = () => {
    setOpen((s) => !s);
  };

  const handleClick = (e: MouseEvent) => {
    if (elementRef.current && !elementRef.current.contains(e.target as Node)) {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      elementRef.current &&
      dropdownRef.current
    ) {
      const triggerRect = elementRef.current.getBoundingClientRect();
      const dropdownRect = dropdownRef.current.getBoundingClientRect();
      let x, y;

      switch (alignment) {
        case "right":
          x = triggerRect.right + window.scrollX - dropdownRect.width;
          y = triggerRect.bottom + window.scrollY;
          break;
        case "left":
          x = triggerRect.left + window.scrollX;
          y = triggerRect.bottom + window.scrollY;
          break;
        default:
          x = triggerRect.left + window.scrollX;
          y = triggerRect.bottom + window.scrollY;
          break;
      }
      setCoords({ x, y });
    }
  }, [open, alignment]);

  const renderList = () => {
    if (typeof document !== "undefined") {
      const portalElement = document.getElementById("react-portal");

      const listElement = (
        <div
          className={classnames(
            "top-100 border-secondary-main w-max-content absolute mt-2 transform rounded border bg-black shadow transition duration-300",
            {
              "right-0 origin-top-right": alignment === "right",
              "left-0 origin-top-left": alignment === "left",
            }
          )}
          ref={dropdownRef}
          style={{
            position: "absolute",
            top: `${coords.y}px`,
            left: open ? `${coords.x}px` : -999999,
            zIndex: 9999,
          }}
          data-cy={`${id}-dropdown`}
        >
          {list.map((item, idx) => (
            <DropdownItem
              id={item.id}
              title={item.title}
              icon={item.icon}
              onClick={item.onClick}
              key={idx}
            />
          ))}
        </div>
      );
      return portalElement
        ? ReactDOM.createPortal(listElement, portalElement)
        : null;
    }
    return null;
  };

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.addEventListener("click", handleClick);

      if (!open) {
        document.removeEventListener("click", handleClick);
      }
    }
  }, [open]);

  return (
    <div data-cy="dropdown" ref={elementRef} className="relative">
      <div className="flex cursor-pointer items-center" onClick={toggleList}>
        {renderTitleElement()}
      </div>
      {renderList()}
    </div>
  );
};

Dropdown.propTypes = {
  //id: PropTypes.string,
  children: PropTypes.node.isRequired,
  showDropdownIcon: PropTypes.bool,
  titleClassName: PropTypes.string,
  list: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      icon: PropTypes.string,
      onClick: PropTypes.func.isRequired,
    }).isRequired
  ).isRequired,
  alignment: PropTypes.oneOf(["left", "right"]),
  maxCharactersPerLine: PropTypes.number,
  showBorders: PropTypes.bool,
};

export default Dropdown;
