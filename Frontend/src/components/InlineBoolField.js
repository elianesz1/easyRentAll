import React from "react";
import InlineField from "./InlineField";

export default function InlineBoolField({ label, value, onSave }) {
  return (
    <InlineField
      label={label}
      value={value}
      onSave={onSave}
      renderDisplay={(v) => renderBool(v)}
      renderInput={({ value: editingVal, setValue, onKeyDown }) => (
        <select
          className="border rounded px-2 py-1 text-sm"
          value={editingVal}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
        >
          <option value="null">לא צוין</option>
          <option value="true">כן</option>
          <option value="false">לא</option>
        </select>
      )}
      toInternal={(v) => valueToKey(v)}
      toExternal={(k) => keyToValue(k)}
    />
  );
}

function valueToKey(v){ return v === true ? "true" : v === false ? "false" : "null"; }
function keyToValue(k){ return k === "true" ? true : k === "false" ? false : null; }

function renderBool(v){
  if (v === true) return "כן";
  if (v === false) return "לא";
  return "לא צוין";
}
