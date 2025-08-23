import React, { useState } from "react";

export default function InlineEditField({ label, value, type = "text", onSave, dir = "rtl" }) {
  const [editingVal, setEditingVal] = useState(type === "date" && value ? toYMD(value) : value ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(type === "number" && editingVal !== "" ? Number(editingVal) : editingVal || null);
    } finally { setSaving(false); }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="text-sm text-gray-800"><strong>{label}:</strong> {renderValue(value, type)}</div>
      <div className="flex items-center gap-2">
        <input
          dir={dir}
          type={type}
          className="border rounded px-2 py-1 text-sm w-44"
          value={editingVal ?? ""}
          onChange={(e) => setEditingVal(e.target.value)}
        />
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-60"
          disabled={saving}
        >
          שמור
        </button>
      </div>
    </div>
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
    return isFinite(d) ? d.toLocaleDateString("he-IL") : v;
  }
  return String(v);
}
