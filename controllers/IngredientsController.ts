import { NextFunction, Response, Request } from "express";
import mongoose, { ObjectId } from "mongoose";
import { Document } from "mongoose";
import IngredientModel, {IIngredient} from "../models/IngredientModel";
import { ingredientsRecognition } from "../index";

// Helper functions for post new ingredients =>
// If the ingredient exists, update it
// If the ingredient does not exist, add it
export async function addIngredient(ingredientData: { 
    name: string; 
    category?: string; 
    quantity?: number; 
    unit?: string; 
}) {
    try {
        if (!ingredientData.name) {
            throw new Error("Ingredient name is required.");
        }

        const newIngredient = new IngredientModel({
            name: ingredientData.name.trim(),
            category: ingredientData.category || "Unknown",
            quantity: ingredientData.quantity ?? (ingredientData.unit ? 0 : -1),
            unit: ingredientData.unit ? ingredientData.unit.trim().toLowerCase() : undefined,
        });

        await newIngredient.save();
        return newIngredient;
    } catch (error) {
        console.error("Error adding ingredient:", error);
        throw new Error("Failed to add ingredient.");
    }
}

export async function parseIngredients(ingredient: { name: string, category?: string, quantity?: number, unit?:string }) {
    const ingredientsController = new IngredientsController();
    console.log("Parsing ingredient: ", ingredient);

    const query: any = {
        name: { $regex: `^${ingredient.name}$`, $options: "i" },
        unit: ingredient.unit ?? null, // Ensures we only compare within the same unit
    };
    
    const existingIngredient = await IngredientModel.findOne(query);

    if (!existingIngredient) {
        console.log("Current ingredient does not exist, or the unit is different, add new ingredient");
        return await addIngredient(ingredient);
    } else {
        console.log(`Ingredient '${ingredient.name}' already exists. Consider updating instead.`);
        return await updateIngredientQuantity(existingIngredient, ingredient);
    }
}

// Update ingredient quantities =>
// If the unit is the same, add quantity
// If the unit is different, 1: convert the unit, 2: keep different unit storage => merge when necessary
export const conversionTable: Record<string, Record<string, number>> = {
    "kg": { "g": 1000 },
    "g": { "kg": 1 / 1000 },
    "L": { "mL": 1000 },
    "mL": { "L": 1 / 1000 },
    "tbsp": { "mL": 15 },
    "tsp": { "mL": 5 },
};

export function convertUnit(quantity: number, fromUnit: string, toUnit: string): number | null {
    if (conversionTable[fromUnit] && conversionTable[fromUnit][toUnit]) {
        return quantity * conversionTable[fromUnit][toUnit];
    }
    return null; // Not convertible
}

export async function updateIngredientQuantity (
    existingIngredient: IIngredient & Document,
    incomingIngredient: { name: string, category?: string, quantity?: number, unit?:string }
) {
    try {   
        console.log("Existing ingredient: ", existingIngredient);
        console.log("Incoming ingredient: ", incomingIngredient);
        // Check if the previous and current save have unit
        existingIngredient.quantity = existingIngredient.quantity ?? (existingIngredient.unit ? 0 : -1);
        incomingIngredient.quantity = incomingIngredient.quantity ?? (incomingIngredient.unit ? 0 : -1);

        // If both of the previous or current save don't have a unit, ignore
        if (!existingIngredient.unit && !incomingIngredient.unit) {
            return existingIngredient;
        }
        // If any of the previous or current save doesn't have a unit, save separately
        if (!existingIngredient.unit || !incomingIngredient.unit) {
            const newIngredient = new IngredientModel(incomingIngredient);
            await newIngredient.save();
            return [existingIngredient, incomingIngredient]; // Store as separate entries
        }
        // If both of the previous or current save have a unit, calculate new quantity when the unit is the same
        if (existingIngredient.unit === incomingIngredient.unit) {
            existingIngredient.quantity += incomingIngredient.quantity;
            await IngredientModel.updateOne(
                { _id: existingIngredient._id }, 
                { $set: { quantity: existingIngredient.quantity } }
            );
            return existingIngredient;
        }
        // If the unit is not the same, try unit conversion
        const convertedQuantity = convertUnit(incomingIngredient.quantity, incomingIngredient.unit, existingIngredient.unit);
        if (convertedQuantity !== null) {
            existingIngredient.quantity += convertedQuantity;
            await IngredientModel.updateOne(
                { _id: existingIngredient._id }, 
                { $set: { quantity: existingIngredient.quantity } }
            );
            return existingIngredient;
        }
        
        // If unit conversion failed, keep separate saves for different units
        
        try {
            // Ensure _id is not passed to avoid Mongoose conflict
            const newIngredientData = { ...incomingIngredient, _id: undefined };
        
            const newIngredient = new IngredientModel(newIngredientData);
            await newIngredient.save();  // Now safely saving the new ingredient
        
            return [existingIngredient, newIngredient]; // Store separately
        } catch (error) {
            console.error("Error saving new ingredient:", error);
            throw new Error("Failed to save new ingredient.");
        }
    } catch {
        console.error("Error updating ingredient quantity:", Error);
        throw new Error("Failed to update ingredient quantity.");
    }
};

export class IngredientsController {
    async getAllIngredients(req: Request, res: Response, next: NextFunction) {
        try {
            const all_ingredients = await IngredientModel.find();
            res.status(200).json(all_ingredients);
        } catch (error) {
            console.error("Error fetching all ingredients:", error);
            res.status(500).json({ error: "Failed to fetch ingredients." });
        }
    }

    async getIngredientById (req: Request, res: Response, nextFunction: NextFunction) {
        // Return an unique ingredient by id
        try {
            const id = req.params.id;
    
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid ingredient ID format." });
            }
    
            const ingredient = await IngredientModel.findById(id);
    
            if (!ingredient) {
                return res.status(404).json({ error: `Ingredient with ID '${id}' not found.` });
            }
    
            res.status(200).json(ingredient);
        } catch (error) {
            console.error("Error fetching ingredient by ID:", error);
            res.status(500).json({ error: "Failed to fetch ingredient." });
        }
    };

    async getIngredientByName(req: Request, res: Response, nextFunction: NextFunction) {
        try {
            const name = req.query.name as string; // Fetching from query instead of params
    
            if (!name) {
                return res.status(400).json({ error: "Ingredient name is required." });
            }
    
            const ingredient = await IngredientModel.find({ 
                name: { $regex: `^${name}$`, $options: "i" }
            });
    
            if (ingredient.length === 0) {
                return res.status(404).json({ error: `Ingredient '${name}' not found.` });
            }
    
            res.status(200).json(ingredient);
        } catch (error) {
            console.error("Error fetching ingredient by name:", error);
            res.status(500).json({ error: "Failed to fetch ingredient." });
        }
    };    

    async postNewIngredient (req: Request, res: Response, nextFunction: NextFunction) {
        try {
            const ingredient = req.body;
            const newIngredient = await parseIngredients(ingredient);
            res.status(201).json(newIngredient);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
            res.status(500).json({ error: errorMessage });
        }        
    }

    async postIngredientsFromAI (req: Request, res: Response, nextFunction: NextFunction) {
        try {
            const obj = await ingredientsRecognition(req.body.imgPath);

            if (!obj || !obj.ingredients) {
                return res.status(400).send("No ingredients found.");
            }
            const ingredients = obj.ingredients;
            console.log(ingredients);

            for (const ingredient of ingredients) {
                await parseIngredients(ingredient);
            }

            res.status(200).send(`Updated ingredients from the image successfully.`);
        } catch (error) {
            console.error("Error in postIngredientsFromAI:", error);
            res.status(500).send("Internal Server Error");
        }
    }

    async putIngredientById(req: Request, res: Response, nextFunction: NextFunction) {
        try {
            const ingredientId = req.params._id;
            const updateData = req.body;
    
            if (!mongoose.Types.ObjectId.isValid(ingredientId)) {
                return res.status(400).json({ error: "Invalid ingredient ID format." });
            }
    
            const updatedIngredient = await IngredientModel.findByIdAndUpdate(
                ingredientId,
                updateData,
                { new: true, runValidators: true }
            );
    
            if (!updatedIngredient) {
                return res.status(404).json({ error: "Ingredient with the given ID does not exist." });
            }
    
            res.status(200).json({ message: "Ingredient updated successfully.", ingredient: updatedIngredient });
        } catch (error) {
            console.error("Error updating ingredient:", error);
            res.status(500).json({ error: "Failed to update ingredient." });
        }
    }   

    async deleteIngredientById(req: Request, res: Response, nextFunction: NextFunction) {
        try {
            const ingredientId = req.params.id;
    
            if (!mongoose.Types.ObjectId.isValid(ingredientId)) {
                return res.status(400).json({ error: "Invalid ingredient ID format." });
            }
 
            const deletedIngredient = await IngredientModel.findByIdAndDelete(ingredientId);
    
            if (!deletedIngredient) {
                return res.status(404).json({ error: "Ingredient with the given ID does not exist." });
            }
    
            res.status(200).json({ message: "Ingredient deleted successfully.", ingredient: deletedIngredient });
        } catch (error) {
            console.error("Error deleting ingredient:", error);
            res.status(500).json({ error: "Failed to delete ingredient." });
        }
    }

}