import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type {
  AIProvider,
  BodyCompositionDraft,
  DailyAdvice,
  DailyAdviceContext,
  DailyAdviceResult,
  ImageInput,
  MealNutritionDraft,
  WeeklyReview,
  WeeklyReviewContext,
  WeeklyReviewResult,
} from "./provider";

// コスト・精度のバランスはPhase 4実装時に環境変数で切替可能にする(Phase 1合意事項)。
const BODY_SCAN_MODEL = process.env.AI_BODY_SCAN_MODEL || "claude-opus-5";
const MEAL_ANALYSIS_MODEL = process.env.AI_MEAL_ANALYSIS_MODEL || "claude-opus-5";
const DAILY_ADVICE_MODEL = process.env.AI_DAILY_ADVICE_MODEL || "claude-opus-5";
const WEEKLY_REVIEW_MODEL = process.env.AI_WEEKLY_REVIEW_MODEL || "claude-opus-5";

const BodyCompositionDraftSchema = z.object({
  weightKg: z.number().nullable().describe("体重(kg)"),
  bmi: z.number().nullable().describe("BMI"),
  bodyFatPercent: z.number().nullable().describe("体脂肪率(%)"),
  skeletalMusclePercent: z.number().nullable().describe("骨格筋率(%)"),
  muscleMassKg: z.number().nullable().describe("筋肉量(kg)"),
  proteinPercent: z.number().nullable().describe("タンパク質率(%)"),
  basalMetabolismKcal: z.number().nullable().describe("基礎代謝量(kcal)"),
  leanBodyMassKg: z.number().nullable().describe("除脂肪体重(kg)"),
  subcutaneousFatPercent: z.number().nullable().describe("皮下脂肪率(%)"),
  visceralFatLevel: z.number().nullable().describe("内臓脂肪レベル"),
  bodyWaterPercent: z.number().nullable().describe("体水分率(%)"),
  boneMassKg: z.number().nullable().describe("骨量(kg)"),
  bodyTypeLabel: z.string().nullable().describe("体型判定の文字列(例: 標準、重度の肥満)"),
  bodyAge: z.number().nullable().describe("体内年齢"),
});

const BODY_SCAN_SYSTEM_PROMPT = `あなたは体組成計アプリのスクリーンショットから数値を読み取るアシスタントです。
画面に実際に表示されている数値だけを正確に読み取ってください。
推測・計算による補完や、表示されていない項目の創作は禁止します。
画面に存在しない・読み取れない項目は必ずnullにしてください。
単位(kg, %, kcal など)は結果に含めず、数値のみを返してください。`;

const MealNutritionDraftSchema = z.object({
  description: z
    .string()
    .nullable()
    .describe("写真から識別した食事内容の簡潔な説明(例:白米、焼き鮭、味噌汁)。テキスト入力からの推定時はnull"),
  estimatedCaloriesKcal: z.number().nullable().describe("推定カロリー(kcal)"),
  estimatedProteinG: z.number().nullable().describe("推定たんぱく質(g)"),
  estimatedFatG: z.number().nullable().describe("推定脂質(g)"),
  estimatedCarbsG: z.number().nullable().describe("推定炭水化物(g)"),
  estimatedFiberG: z.number().nullable().describe("推定食物繊維(g)。わからない場合はnull"),
});

const MEAL_SYSTEM_PROMPT = `あなたは食事内容から栄養価を推定するアシスタントです。
一般的な日本の食品・料理の標準的な量をもとに、常識的な範囲でカロリー・たんぱく質・脂質・炭水化物を推定してください。
情報が少ない、または量が不明な場合は、一般的な1人前の分量を仮定して構いません。
数値化がまったくできない場合のみ、そのフィールドをnullにしてください。
この推定はあくまで参考値であり、正確な栄養計算ではないことを前提とします。`;

const DailyAdviceSchema = z.object({
  points: z
    .array(z.string())
    .min(1)
    .max(4)
    .describe("今日のアドバイスの要点。箇条書きで2〜4件程度、それぞれ1〜2文で簡潔に"),
  detail: z
    .string()
    .describe("要点を踏まえた、もう少し詳しい解説文(3〜6文程度)"),
});

/**
 * 安全性の制約(元の要件定義 セクション12/17を反映):
 *   - 極端な食事制限・断食・欠食・過度な運動・急激な減量を勧めない
 *   - 医療行為の代替(診断・処方に類する助言)を行わない
 *   - 単日の増減ではなく、7日〜数週間の傾向で評価する
 *   - 一時的な体重増加の後に過度な制限を勧めない
 *   - 生理周期との相関に触れる場合は断定せず、あくまで一般的な傾向として
 *     ヘッジした表現にとどめる(本アプリでは生理データ自体はこのコンテキストに
 *     含まれないため、通常は言及しない)
 *   - 常にAIによる参考情報であることが伝わる、断定しすぎない口調で書く
 */
const DAILY_ADVICE_SYSTEM_PROMPT = `あなたは、夫婦2人のためのダイエット・健康管理アプリの中で、
日々の体組成・食事記録をもとにパーソナライズされたアドバイスを生成するアシスタントです。

必ず守るルール:
- 極端な食事制限、断食、欠食、過度な運動、急激な減量は絶対に勧めない。
- 医療行為の代替となるような診断・処方に類する助言は行わない。体調に不安がある場合は
  医療機関へ相談するよう促す。
- 単日の体重の増減だけで一喜一憂させるのではなく、7日〜数週間単位の傾向をもとに、
  holisticに(全体的に)評価する。
- 一時的な体重増加があっても、過度な食事制限を勧めない。水分量や生活リズムなど
  複数の要因があり得ることを踏まえた、穏やかで前向きなトーンで書く。
- 断定的な表現を避け、あくまで参考情報であることが伝わる書き方にする。
- 提供された数値データの範囲内で助言し、存在しないデータを創作しない。
- ポジティブで、続けたくなるような励ましのトーンを基本とする。`;

function formatContextForPrompt(context: DailyAdviceContext): string {
  const lines: string[] = [];
  lines.push(`利用者名: ${context.displayName}`);

  if (context.today.latestWeightKg !== null) {
    lines.push(
      `直近の体重: ${context.today.latestWeightKg}kg` +
        (context.today.latestMeasuredAt ? `(測定: ${context.today.latestMeasuredAt})` : ""),
    );
  }
  if (context.today.bodyFatPercent !== null) {
    lines.push(`直近の体脂肪率: ${context.today.bodyFatPercent}%`);
  }
  if (context.change7dKg !== null) {
    lines.push(`7日間の体重変化: ${context.change7dKg > 0 ? "+" : ""}${context.change7dKg}kg`);
  }
  if (context.change30dKg !== null) {
    lines.push(`30日間の体重変化: ${context.change30dKg > 0 ? "+" : ""}${context.change30dKg}kg`);
  }
  if (context.goal) {
    lines.push(
      `目標: 開始${context.goal.startWeightKg}kg → 目標${context.goal.targetWeightKg}kg` +
        (context.goal.targetDate ? `(目標日: ${context.goal.targetDate})` : ""),
    );
  } else {
    lines.push("目標: 未設定");
  }

  if (context.recentWeights.length > 0) {
    lines.push("直近の体重推移(日付: 体重kg):");
    for (const point of context.recentWeights) {
      lines.push(`  ${point.date}: ${point.weightKg}kg`);
    }
  }

  if (context.todaysMeals.length > 0) {
    lines.push("本日記録済みの食事:");
    for (const meal of context.todaysMeals) {
      const kcal = meal.caloriesKcal !== null ? `約${meal.caloriesKcal}kcal` : "カロリー不明";
      lines.push(`  ${meal.mealType}: ${meal.text ?? "(内容未記録)"} (${kcal})`);
    }
  } else {
    lines.push("本日記録済みの食事: なし");
  }

  if (context.todaysExerciseMinutes > 0) {
    lines.push(
      `本日の運動: 合計${context.todaysExerciseMinutes}分` +
        (context.todaysExerciseCaloriesKcal !== null
          ? `(推定消費 約${context.todaysExerciseCaloriesKcal}kcal)`
          : ""),
    );
  } else {
    lines.push("本日の運動記録: なし");
  }

  return lines.join("\n");
}

const WeeklyReviewSchema = z.object({
  summary: z.string().describe("その週全体の総括。3〜5文程度"),
  goodPoints: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe("その週で良かった点。1〜3件、それぞれ1文程度"),
  focusNextWeek: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe("来週に向けて意識するとよいこと。1〜3件、それぞれ1文程度"),
  exerciseSuggestion: z
    .string()
    .describe(
      "目標日までを見据えた、来週以降に取り組むとよい運動の種類・頻度・時間の目安。安全なペースの範囲で具体的に。目標が未設定の場合は、直近の運動習慣を踏まえた一般的な提案にする",
    ),
  dietTip: z
    .string()
    .describe(
      "目標に向けて食生活で気をつけるとよいこと。1〜2文程度。極端な制限ではなく、続けやすい具体的な工夫を中心にする",
    ),
});

/**
 * 日次アドバイスと同じ安全性の制約に加え、週次レビューならではの方針:
 *   - 1週間という単位そのものが「短期の増減に振り回されない」ための区切りなので、
 *     week単位の記録の一貫性・習慣そのものを評価の中心に置く
 *   - 記録が少ない/欠けている週でも、責めるような表現をしない
 */
const WEEKLY_REVIEW_SYSTEM_PROMPT = `あなたは、夫婦2人のためのダイエット・健康管理アプリの中で、
1週間(月曜〜日曜)の体組成・食事記録をもとに振り返りレビューを生成するアシスタントです。

必ず守るルール:
- 極端な食事制限、断食、欠食、過度な運動、急激な減量は絶対に勧めない。
- 医療行為の代替となるような診断・処方に類する助言は行わない。
- その週の体重の増減だけで評価せず、記録の継続・生活リズムなど習慣面も含めて
  holisticに(全体的に)評価する。
- 記録が少ない、または体重が増えた週であっても、責めるような書き方をせず、
  次につながる前向きな振り返りにする。
- 断定的な表現を避け、あくまで参考情報であることが伝わる書き方にする。
- 提供された数値データの範囲内で助言し、存在しないデータを創作しない。
- 目標(目標体重・目標日)が設定されている場合、目標までの残り体重と目標日までの
  残り日数から、安全なペース(目安として体重の減少は週0.5kg程度までの緩やかな
  範囲)に沿った運動の提案(種類・頻度・時間の目安)を具体的に行う。逆算すると
  安全なペースでは目標日に間に合わない場合も、無理な運動量や過度な食事制限は
  提案せず、ペースの見直しも選択肢であることを穏やかに伝える。
- 食生活については、極端な制限ではなく、間食の内容・水分の摂り方・タンパク質の
  摂取など、続けやすい具体的な工夫を1〜2文で伝える。`;

function formatWeeklyContextForPrompt(context: WeeklyReviewContext): string {
  const lines: string[] = [];
  lines.push(`利用者名: ${context.displayName}`);
  lines.push(`対象期間: ${context.weekStartDate} 〜 ${context.weekEndDate}`);
  lines.push(`体組成記録日数: ${context.daysWithBodyCompLog}/7日`);

  if (context.weightStartKg !== null && context.weightEndKg !== null) {
    lines.push(
      `週の体重推移: ${context.weightStartKg}kg → ${context.weightEndKg}kg` +
        (context.weightChangeKg !== null
          ? `(変化: ${context.weightChangeKg > 0 ? "+" : ""}${context.weightChangeKg}kg)`
          : ""),
    );
  }
  if (context.avgWeightKg !== null) {
    lines.push(`週の平均体重: ${context.avgWeightKg}kg`);
  }
  if (context.goal) {
    lines.push(
      `目標: 開始${context.goal.startWeightKg}kg → 目標${context.goal.targetWeightKg}kg` +
        (context.goal.targetDate ? `(目標日: ${context.goal.targetDate})` : ""),
    );
  } else {
    lines.push("目標: 未設定");
  }

  lines.push(`食事記録日数: ${context.daysWithMealLog}/7日(合計${context.totalMealsLogged}件)`);
  if (context.avgCaloriesKcal !== null) {
    lines.push(`食事記録日の平均カロリー: 約${context.avgCaloriesKcal}kcal/日`);
  }

  lines.push(
    `運動記録日数: ${context.daysWithExerciseLog}/7日(合計${context.totalExerciseMinutes}分)`,
  );

  if (context.remainingWeightKg !== null) {
    const abs = Math.abs(context.remainingWeightKg);
    lines.push(
      context.remainingWeightKg > 0
        ? `目標までの残り: 約${abs}kgの減量が必要`
        : `目標までの残り: 既に目標体重に到達済み(${abs}kg超過側)`,
    );
  }
  if (context.daysUntilTargetDate !== null) {
    lines.push(
      context.daysUntilTargetDate >= 0
        ? `目標日までの残り日数: ${context.daysUntilTargetDate}日`
        : `目標日: ${Math.abs(context.daysUntilTargetDate)}日超過`,
    );
  }

  return lines.join("\n");
}

export class ClaudeProvider implements AIProvider {
  private client: Anthropic;

  constructor() {
    // ANTHROPIC_API_KEYはサーバー専用環境変数から自動的に読み込まれる。
    // ブラウザに送信されることはない。
    this.client = new Anthropic();
  }

  async analyzeBodyCompositionImage(image: ImageInput): Promise<BodyCompositionDraft> {
    const response = await this.client.messages.parse({
      model: BODY_SCAN_MODEL,
      max_tokens: 4096,
      system: BODY_SCAN_SYSTEM_PROMPT,
      output_config: {
        format: zodOutputFormat(BodyCompositionDraftSchema),
        effort: "low",
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: image.mimeType,
                data: image.data.toString("base64"),
              },
            },
            {
              type: "text",
              text: "この体組成計アプリのスクリーンショットから数値を抽出してください。",
            },
          ],
        },
      ],
    });

    const parsed = response.parsed_output;
    if (!parsed) {
      throw new Error("画像の解析結果を読み取れませんでした");
    }

    return parsed;
  }

  async analyzeMealFromText(text: string): Promise<MealNutritionDraft> {
    const response = await this.client.messages.parse({
      model: MEAL_ANALYSIS_MODEL,
      max_tokens: 2048,
      system: MEAL_SYSTEM_PROMPT,
      output_config: {
        format: zodOutputFormat(MealNutritionDraftSchema),
        effort: "low",
      },
      messages: [
        {
          role: "user",
          content: `次の食事内容の栄養価を推定してください:\n${text}`,
        },
      ],
    });

    const parsed = response.parsed_output;
    if (!parsed) {
      throw new Error("栄養推定の結果を読み取れませんでした");
    }
    return parsed;
  }

  async analyzeMealFromImage(image: ImageInput): Promise<MealNutritionDraft> {
    const response = await this.client.messages.parse({
      model: MEAL_ANALYSIS_MODEL,
      max_tokens: 2048,
      system: MEAL_SYSTEM_PROMPT,
      output_config: {
        format: zodOutputFormat(MealNutritionDraftSchema),
        effort: "low",
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: image.mimeType,
                data: image.data.toString("base64"),
              },
            },
            {
              type: "text",
              text: "この食事の写真から、食べたものと栄養価を推定してください。",
            },
          ],
        },
      ],
    });

    const parsed = response.parsed_output;
    if (!parsed) {
      throw new Error("画像の解析結果を読み取れませんでした");
    }
    return parsed;
  }

  async generateDailyAdvice(context: DailyAdviceContext): Promise<DailyAdviceResult> {
    const response = await this.client.messages.parse({
      model: DAILY_ADVICE_MODEL,
      max_tokens: 2048,
      system: DAILY_ADVICE_SYSTEM_PROMPT,
      output_config: {
        format: zodOutputFormat(DailyAdviceSchema),
        effort: "medium",
      },
      messages: [
        {
          role: "user",
          content: `次のデータをもとに、今日のアドバイスを日本語で生成してください:\n\n${formatContextForPrompt(context)}`,
        },
      ],
    });

    const parsed: DailyAdvice | null = response.parsed_output;
    if (!parsed) {
      throw new Error("アドバイスの生成結果を読み取れませんでした");
    }

    return { advice: parsed, modelUsed: DAILY_ADVICE_MODEL };
  }

  async generateWeeklyReview(context: WeeklyReviewContext): Promise<WeeklyReviewResult> {
    const response = await this.client.messages.parse({
      model: WEEKLY_REVIEW_MODEL,
      max_tokens: 2048,
      system: WEEKLY_REVIEW_SYSTEM_PROMPT,
      output_config: {
        format: zodOutputFormat(WeeklyReviewSchema),
        effort: "medium",
      },
      messages: [
        {
          role: "user",
          content: `次のデータをもとに、この1週間のレビューを日本語で生成してください:\n\n${formatWeeklyContextForPrompt(context)}`,
        },
      ],
    });

    const parsed: WeeklyReview | null = response.parsed_output;
    if (!parsed) {
      throw new Error("週次レビューの生成結果を読み取れませんでした");
    }

    return { review: parsed, modelUsed: WEEKLY_REVIEW_MODEL };
  }
}
