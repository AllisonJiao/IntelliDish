import OpenAI from "openai";
// For image recognition local testing
import fs from 'fs';
import path from 'path';

import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

interface RecipeRequest {
ingredients: string[];
};

export async function recipesGeneration(jsonData: RecipeRequest) {
    try {
        const response = await openai.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" }, // Ensure structured output
        messages: [
            {
            role: "system",
            content: `
            You are an AI assistant that generates recipes from given ingredients.
            Return a **valid JSON object** where all fields **match this exact database format**:
            
            {
                "name": "Recipe Name",
                "ingredients": ["ingredient1", "ingredient2", "ingredient3"],
                "procedure": ["Step 1", "Step 2", "Step 3"],
                "cuisineType": "Cuisine",
                "recipeComplexity": "Don't Care" | "Very Easy" | "Easy" | "Medium" | "Hard" | "Very Hard",
                "preparationTime": "Time in minutes(numeric)",
                "calories": "Estimated calories(numeric)"
                "price": "Estimated price (numeric)"
            }

            Always return the response in **this exact structure**.
            `
            },
            {
            role: "user",
            content: [
                { 
                type: "text", 
                text: `Use the ingredients to generate a recipe and return a structured response:\n\n${JSON.stringify(jsonData)}`
                }
            ]
            }
        ]
        });

        // Log the structured response
        const json = response.choices[0].message.content;
        let obj;
        if (json) {
        obj = JSON.parse(json);
        console.log(obj);
        }

        return obj;
    } catch (error) {
        console.error("Error:", error);
    }
};

export async function ingredientsRecognition(imgDirname: string) {
    try {
        // Read the image file and convert it to base64
        const imagePath = path.resolve(__dirname, imgDirname);
        const imageBase64 = fs.readFileSync(imagePath).toString("base64");

        // Send request to OpenAI with JSON mode
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            response_format: { type: "json_object" }, // Ensure structured output
            messages: [
                {
                    "role": "system",
                    "content": `You are an AI assistant specializing in extracting ingredients from images and categorizing them into structured data. 
                                Your task is to analyze an image and return a valid JSON response containing a list of identified ingredients. 
                                Each ingredient should follow this structured format:
                                { 
                                    "name": "ingredient_name",  
                                    "category": "one_of_the_following_categories"
                                } 
                                The available categories are:
                                    - Vegetables
                                    - Fruit
                                    - Whole Grains
                                    - Meats
                                    - Eggs
                                    - Dairy
                                    - Condiments
                                    - Others
                                Always ensure that the JSON response is properly formatted and contains only relevant ingredients.`
                },
                {
                    "role": "user",
                    "content": [
                        { "type": "text", "text": "Identify the ingredients in this picture and return a structured response." },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": `data:image/jpeg;base64,${imageBase64}`
                            }
                        }
                    ]
                }
            ]        
        });

        // Log the structured response
        const json = response.choices[0].message.content;
        let obj;
        if (json !== null) {
            obj = JSON.parse(json);
            // console.log(obj);
        }

        return obj;
    } catch (error) {
        console.error("Error:", error);
    }
};