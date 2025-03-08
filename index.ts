import express, { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import connectDB from "./services";
import { IngredientsRoutes } from "./routes/IngredientsRoutes";
import { RecipesRoutes } from "./routes/RecipesRoutes";
import { UsersRoutes } from "./routes/UsersRoutes";
import morgan from "morgan";
import dotenv from "dotenv";
import * as fs from 'fs';
import * as https from 'https';

dotenv.config();

const app = express();

// Enable CORS to allow frontend access
// app.use(cors());

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
  key: fs.readFileSync('./key_unencrypted.pem'),
  cert: fs.readFileSync('./cert.pem')
};

connectDB().then(() => {
  https.createServer(options, app).listen(process.env.PORT || 443, () => {
    console.log(`HTTPS Server running on port ${process.env.PORT || 443}`);
  });
}).catch(err => {
  console.error(err);
});

export default app;
