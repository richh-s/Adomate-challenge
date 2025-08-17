"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

type HeaderButtonProps = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  bgColor: string;
  hoverColor: string;
  title?: string;
};

const HeaderButton: React.FC<HeaderButtonProps> = ({
  label,
  icon: Icon,
  onClick,
  bgColor,
  hoverColor,
  title,
}) => {
  return (
    <button
      className={`flex items-center px-3 py-1 rounded text-sm text-white ${bgColor} ${hoverColor}`}
      onClick={onClick}
      title={title}
    >
      <Icon size={16} className="mr-1" />
      {label}
    </button>
  );
};

export default HeaderButton;
