import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type {
  AIProvider,
  BodyCompositionDraft,
  ImageInput,
  MealNutritionDraft,
} from "./provider";

// コスト・精度のバランスはPhase 4実装時に環境変数で切替可能にする(Phase 1合意事項)。
const BODY_SCAN_MODEL = process.env.AI_BODY_SCAN_MODEL || "claude-opus-5";
const MEAL_ANALYSIS_MODEL = process.env.AI_MEAL_ANALYSIS_MODEL || "claude-opus-5";

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
}
