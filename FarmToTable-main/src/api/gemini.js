import api from './axios';

/**
 * Calls the secure backend AI endpoint to generate recipes using Gemini.
 * Bypasses direct browser calls to Google APIs to protect API keys.
 * 
 * @param {string} ingredients - Comma-separated list of ingredients
 * @param {function} setIsGenerating - Optional state setter for loading indicators
 * @returns {Promise<string>} Generated markdown recipe or error message
 */
const callGeminiAPI = async (ingredients, setIsGenerating) => {
    if (!ingredients || typeof ingredients !== "string" || ingredients.trim().length === 0) {
        return "No ingredients provided for recipe generation.";
    }
    
    if (setIsGenerating) setIsGenerating(true);
    
    try {
        const response = await api.post('/ai/recommend-recipe', { ingredients });
        return response.data.recipe || "Sorry, I couldn't generate a response.";
    } catch (error) {
        console.error("Backend AI call failed:", error);
        return error.response?.data?.message || "An error occurred while generating the recipe. Please try again later.";
    } finally {
        if (setIsGenerating) setIsGenerating(false);
    }
};

export default callGeminiAPI;
