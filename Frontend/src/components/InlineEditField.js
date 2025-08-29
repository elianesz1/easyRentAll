import React from "react";
import InlineField from "./InlineField";

export default function InlineEditField({ label, value, type = "text", onSave, dir = "rtl", placeholder = "" }) {
  return (
    <InlineField
      label={label}
      value={value}
      onSave={onSave}
      renderDisplay={(v) => renderValue(v, type)}
      renderInput={({ value: editingVal, setValue, onKeyDown }) => (
        <input
          dir={dir}
          type={type}
          className="border rounded px-2 py-1 text-sm w-44"
          value={editingVal ?? ""}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
        />
      )}

      toInternal={(v) => (type === "date" && v ? toYMD(v) : (v ?? ""))}
      toExternal={(v) => {
        if (type === "number") return v !== "" ? Number(v) : null;
        if (type === "date") return v ? new Date(v) : null;
        return v !== "" ? v : null;
      }}
    />
  );
}

function toYMD(d) {
  const date = new Date(d);
  if (!isFinite(date)) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function renderValue(v, type) {
  if (v == null || v === "") return "לא צוין";
  if (type === "date") {
    const d = new Date(v);
    return isFinite(d) ? d.toLocaleDateString("he-IL") : String(v);
  }
  return String(v);
}
