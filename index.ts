import express, {NextFunction, Request, Response} from "express";
import { validationResult } from "express-validator";
import { client } from "./services";
import { IngredientsRoutes } from "./routes/IngredientsRoutes";
import { RecipesRoutes } from "./routes/RecipesRoutes";
import morgan from "morgan";
import OpenAI from "openai";
import dotenv from "dotenv";


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
 const completion = openai.chat.completions.create({
   model: "gpt-4o-mini",
   store: true,
   messages: [
     {"role": "user", "content": "write a haiku about ai"},
   ],
});


client.connect().then(() => {
   console.log("MongoDB Client Connected");


   app.listen(3001, () => {
       console.log("Listening on port " + 3001);
       completion.then((result) => console.log(result.choices[0].message));
   });
}).catch(err => {
   console.error(err);
   client.close();
});

