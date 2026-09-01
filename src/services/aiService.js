import { GoogleGenerativeAI } from '@google/generative-ai';

const AI_KEY_STORAGE_KEY = 'gemini_api_key';

export const getApiKey = () => {
  return localStorage.getItem(AI_KEY_STORAGE_KEY);
};

export const setApiKey = (key) => {
  if (key) {
    localStorage.setItem(AI_KEY_STORAGE_KEY, key);
  } else {
    localStorage.removeItem(AI_KEY_STORAGE_KEY);
  }
};

export const hasApiKey = () => {
  return !!getApiKey();
};

const getGenAI = () => {
  const key = getApiKey();
  if (!key) {
    throw new Error('No Gemini API Key found. Please configure it in settings.');
  }
  return new GoogleGenerativeAI(key);
};

/**
 * Analyzes a receipt image and extracts amount, description, and category.
 * @param {string} base64Image - The base64 representation of the image data (without data:image/... prefix).
 * @param {string} mimeType - The mime type of the image (e.g., 'image/jpeg').
 * @returns {Promise<{amount: number, description: string, category: string}>}
 */
export const analyzeReceipt = async (base64Image, mimeType) => {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
    Analyze this receipt image. Extract the following information and return it strictly as a JSON object:
    1. amount: The total amount paid (number only, no currency symbols).
    2. description: A short, concise description of what was purchased (e.g., "Grocery shopping at Walmart", "Coffee at Starbucks").
    3. category: Choose the most appropriate category from this list: Food, Transport, Utilities, Shopping, Entertainment, Health. If none fit perfectly, choose "Other".
    
    Output only the raw JSON. Do not include markdown formatting like \`\`\`json.
    Example output format:
    {"amount": 150.50, "description": "Grocery shopping", "category": "Food"}
  `;

  const imageParts = [
    {
      inlineData: {
        data: base64Image,
        mimeType
      }
    }
  ];

  try {
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text().trim();
    
    // Clean up potential markdown from the model's response just in case
    let cleanedText = text;
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.substring(7);
    }
    if (cleanedText.endsWith('```')) {
      cleanedText = cleanedText.substring(0, cleanedText.length - 3);
    }

    return JSON.parse(cleanedText.trim());
  } catch (error) {
    console.error('Error analyzing receipt:', error);
    throw new Error('Failed to analyze receipt. Please make sure the image is clear and try again.');
  }
};

/**
 * Acts as a virtual CA to review monthly expenses and provide advice.
 * @param {Array} expenses - List of expense objects.
 * @param {Array} savings - List of savings objects.
 * @param {number} totalExpense - Total expenses.
 * @param {number} totalSavings - Total savings.
 * @returns {Promise<string>} - Markdown string containing the CA's advice.
 */
export const getFinancialAdvice = async (expenses, savings, totalExpense, totalSavings) => {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Group expenses by category for the AI
  const expensesByCategory = expenses.reduce((acc, exp) => {
    acc[exp.section] = (acc[exp.section] || 0) + Number(exp.amount);
    return acc;
  }, {});

  const dataSummary = `
    Total Expenses this month: Rs. ${totalExpense}
    Total Savings this month: Rs. ${totalSavings}
    
    Expenses Breakdown:
    ${Object.entries(expensesByCategory).map(([category, amount]) => `- ${category}: Rs. ${amount}`).join('\n')}
  `;

  const prompt = `
    You are a strict but highly competent and helpful Chartered Accountant (CA) and Financial Advisor for a family.
    Review the following monthly financial summary for the family.
    
    Data Summary:
    ${dataSummary}
    
    Your task:
    1. Briefly analyze the spending patterns.
    2. Highlight any areas where they are overspending.
    3. Commend them if they have good savings (typically > 20% of expenses).
    4. Provide 2-3 actionable, concrete tips on how they can optimize their budget or save more money next month.
    
    Tone: Professional, slightly strict (like a classic CA), but encouraging.
    Format your response in Markdown using headings, bullet points, and bold text for readability. Do not use generic greetings, jump straight into the analysis.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating advice:', error);
    throw new Error('Failed to generate financial advice.');
  }
};
