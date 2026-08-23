export const MEAL_TYPES = [
  { key: "breakfast", label: "朝食" },
  { key: "lunch", label: "昼食" },
  { key: "dinner", label: "夕食" },
  { key: "snack", label: "間食" },
] as const;

export type MealTypeKey = (typeof MEAL_TYPES)[number]["key"];

export function MealFields({
  defaultDate,
  defaultTime,
  defaultType,
  defaultText,
}: {
  defaultDate: string;
  defaultTime: string;
  defaultType: MealTypeKey;
  defaultText?: string;
}) {
  return (
    <>
      <div className="field">
        <label htmlFor="mealType">区分</label>
        <select id="mealType" name="mealType" defaultValue={defaultType} required>
          {MEAL_TYPES.map((mealType) => (
            <option key={mealType.key} value={mealType.key}>
              {mealType.label}
            </option>
          ))}
        </select>
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="eatenDate">日付</label>
          <input id="eatenDate" name="eatenDate" type="date" defaultValue={defaultDate} required />
        </div>
        <div className="field">
          <label htmlFor="eatenTime">時刻</label>
          <input id="eatenTime" name="eatenTime" type="time" defaultValue={defaultTime} required />
        </div>
      </div>

      <div className="field">
        <label htmlFor="inputText">食べたもの</label>
        <textarea
          id="inputText"
          name="inputText"
          rows={4}
          placeholder="例:白米、納豆、目玉焼き2個、味噌汁"
          defaultValue={defaultText}
          required
        />
      </div>
    </>
  );
}
