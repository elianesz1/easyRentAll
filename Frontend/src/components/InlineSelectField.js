import React from "react";
import InlineField from "./InlineField";

export default function InlineSelectField({ label, value, options = [], onSave, dir = "rtl" }) {
  return (
    <InlineField
      label={label}
      value={value}
      onSave={onSave}
      renderDisplay={(v) => displayLabelForValue(v, options)}
      renderInput={({ value: val, setValue, onKeyDown }) => (
        <select
          dir={dir}
          className="border rounded px-2 py-1 text-sm w-48"
          value={val ?? ""}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
        >
          <option value="">— בחר/י —</option>
          {options.map((o) => (
            <option key={String(o.value)} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
      toInternal={(v) => (v ?? "")}
      toExternal={(v) => (v || null)}
    />
  );
}

function displayLabelForValue(val, options) {
  if (val == null || val === "") return "לא צוין";
  const match = options.find((o) => String(o.value) === String(val));
  return match ? match.label : String(val);
}
