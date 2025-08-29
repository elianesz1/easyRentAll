import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useAdmin } from "../contexts/AdminContext";

export default function InlineField({
  label,
  value,
  onSave,
  renderDisplay,
  renderInput,
  toInternal = (v) => (v ?? ""),
  toExternal = (v) => (v === "" ? null : v),
}) {
  const { canEdit } = useAdmin();

  const initialEditingVal = useMemo(() => toInternal(value), [value, toInternal]);
  const [editingVal, setEditingVal] = useState(initialEditingVal);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setEditingVal(initialEditingVal); }, [initialEditingVal]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const out = toExternal(editingVal);
      await onSave(out);
    } finally {
      setSaving(false);
    }
  }, [editingVal, onSave, toExternal]);

  const onKeyDown = useCallback((e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!saving) handleSave();
    } else if (e.key === "Escape") {
      setEditingVal(initialEditingVal);
    }
  }, [handleSave, saving, initialEditingVal]);

  if (!canEdit) {
    return (
      <div className="flex items-center justify-between gap-3 py-1">
        <div className="text-sm text-gray-800">
          <strong>{label}:</strong> {renderDisplay(value)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <div className="text-sm text-gray-800">
        <strong>{label}:</strong> {renderDisplay(value)}
      </div>
      <div className="flex items-center gap-2">
        {renderInput({ value: editingVal, setValue: setEditingVal, onKeyDown })}
        <button
          onClick={handleSave}
          className="bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-60"
          disabled={saving}
        >
          {saving ? "שומר..." : "שמור"}
        </button>
      </div>
    </div>
  );
}
