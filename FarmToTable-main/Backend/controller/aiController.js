// controller/aiController.js

const generateMockResponse = (prompt, ingredients) => {
    const lower = prompt.toLowerCase();
    
    // Check if it's a description generation request
    if (lower.includes("description") || lower.includes("sentence")) {
        const match = prompt.match(/'([^']+)'/) || prompt.match(/"([^"]+)"/);
        const itemName = match ? match[1] : "this fresh produce";
        return `Enjoy the premium quality of our hand-picked, local farm-fresh ${itemName}, delivered directly to your table with love!`;
    }

    // Default to recipe generation
    const ingredientList = (ingredients || "").split(',').map(i => i.trim()).filter(Boolean);
    const mainIngredient = ingredientList[0] || "Fresh Produce";
    
    return `### 👩‍🍳 Chef's Recommendation: Farmhouse Direct ${mainIngredient} Medley

This delicious, wholesome recipe is customized from your local farm purchases to bring out the freshest flavors.

#### 📝 Ingredients:
${ingredientList.length > 0 
    ? ingredientList.map(item => `- Fresh **${item}**`).join('\n') 
    : '- Local farm-fresh ingredients'}
- 1-2 tbsp Extra virgin olive oil (or local butter)
- A pinch of sea salt & freshly cracked black pepper
- A splash of fresh lemon juice or local apple cider vinegar

#### 🍳 Instructions:
1. **Prep**: Thoroughly wash and clean all your fresh farm ingredients.
2. **Chop**: Dice the ingredients into bite-sized pieces.
3. **Assemble**: Sauté cookable ingredients in olive oil for 5-8 minutes, or toss fresh raw greens in a bowl.
4. **Season**: Drizzle with extra virgin olive oil, a splash of lemon juice, sea salt, and black pepper.
5. **Serve**: Enjoy immediately as a clean, local farm-to-table dish!

*💡 Mock AI response generated successfully. Set your GEMINI_API_KEY in Backend/.env to unlock live Gemini responses.*`;
};

const recommendRecipe = async (req, res) => {
    const { ingredients, prompt } = req.body;

    const inputStr = prompt || ingredients;
    if (!inputStr || typeof inputStr !== "string" || inputStr.trim().length === 0) {
        return res.status(400).json({ message: "No prompt or ingredients provided for AI generation." });
    }

    // Detect if input is a direct prompt instruction or just a list of ingredients
    const isDirectPrompt = inputStr.includes(" ") && 
        (inputStr.toLowerCase().includes("write") || 
         inputStr.toLowerCase().includes("suggest") || 
         inputStr.toLowerCase().includes("description") || 
         inputStr.toLowerCase().includes("recipe"));

    let finalPrompt = "";
    if (isDirectPrompt) {
        finalPrompt = inputStr;
    } else {
        finalPrompt = `Suggest a simple, delicious recipe using one or more of these farm-fresh ingredients: ${inputStr}. Format using clean Markdown headers (###), bullet points, and steps:
### [Recipe Name]
*Wholesome description of the dish.*
#### 📝 Ingredients:
- [Item]
#### 🍳 Instructions:
1. [Step 1]`;
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Check if Gemini API key is configured
    if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY" || apiKey.trim() === "") {
        console.log("⚠️ GEMINI_API_KEY is not set. Falling back to Mock Generator.");
        const fallback = generateMockResponse(finalPrompt, isDirectPrompt ? "" : inputStr);
        return res.status(200).json({ recipe: fallback });
    }

    try {
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: finalPrompt }] }] };

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error("Gemini API error response:", errData);
            throw new Error("Gemini service returned a failure status.");
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error("Empty response content from Gemini.");
        }

        res.status(200).json({ recipe: text });
    } catch (error) {
        console.error("❌ Gemini API call failed, using mock fallback:", error.message);
        const fallback = generateMockResponse(finalPrompt, isDirectPrompt ? "" : inputStr);
        res.status(200).json({ recipe: fallback });
    }
};

module.exports = { recommendRecipe };
