/* src/api/gemini.js — UPDATED
Changes:

* Use env var import.meta.env.VITE_GEMINI_KEY (do NOT hardcode key in repo).
* Add defensive checks for empty prompt.
  */

const callGeminiAPI = async (prompt, setIsGenerating) => {
if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
return "No ingredients provided for recipe generation.";
}
if (setIsGenerating) setIsGenerating(true);
try {
const apiKey = import.meta.env.VITE_GEMINI_KEY;
if (!apiKey) {
console.error("Missing VITE_GEMINI_KEY. Please set it in .env");
return "Recipe generation is unavailable (server configuration).";
}
const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
const payload = { contents: [{ parts: [{ text: prompt }] }] };

```
const response = await fetch(apiUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

if (!response.ok) {
  const errorData = await response.json().catch(() => ({}));
  console.error("Gemini API error:", errorData);
  throw new Error("Gemini service returned an error.");
}

const result = await response.json();
const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
return text || "Sorry, I couldn't generate a response.";
```

} catch (error) {
console.error("Gemini API call failed:", error);
return "An error occurred while generating the content. Please try again later.";
} finally {
if (setIsGenerating) setIsGenerating(false);
}
};
export default callGeminiAPI;
