import { NextFunction, Response, Request } from "express";
import { client } from "../services";
import { MongoClient, ObjectId } from "mongodb";
import { recipesGeneration } from "../index";

export class RecipesController {

   async getAllRecipes (req: Request, res: Response, nextFunction: NextFunction) {
       // Return ALL recipes
       const all_recipes = await client.db("IntelliDish").collection("Recipes").find().toArray();
       res.status(200).send(all_recipes);
   };


   async getRecipeById (req: Request, res: Response, nextFunction: NextFunction) {
       // Return an unique recipe by id
       const recipe_by_id = await client.db("IntelliDish").collection("Recipes").find({_id: new ObjectId(req.params.id)}).toArray();
       res.status(200).send(recipe_by_id);
   };

   async getIngredientsFromRecipeId (req: Request, res: Response, nextFunction: NextFunction) {
        // Return a list of ingredients (object) from the recipe by id
        const recipeId = req.params.id;
        const pipeline = 
        [
            {
              '$match': {
                    '_id': new ObjectId(recipeId)
              }
            },
            {
              '$lookup' : {
                  'from' : 'Ingredients',
                  'localField' : 'ingredients',
                  'foreignField' : 'name',
                  'as' : 'ingredientDetails'
              }
            }
        ];
        const recipeWithIngredients = await client.db("IntelliDish").collection("Recipes").aggregate(pipeline).toArray();

        if (recipeWithIngredients.length === 0) {
            return res.status(404).json({ error: "Recipe not found" });
        }

        return res.status(200).json(recipeWithIngredients[0].ingredientDetails);
   };


   async postNewRecipe (req: Request, res: Response, nextFunction: NextFunction) {
       // Create a new recipe
       const new_recipe = await client.db("IntelliDish").collection("Recipes").insertOne(req.body);
       res.status(200).send(`Created ingredient with id: ${new_recipe.insertedId}`);
   };

   async postNewRecipeFromAI (req: Request, res: Response, nextFunction: NextFunction) {
        // Create a new recipe by given ingredients using AI
        const obj = await recipesGeneration(req.body.ingredients);

        // Extract the recipe
        if (!obj) {
            return res.status(400).send("No recipes found.");
        }

        // Ensure obj is an array before inserting
        const recipesArray = Array.isArray(obj) ? obj : [obj];

        await client.db("IntelliDish").collection("Recipes").insertMany(recipesArray);

        res.status(200).send(`An AI-generated recipe is posted!`);
   };

   async putRecipeById (req: Request, res: Response, nextFunction: NextFunction) {
        // Update an recipe by id
        const updatedRecipe = await client.db("IntelliDish").collection("Recipes").replaceOne({_id: new ObjectId(req.params.id)}, req.body);


        if (! updatedRecipe.acknowledged || updatedRecipe.modifiedCount == 0) {
            res.status(400).send("Recipe with given Id does not exist");
        } else {
            res.status(200).send("Recipe updated");
        }
    };


    async deleteRecipeById (req: Request, res: Response, nextFunction: NextFunction) {
        // Delete an recipe by Id
        const deleteRecipe = await client.db("IntelliDish").collection("Recipes").deleteOne({_id: new ObjectId(req.params.id)});


        if (! deleteRecipe.acknowledged || deleteRecipe.deletedCount == 0) {
            res.status(400).send("Recipe with given Id does not exist");
        } else {
            res.status(200).send("Recipe deleted");
        }
    };
}

