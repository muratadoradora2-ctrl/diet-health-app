import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { AIProvider, BodyCompositionDraft, ImageInput } from "./provider";

// コスト・精度のバランスはPhase 4実装時に環境変数で切替可能にする(Phase 1合意事項)。
const BODY_SCAN_MODEL = process.env.AI_BODY_SCAN_MODEL || "claude-opus-5";

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

const SYSTEM_PROMPT = `あなたは体組成計アプリのスクリーンショットから数値を読み取るアシスタントです。
画面に実際に表示されている数値だけを正確に読み取ってください。
推測・計算による補完や、表示されていない項目の創作は禁止します。
画面に存在しない・読み取れない項目は必ずnullにしてください。
単位(kg, %, kcal など)は結果に含めず、数値のみを返してください。`;

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
      system: SYSTEM_PROMPT,
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
}
