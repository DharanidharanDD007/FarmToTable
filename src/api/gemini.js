// --- GEMINI API CALL FUNCTION ---
const callGeminiAPI = async (prompt, setIsGenerating) => {
    setIsGenerating(true);
    const apiKey = "AIzaSyBLmUPtGGpyHmu36DDtIEUQLZnIwb4XgVY"; // This will be handled by the execution environment
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const payload = { contents: [{ parts: [{ text: prompt }] }] };
    try {
        const response = await fetch(apiUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!response.ok) throw new Error(`API error: ${response.statusText}`);
        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        return text || "Sorry, I couldn't generate a response.";
    } catch (error) {
        console.error("Gemini API call failed:", error);
        return "An error occurred while generating the content.";
    } finally {
        setIsGenerating(false);
    }
};
export default callGeminiAPI;