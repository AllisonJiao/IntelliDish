import express, { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import connectDB from "./services";
import { IngredientsRoutes } from "./routes/IngredientsRoutes";
import { RecipesRoutes } from "./routes/RecipesRoutes";
import {UsersRoutes} from "./routes/UsersRoutes";
import morgan from "morgan";
import OpenAI from "openai";
import dotenv from "dotenv";
// For image recognition local testing
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();

app.use(express.json());
app.use(morgan('tiny'));

const Routes = [...IngredientsRoutes, ...RecipesRoutes, ...UsersRoutes];

Routes.forEach((route) => {
   (app as any)[route.method](
     route.route,
     route.validation,
     async (req: Request, res: Response, next: NextFunction) => {
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         /* If there are validation errors, send a response with the error messages */
         return res.status(400).send({ errors: errors.array() });
       }
        try {
         await route.action(
           req,
           res,
           next,
         );
       } catch (err) {
         console.log(err);
         return res.sendStatus(500); // Don't expose internal server workings
       }
     },
   );
});


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
            "cuisine type": "Cuisine",
            "preparation time": "Time in minutes",
            "recipe complexity": "Low | Moderate | High",
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
                  role: "system",
                  content: "You are an AI assistant that extracts ingredients from images and categorizes them into structured data. Always return a valid JSON response with ingredients, categories, and quantities."
              },
              {
                  role: "user",
                  content: [
                      { type: "text", text: "Identify the ingredients in this picture and return a structured response." },
                      {
                          type: "image_url",
                          image_url: {
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

connectDB().then(() => {
   app.listen(3001, () => {
       console.log("Listening on port " + 3001);
   });
}).catch(err => {
   console.error(err);
});
