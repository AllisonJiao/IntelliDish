import express, {NextFunction, Request, Response} from "express";
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

async function ingredientsRecognition() {
  try {
      // Read the image file and convert it to base64
      const imagePath = path.resolve(__dirname, "./testImages/image1.png"); // Replace with your local image
      const imageBase64 = fs.readFileSync(imagePath).toString("base64");

      // Send request to OpenAI
      const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
              {
                  role: "user",
                  content: [
                      { type: "text", text: "Identify the ingredients in this picture." },
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

      console.log(response.choices[0].message);
  } catch (error) {
      console.error("Error:", error);
  }
};


client.connect().then(() => {
   console.log("MongoDB Client Connected");


   app.listen(3001, () => {
       console.log("Listening on port " + 3001);
      //  ingredientsRecognition();
      //  completion.then((result) => console.log(result.choices[0].message));
   });
}).catch(err => {
   console.error(err);
   client.close();
});
