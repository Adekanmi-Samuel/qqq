const AI_TIMEOUT_MS = 60_000;
const MAX_RETRIES = 1;
const RETRY_DELAY_MS = 2000;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function callAI(prompt: string): Promise<string | null> {
  const COHERE_API_KEY = process.env.COHERE_API_KEY;
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Step 1: Try Cohere
    if (COHERE_API_KEY) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
        const cohereRes = await fetch("https://api.cohere.com/v2/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${COHERE_API_KEY}`,
          },
          body: JSON.stringify({
            model: "command-a-03-2025",
            messages: [
              { role: "system", content: "You are an expert Nigerian educational AI assistant. Always respond with valid JSON only. No markdown fences. No extra text outside the JSON." },
              { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
            max_tokens: 8192,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (cohereRes.ok) {
          const data: any = await cohereRes.json();
          const text = data?.message?.content?.[0]?.text;
          if (text) return text;
        } else if (cohereRes.status === 429 || cohereRes.status >= 500) {
          // Transient — retry
          if (attempt < MAX_RETRIES) { await sleep(RETRY_DELAY_MS); continue; }
        }
      } catch (e: any) {
        if (e.name === "AbortError") {
          console.warn("[AI] Cohere timed out");
        } else {
          console.warn("[AI] Cohere exception:", e.message);
        }
        if (attempt < MAX_RETRIES) { await sleep(RETRY_DELAY_MS); continue; }
      }
    }

    // Step 2: Try Gemini
    if (GEMINI_API_KEY) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);
        if (geminiRes.ok) {
          const data: any = await geminiRes.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text;
        } else if (geminiRes.status === 429 || geminiRes.status >= 500) {
          if (attempt < MAX_RETRIES) { await sleep(RETRY_DELAY_MS); continue; }
        }
      } catch (e: any) {
        if (e.name === "AbortError") {
          console.warn("[AI] Gemini timed out");
        } else {
          console.error("[AI] Gemini error:", e.message);
        }
        if (attempt < MAX_RETRIES) { await sleep(RETRY_DELAY_MS); continue; }
      }
    }

    // Both providers failed on this attempt
    break;
  }

  return null;
}