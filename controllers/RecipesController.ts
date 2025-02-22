import { NextFunction, Response, Request } from "express";
import mongoose, { ObjectId } from "mongoose";
import RecipeModel from "../models/RecipeModel";
import IngredientModel from "../models/IngredientModel";
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
    
            // Find the recipe by its ID
            const recipe = await RecipeModel.findById(recipeId);
    
            if (!recipe) {
                return res.status(404).json({ error: "Recipe not found" });
            }

            const ingredientNameRegexArray = recipe.ingredients.map(name => new RegExp(`^${name}$`, "i"));
    
            // Fetch ingredients by their names
            const ingredients = await IngredientModel.find({
                name: { $in: ingredientNameRegexArray }, // Assuming ingredients in the recipe are stored as names
            });

            console.log(ingredients);
    
            if (!ingredients.length) {
                return res.status(404).json({ error: "No ingredients found for this recipe OR You don't own any ingredients." });
            }
    
            return res.status(200).json(ingredients);
        } catch (error) {
            console.error("Error fetching ingredients by recipe ID:", error);
            res.status(500).json({ error: "Failed to fetch ingredients." });
        }
    }    

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


   async postNewRecipeFromAI (req: Request, res: Response, nextFunction: NextFunction) {
        // Create a new recipe by given ingredients using AI
        const obj = await recipesGeneration(req.body.ingredients);

        // Extract the recipe
        if (!obj) {
            return res.status(400).send("No recipes found.");
        }

        // Ensure obj is an array before inserting
        const recipesArray = Array.isArray(obj) ? obj : [obj];

        await RecipeModel.insertMany(recipesArray);

        res.status(200).send(`An AI-generated recipe is posted!`);
   };

   async putRecipeById (req: Request, res: Response, nextFunction: NextFunction) {
        // Update an recipe by id
        try {
            const recipeId = req.params._id;
            const updateData = req.body;
    
            if (!mongoose.Types.ObjectId.isValid(recipeId)) {
                return res.status(400).json({ error: "Invalid recipe ID format." });
            }
    
            const updatedRecipe = await RecipeModel.findByIdAndUpdate(
                recipeId,
                updateData,
                { new: true, runValidators: true }
            );
    
            if (!updatedRecipe) {
                return res.status(404).json({ error: "Recipe with the given ID does not exist." });
            }
    
            res.status(200).json({ message: "Recipe updated successfully.", recipe: updatedRecipe });
        } catch (error) {
            console.error("Error updating recipe:", error);
            res.status(500).json({ error: "Failed to update recipe." });
        }
    };

    async deleteRecipeById (req: Request, res: Response, nextFunction: NextFunction) {
        // Delete an recipe by Id
        try {
            const recipeId = req.params._id;
    
            if (!mongoose.Types.ObjectId.isValid(recipeId)) {
                return res.status(400).json({ error: "Invalid recipe ID format." });
            }
 
            const deletedRecipe = await RecipeModel.findByIdAndDelete(recipeId);
    
            if (!deletedRecipe) {
                return res.status(404).json({ error: "Recipe with the given ID does not exist." });
            }
    
            res.status(200).json({ message: "Recipe deleted successfully.", recipe: deletedRecipe });
        } catch (error) {
            console.error("Error deleting recipe:", error);
            res.status(500).json({ error: "Failed to delete recipe." });
        }
    };
}

