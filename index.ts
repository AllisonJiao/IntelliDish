import express, { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import { client } from "./services";
import { IngredientsRoutes } from "./routes/IngredientsRoutes";
import { RecipesRoutes } from "./routes/RecipesRoutes";
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

const Routes = [...IngredientsRoutes, ...RecipesRoutes];

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
   apiKey: process.env.REDACTED,
 });

 // TODO:
 // Integrate messages prompt with the recipe generation feature
//  const completion = openai.chat.completions.create({
//    model: "gpt-4o-mini",
//    store: true,
//    messages: [
//      {"role": "user", "content": "write a haiku about ai"},
//    ],
// });

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
}


client.connect().then(() => {
   console.log("MongoDB Client Connected");


   app.listen(3001, () => {
       console.log("Listening on port " + 3001);
      //  completion.then((result) => console.log(result.choices[0].message));
   });
}).catch(err => {
   console.error(err);
   client.close();
});
