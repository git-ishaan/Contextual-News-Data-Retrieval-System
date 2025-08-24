import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../../config';
import { logger } from '../../logger';

// Interface for LLM provider methods
export interface ILLMProvider {
  analyzeQuery(query: string): Promise<any>;
  summarizeText(text: string): Promise<string>;
}

// Gemini LLM provider implementation
class GeminiProvider implements ILLMProvider {
  private genAI: GoogleGenerativeAI;

  // Initialize Gemini with API key
  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // Analyze user query for intent, entities, and keywords
  async analyzeQuery(query: string): Promise<any> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });
      
      // Prompt instructs Gemini to extract structured info from user query
      const prompt = `
        Analyze the user's query for a news app. Your task is to extract the user's intent and specific entities for a database search.
        
        1.  **Determine the Intent**: Choose the most fitting intent from this list: "nearby", "category", "source", "search". If multiple apply, return an array.
        2.  **Extract Entities**: Identify specific entities mentioned in the query. The possible entity keys are: "person", "organization", "location", "event", "category", "source_name".
        3.  **Extract Keywords**: Provide a clean array of the most important search terms, with misspellings corrected.

        Return ONLY a valid JSON object with the keys "intent", "entities", and "keywords".

        ---
        **Example 1:**
        User Query: "Latest developments in the Elon Musk Twitter acquisition near Palo Alto"
        Expected JSON Output:
        {
          "intent": ["nearby", "search"],
          "entities": {
            "person": "Elon Musk",
            "organization": "Twitter",
            "location": "Palo Alto"
          },
          "keywords": ["Elon Musk", "Twitter", "acquisition"]
        }
        ---
        **Example 2:**
        User Query: "Top technology news from the New York Times"
        Expected JSON Output:
        {
          "intent": ["category", "source"],
          "entities": {
            "category": "Technology",
            "source_name": "New York Times"
          },
          "keywords": ["Technology", "New York Times"]
        }
        ---

        Now, analyze the following query:
        User Query: "${query}"
      `;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      return JSON.parse(text);
    } catch (error) {
      logger.error(error, 'Error analyzing query with Gemini');
      throw new Error('Failed to analyze query');
    }
  }

  // Summarize a news article description in one sentence
  async summarizeText(text: string): Promise<string> {
     try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Summarize the following news article description in one concise sentence: "${text}"`;
      
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      logger.error(error, 'Error summarizing text with Gemini');
      return 'Summary not available.';
    }
  }
}

// Export singleton Gemini provider instance
export const llmProvider = new GeminiProvider(env.GEMINI_API_KEY);