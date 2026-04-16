import Anthropic from "@anthropic-ai/sdk";

export interface SuggestedCharacter {
  name: string;
  genre: string;
  archetype: string;
  gender: string;
  ethnicity: string;
  ageRange: string;
  build: string;
  hair: string;
  outfit: string;
  personality: string;
  backstory: string;
}

export interface BriefExpansion {
  name: string;
  client: string;
  productName: string;
  productDescription: string;
  targetAudience: string;
  contentType: string;
  aspectRatio: string;
  duration: string;
  moodKeywords: string;
  referenceNotes: string;
  suggestedCharacters: SuggestedCharacter[];
}

const SYSTEM_PROMPT = `You are a production brief analyst for METRIX AI Studio, an AI video production house in Riyadh specializing in Higgsfield AI productions for Saudi/GCC brands. Extract structured production data from client briefs.

Return ONLY valid JSON — no markdown, no explanation. Infer content type from context:
- product-ad: product hero shot, feature demo, launch ad
- character-brand: brand character, ambassador, human story
- viral-clip: reels, TikTok, short social
- cinematic-film: brand film, documentary-style, narrative 30-60s
- 3d-commercial: 3D product rotation, CGI environments

For characters: only include if the content type calls for human/character presence. For product-ads include 0-1, cinematic-film 1-2, character-brand 1-2. For 3d-commercial include 0.`;

const SCHEMA = `{
  "name": "short memorable production name",
  "client": "brand/client name",
  "productName": "product or brand name",
  "productDescription": "1-2 sentence description of the product/service and its key value",
  "targetAudience": "specific audience — age, interests, market (e.g. Saudi youth 18-25, urban professionals)",
  "contentType": "product-ad|character-brand|viral-clip|cinematic-film|3d-commercial",
  "aspectRatio": "16:9|9:16|21:9|1:1",
  "duration": "15s|30s|60s",
  "moodKeywords": "3-6 comma-separated mood/style keywords (e.g. raw, cinematic, warm, premium, energetic)",
  "referenceNotes": "specific requirements, reference brands/directors, platform targets from the brief",
  "suggestedCharacters": [
    {
      "name": "role name (e.g. The Athlete, The Engineer)",
      "genre": "Drama|Action|Comedy|Thriller|Romance|Adventure|Sci-Fi|Historical",
      "archetype": "Hero|Everyman|Creator|Rebel|Explorer|Caregiver|Sage|Ruler|Magician",
      "gender": "Male|Female|Non-binary",
      "ethnicity": "specific ethnicity relevant to target market",
      "ageRange": "e.g. 22-30",
      "build": "Athletic|Lean|Average|Strong|Slim",
      "hair": "hair description",
      "outfit": "outfit fitting the brand context and region",
      "personality": "2-3 personality traits (e.g. Determined, Warm, Authentic)",
      "backstory": "1 sentence character backstory"
    }
  ]
}`;

export async function expandBrief(brief: string): Promise<BriefExpansion> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fallbackParse(brief);

  try {
    const client = new Anthropic({ apiKey: key });
    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: `Brief: "${brief}"\n\nReturn JSON matching this schema:\n${SCHEMA}`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallbackParse(brief);

    const parsed = JSON.parse(jsonMatch[0]) as BriefExpansion;
    // Ensure suggestedCharacters is always an array
    if (!Array.isArray(parsed.suggestedCharacters)) parsed.suggestedCharacters = [];
    return parsed;
  } catch {
    return fallbackParse(brief);
  }
}

function fallbackParse(brief: string): BriefExpansion {
  const lower = brief.toLowerCase();

  let duration = "15s";
  if (lower.includes("60") || lower.includes("one min") || lower.includes("1 min")) duration = "60s";
  else if (lower.includes("30")) duration = "30s";

  let aspectRatio = "16:9";
  if (lower.includes("9:16") || lower.includes("vertical") || lower.includes("reel") || lower.includes("tiktok") || lower.includes("short")) aspectRatio = "9:16";
  else if (lower.includes("1:1") || lower.includes("square")) aspectRatio = "1:1";

  let contentType = "product-ad";
  if (lower.includes("character") || lower.includes("story") || lower.includes("ambassador")) contentType = "character-brand";
  else if (lower.includes("viral") || lower.includes("tiktok") || lower.includes("reel") || lower.includes("social")) contentType = "viral-clip";
  else if (lower.includes("brand film") || lower.includes("cinematic") || lower.includes("narrative")) contentType = "cinematic-film";
  else if (lower.includes("3d") || lower.includes("cgi") || lower.includes("commercial")) contentType = "3d-commercial";

  const words = brief.trim().split(/\s+/);
  const name = brief.substring(0, 60).replace(/[,\.]+$/, "").trim();
  const client = words[0] || "";

  return {
    name,
    client,
    productName: client,
    productDescription: brief,
    targetAudience: "",
    contentType,
    aspectRatio,
    duration,
    moodKeywords: "",
    referenceNotes: "",
    suggestedCharacters: [],
  };
}
