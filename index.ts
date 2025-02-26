import express, { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import connectDB from "./services";
import { IngredientsRoutes } from "./routes/IngredientsRoutes";
import { RecipesRoutes } from "./routes/RecipesRoutes";
import { UsersRoutes } from "./routes/UsersRoutes";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());
app.use(morgan('tiny'));

const Routes = [
  ...IngredientsRoutes, 
  ...RecipesRoutes, 
  ...UsersRoutes];

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

// Load self-signed certificate and private key
const options = {
  key: fs.readFileSync('/etc/ssl/private/server.key'), // Path to your private key
  cert: fs.readFileSync('/etc/ssl/certs/server.crt')   // Path to your certificate
};

connectDB().then(() => {
   app.listen(process.env.PORT, () => {
       console.log("Listening on port " + process.env.PORT);
   });
}).catch(err => {
   console.error(err);
});
