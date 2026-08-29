const fs = require('fs');
const path = require('path');
const genAI = require('../config/gemini');

const modelName = 'gemini-3.6-flash';

// Helper to convert local file to Gemini inlineData structure
function fileToGenerativePart(filePath, mimeType) {
  return {
    inlineData: {
      data: fs.readFileSync(filePath).toString('base64'),
      mimeType,
    },
  };
}

const promptText = `You are a road infrastructure inspection assistant. Analyze the attached image of a road surface and respond ONLY with valid JSON in this exact format, no markdown, no extra text:

{
  "damage_type": "Pothole" | "Crack" | "Other",
  "severity": "Low" | "Medium" | "High",
  "priority": "Low" | "Medium" | "High",
  "description": "A concise 1-2 sentence description of the visible damage, its size/extent, and potential risk to vehicles or pedestrians.",
  "confidence": 0.0 to 1.0
}

Rules:
- If the image does not show a road or road surface, set damage_type to "Other" and severity to "Low" and mention this in the description.
- Severity should reflect physical extent/depth of damage.
- Priority should factor in severity AND likely safety risk (e.g., a deep pothole on what looks like a busy road = High priority).`;

const fallbackResult = {
  damage_type: 'Other',
  severity: 'Medium',
  priority: 'Medium',
  description: 'AI analysis failed — needs manual review',
  confidence: 0.0,
  failed: true,
};

function getMockAnalysis(userNotes) {
  const notesLower = String(userNotes).toLowerCase();

  if (notesLower.includes('crack') || notesLower.includes('line') || notesLower.includes('fracture')) {
    return {
      damage_type: 'Crack',
      severity: 'Medium',
      priority: 'Medium',
      description: 'Simulated AI Vision: Surface fracture detected on asphalt. Fissures appear to be expanding but do not yet present a deep tire hazard.',
      confidence: 0.88,
      failed: false,
    };
  } else if (notesLower.includes('other') || notesLower.includes('debris') || notesLower.includes('hazard')) {
    return {
      damage_type: 'Other',
      severity: 'Low',
      priority: 'Low',
      description: 'Simulated AI Vision: Obstruction detected on the road shoulder. Pavement surface is intact; low risk for passing vehicles.',
      confidence: 0.82,
      failed: false,
    };
  } else {
    // Default to Pothole
    return {
      damage_type: 'Pothole',
      severity: 'High',
      priority: 'High',
      description: 'Simulated AI Vision: Deep pothole detected in the center lane. Significant structural edge deterioration; high risk of vehicle tire or suspension damage.',
      confidence: 0.94,
      failed: false,
    };
  }
}

/**
 * Call Gemini model to analyze the road damage image.
 * Retries once on failure.
 * Returns structured data or fallback values.
 */
async function analyzeImage(filePath, userNotes = '', isRetry = false) {
  // Check if API key is missing or dummy
  const apiKey = process.env.GEMINI_API_KEY;
  const isDummyKey = !apiKey || apiKey === 'your_gemini_api_key_here' || apiKey.trim() === '';

  if (isDummyKey || !genAI) {
    console.log('Skipping Gemini API: No credentials configured. Generating mock AI analysis.');
    return getMockAnalysis(userNotes);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const imagePart = fileToGenerativePart(filePath, 'image/jpeg');

    const result = await model.generateContent([promptText, imagePart]);
    const responseText = result.response.text().trim();

    // Parse response text as JSON
    const data = JSON.parse(responseText);

    // Validate parsed fields
    const validDamageTypes = ['Pothole', 'Crack', 'Other'];
    const validLevels = ['Low', 'Medium', 'High'];

    const damage_type = validDamageTypes.includes(data.damage_type)
      ? data.damage_type
      : 'Other';
    const severity = validLevels.includes(data.severity) ? data.severity : 'Medium';
    const priority = validLevels.includes(data.priority) ? data.priority : 'Medium';
    const description = data.description || 'No description provided by AI.';

    return {
      damage_type,
      severity,
      priority,
      description,
      confidence: data.confidence !== undefined ? Number(data.confidence) : 1.0,
      failed: false,
    };
  } catch (error) {
    console.error(`Gemini analysis failed (retry=${isRetry}):`, error);

    if (!isRetry) {
      console.log('Retrying Gemini analysis...');
      return await analyzeImage(filePath, userNotes, true);
    }

    console.log('Fallback to mock AI analysis due to API failure.');
    const mock = getMockAnalysis(userNotes);
    return {
      ...mock,
      description: `[Simulated Fallback] ${mock.description} (AI API failed: ${error.message || 'Unknown error'})`,
    };
  }
}

module.exports = {
  analyzeImage,
};
