import React, { useState } from "react";

export default function InlineBoolField({ label, value, onSave }) {
  const [editingVal, setEditingVal] = useState(valueToKey(value));
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try { await onSave(keyToValue(editingVal)); } finally { setSaving(false); }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="text-sm text-gray-800"><strong>{label}:</strong> {renderBool(value)}</div>
      <div className="flex items-center gap-2">
        <select
          className="border rounded px-2 py-1 text-sm"
          value={editingVal}
          onChange={(e) => setEditingVal(e.target.value)}
        >
          <option value="null">לא צוין</option>
          <option value="true">כן</option>
          <option value="false">לא</option>
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

function valueToKey(v){ return v === true ? "true" : v === false ? "false" : "null"; }
function keyToValue(k){ return k === "true" ? true : k === "false" ? false : null; }

function renderBool(v){
  if (v === true) return "כן";
  if (v === false) return "לא";
  return "לא צוין";
}
