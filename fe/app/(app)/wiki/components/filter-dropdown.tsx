"use client";

import { AppDropdown, type AppDropdownOption } from "@/components/ui/app-dropdown";

type FilterDropdownProps = {
  label: string;
  value: string;
  options: AppDropdownOption[];
  onChange: (value: string) => void;
};

export function FilterDropdown({ label, value, options, onChange }: FilterDropdownProps) {
  return (
    <AppDropdown
      label={label}
      value={value}
      options={options}
      onChange={onChange}
      variant="filter"
      className="w-auto"
    />
  );
}

export type { AppDropdownOption as FilterDropdownOption };
