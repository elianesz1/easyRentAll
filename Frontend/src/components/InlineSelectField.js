import React, { useState } from "react";

export default function InlineSelectField({ label, value, options = [], onSave, dir = "rtl" }) {
  const [val, setVal] = useState(value ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try { await onSave(val || null); } finally { setSaving(false); }
  };

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="text-sm text-gray-800">
        <strong>{label}:</strong> {value ? String(value) : "לא צוין"}
      </div>
      <div className="flex items-center gap-2">
        <select
          dir={dir}
          className="border rounded px-2 py-1 text-sm w-48"
          value={val ?? ""}
          onChange={(e) => setVal(e.target.value)}
        >
          <option value="">— בחר/י —</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

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
