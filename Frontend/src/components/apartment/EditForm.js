import React from "react";
import PropTypes from "prop-types";
import { NEIGHBORHOODS_HE } from "../../utils/neighborhoods";

export default function EditForm({
  draft,
  setDraft,
  BOOL_FIELDS,
  isDirty,
  onSave,
}) {
  return (
    <section className="bg-gray-50 rounded-2xl shadow p-6 text-gray-800" dir="rtl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* כותרת */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">כותרת</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
          />
        </div>

        {/* תאריך העלאה */}
        <div>
          <label className="block text-sm font-medium mb-1">תאריך העלאה</label>
          <input
            type="text"
            className="w-full rounded-md border px-3 py-2"
            value={draft.upload_date}
            onChange={(e) => setDraft((d) => ({ ...d, upload_date: e.target.value }))}
            placeholder="למשל: 5.10.2025 או 2025-10-05"
          />
        </div>

        {/* מפרסם */}
        <div>
          <label className="block text-sm font-medium mb-1">מפרסם</label>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={draft.contactName}
            onChange={(e) => setDraft((d) => ({ ...d, contactName: e.target.value }))}
          />
        </div>

        {/* קטגוריה */}
        <div>
          <label className="block text-sm font-medium mb-1">קטגוריה</label>
          <select
            className="w-full rounded-md border px-3 py-2"
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
          >
            <option value=""></option>
            <option value="שכירות">שכירות</option>
            <option value="מכירה">מכירה</option>
            <option value="סאבלט">סאבלט</option>
          </select>
        </div>

        {/* סוג השכרה */}
        <div>
          <label className="block text-sm font-medium mb-1">סוג השכרה</label>
          <select
            className="w-full rounded-md border px-3 py-2"
            value={draft.rental_scope}
            onChange={(e) => setDraft((d) => ({ ...d, rental_scope: e.target.value }))}
          >
            <option value=""></option>
            <option value="דירה שלמה">דירה שלמה</option>
            <option value="שותף">דירת שותפים</option>
          </select>
        </div>

        {/* כתובת + נקה */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">כתובת</label>
            <input
              className="w-full rounded-md border px-3 py-2"
              value={draft.address}
              onChange={(e) => setDraft((d) => ({ ...d, address: e.target.value }))}
            />
          </div>
          <button
            type="button"
            className="h-[38px] px-3 rounded-md border text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setDraft((d) => ({ ...d, address: "" }))}
          >
            נקה
          </button>
        </div>

        {/* מחיר + נקה */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">מחיר</label>
            <input
              type="number"
              className="w-full rounded-md border px-3 py-2"
              value={draft.price}
              onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
            />
          </div>
          <button
            type="button"
            className="h-[38px] px-3 rounded-md border text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setDraft((d) => ({ ...d, price: "" }))}
          >
            נקה
          </button>
        </div>

        {/* שכונה */}
        <div>
          <label className="block text-sm font-medium mb-1">שכונה</label>
          <select
            className="w-full rounded-md border px-3 py-2"
            value={draft.neighborhood}
            onChange={(e) => setDraft((d) => ({ ...d, neighborhood: e.target.value }))}
          >
            <option value=""></option>
            {NEIGHBORHOODS_HE.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        {/* תאריך כניסה + נקה */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">תאריך כניסה</label>
            <input
              type="date"
              className="w-full rounded-md border px-3 py-2"
              value={draft.available_from}
              onChange={(e) => setDraft((d) => ({ ...d, available_from: e.target.value }))}
            />
          </div>
          <button
            type="button"
            className="h-[38px] px-3 rounded-md border text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setDraft((d) => ({ ...d, available_from: "" }))}
            title="נקה תאריך"
          >
            נקה
          </button>
        </div>

        {/* מספר חדרים + נקה */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">מספר חדרים</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={draft.rooms}
              onChange={(e) => setDraft((d) => ({ ...d, rooms: e.target.value }))}
            >
              <option value=""></option>
              {["1", "1.5", "2", "2.5", "3", "3.5", "4", "4.5", "5"].map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="h-[38px] px-3 rounded-md border text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setDraft((d) => ({ ...d, rooms: "" }))}
          >
            נקה
          </button>
        </div>

        {/* שטח + נקה */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">שטח</label>
            <input
              type="number"
              className="w-full rounded-md border px-3 py-2"
              value={draft.size}
              onChange={(e) => setDraft((d) => ({ ...d, size: e.target.value }))}
            />
          </div>
          <button
            type="button"
            className="h-[38px] px-3 rounded-md border text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setDraft((d) => ({ ...d, size: "" }))}
          >
            נקה
          </button>
        </div>

        {/* קומה + נקה */}
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">קומה</label>
            <input
              type="number"
              className="w-full rounded-md border px-3 py-2"
              value={draft.floor}
              onChange={(e) => setDraft((d) => ({ ...d, floor: e.target.value }))}
            />
          </div>
          <button
            type="button"
            className="h-[38px] px-3 rounded-md border text-sm text-gray-700 hover:bg-gray-50"
            onClick={() => setDraft((d) => ({ ...d, floor: "" }))}
          >
            נקה
          </button>
        </div>

        {/* בוליאניים – כן/לא/לא צוין */}
        {BOOL_FIELDS.map(([label, key]) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <select
              className="w-full rounded-md border px-3 py-2"
              value={draft[key]}
              onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
            >
              <option value="">לא צוין</option>
              <option value="yes">כן</option>
              <option value="no">לא</option>
            </select>
          </div>
        ))}

        {/* הפוסט המקורי */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">הפוסט המקורי מהפייסבוק</label>
          <textarea
            className="w-full min-h-[160px] border rounded p-3 text-sm"
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            placeholder="הקלד תיאור…"
          />
        </div>
      </div>

      {/* שמור הכל */}
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={onSave}
          disabled={!isDirty}
          className={`px-5 py-2 rounded-md text-white ${
            isDirty ? "bg-[#5171b7] hover:bg-[#3f5ea4]" : "bg-gray-400 cursor-not-allowed"
          }`}
          title={isDirty ? "שמור את כל השינויים" : "אין שינויים לשמירה"}
        >
          שמור הכל
        </button>
      </div>
    </section>
  );
}

EditForm.propTypes = {
  draft: PropTypes.object.isRequired,
  setDraft: PropTypes.func.isRequired,
  BOOL_FIELDS: PropTypes.array.isRequired,
  isDirty: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
};
