import { NextFunction, Response, Request } from "express";
import mongoose, { ObjectId } from "mongoose";
import RecipeModel from "../models/RecipeModel";
import { recipesGeneration } from "../index";

export class RecipesController {

   async getAllRecipes (req: Request, res: Response, nextFunction: NextFunction) {
       // Return ALL recipes
       try {
            const all_recipes = await RecipeModel.find();
            res.status(200).json(all_recipes);
        } catch (error) {
            console.error("Error fetching all recipes:", error);
            res.status(500).json({ error: "Failed to fetch recipes." });
        }
   };

   async getRecipeById(req: Request, res: Response, nextFunction: NextFunction) {
        try {
            const recipe = await RecipeModel.findById(req.params.id);

            if (!recipe) {
                return res.status(404).json({ error: "Recipe not found." });
            }

            res.status(200).json(recipe);
        } catch (error) {
            console.error("Error fetching recipe by ID:", error);
            res.status(500).json({ error: "Failed to fetch recipe." });
        }
    };

    async getRecipeByName(req: Request, res: Response, nextFunction: NextFunction) {
        try {
            console.log("Received query:", req.query); // Debugging log
            const name = req.query.name as string;
    
            if (!name || name.trim() === "") {
                return res.status(400).json({ error: "Recipe name is required." });
            }
    
            const recipe = await RecipeModel.find({
                name: { $regex: `^${name}$`, $options: "i" } // Case-insensitive search
            });
    
            if (recipe.length === 0) {
                return res.status(404).json({ error: `Recipe '${name}' not found.` });
            }
    
            return res.status(200).json(recipe);
        } catch (error) {
            console.error("Error fetching recipe by name:", error);
            res.status(500).json({ error: "Failed to fetch recipe." });
        }
    }
    

    async getIngredientsFromRecipeId(req: Request, res: Response, nextFunction: NextFunction) {
        try {
            const recipeId = req.params.id;
    
            const recipeWithIngredients = await RecipeModel.findById(recipeId)
                .populate("ingredients") // Populating ingredients as ObjectId references
                .exec();
    
            if (!recipeWithIngredients) {
                return res.status(404).json({ error: "Recipe not found" });
            }
    
            return res.status(200).json(recipeWithIngredients.ingredients);
        } catch (error) {
            console.error("Error fetching ingredients from recipe:", error);
            res.status(500).json({ error: "Failed to fetch ingredients." });
        }
    };    

    async postNewRecipe(req: Request, res: Response, next: NextFunction) {
        try {
            // Create a new recipe instance
            const newRecipe = new RecipeModel(req.body);

            // Save to the database
            const savedRecipe = await newRecipe.save();

            res.status(201).json({ message: "Recipe created successfully!", recipeId: savedRecipe._id });
        } catch (error) {
            console.error("Error creating recipe:", error);
            res.status(500).json({ error: "Failed to create recipe." });
        }
    }


//    async postNewRecipeFromAI (req: Request, res: Response, nextFunction: NextFunction) {
//         // Create a new recipe by given ingredients using AI
//         const obj = await recipesGeneration(req.body.ingredients);

//         // Extract the recipe
//         if (!obj) {
//             return res.status(400).send("No recipes found.");
//         }

//         // Ensure obj is an array before inserting
//         const recipesArray = Array.isArray(obj) ? obj : [obj];

//         await client.db("IntelliDish").collection("Recipes").insertMany(recipesArray);

//         res.status(200).send(`An AI-generated recipe is posted!`);
//    };

//    async putRecipeById (req: Request, res: Response, nextFunction: NextFunction) {
//         // Update an recipe by id
//         const updatedRecipe = await client.db("IntelliDish").collection("Recipes").replaceOne({_id: new ObjectId(req.params.id)}, req.body);


//         if (! updatedRecipe.acknowledged || updatedRecipe.modifiedCount == 0) {
//             res.status(400).send("Recipe with given Id does not exist");
//         } else {
//             res.status(200).send("Recipe updated");
//         }
//     };


    // async deleteRecipeById (req: Request, res: Response, nextFunction: NextFunction) {
    //     // Delete an recipe by Id
    //     const deleteRecipe = await client.db("IntelliDish").collection("Recipes").deleteOne({_id: new ObjectId(req.params.id)});


    //     if (! deleteRecipe.acknowledged || deleteRecipe.deletedCount == 0) {
    //         res.status(400).send("Recipe with given Id does not exist");
    //     } else {
    //         res.status(200).send("Recipe deleted");
    //     }
    // };
}

