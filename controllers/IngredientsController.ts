import { NextFunction, Response, Request } from "express";
import mongoose, { ObjectId } from "mongoose";
import IngredientModel from "../models/IngredientModel";
import { ingredientsRecognition } from "../index";

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
            quantity: ingredientData.quantity || 0,
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

    const existingIngredient = await ingredientsController.getIngredientByNameAI(ingredient.name);

    if (!existingIngredient) {
        console.log("Current ingredient does not exist, add new ingredient");
        return await addIngredient(ingredient);
    } else {
        console.log(`Ingredient '${ingredient.name}' already exists. Consider updating instead.`);
        return existingIngredient;
    }
}

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

    async getIngredientByNameAI (ingredientName: string) {
        try {
            return await IngredientModel.findOne({ name: { $regex: `^${ingredientName}$`, $options: "i" } });
        } catch (error) {
            console.error(`Error finding ingredient '${ingredientName}':`, error);
            return null;
        }
    }

    async getIngredientByName (req: Request, res: Response, nextFunction: NextFunction) {
        // Return an ingredient/ingredients by name 
        try {
            const name = req.params.name;
    
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
            const newIngredient = await addIngredient(ingredient);
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

    // async updateIngredientQuantity (req: Request, res: Response, nextFunction: NextFunction) {
    //     // Merge duplicated objects witn the same name

    //     // Step 1: Aggregate ingredients by name (case insensitive) and sum quantities
    //     const pipeline =
    //     [
    //         {
    //             $group: {
    //                 _id: { $toLower: "$name" },  // Case-insensitive grouping
    //                 totalQuantity: { $sum: "$quantity" },  // Sum up quantities
    //                 categories: { $addToSet: "$category" }, // Collect all unique categories
    //                 originalIds: { $push: "$_id" }  // Store original IDs for deletion
    //             }
    //         },
    //         {
    //             $project: {
    //                 name: "$_id",
    //                 totalQuantity: 1,
    //                 category: {
    //                     $cond: {
    //                         if: { $eq: [{ $size: "$categories" }, 1] }, // If only one unique category
    //                         then: { $arrayElemAt: ["$categories", 0] }, // Keep that category
    //                         else: "Mixed" // If multiple categories exist, set to "Mixed"
    //                     }
    //                 },
    //                 originalIds: 1
    //             }
    //         }
    //     ];

    //     const aggregatedIngredients = await client.db("IntelliDish").collection("Ingredients").aggregate(pipeline).toArray();

    //     if (aggregatedIngredients.length === 0) {
    //         return res.status(404).json({ error: "No ingredients found to merge." });
    //     }

    //     // Step 2: Remove old duplicate ingredients
    //     const allOldIds: ObjectId[] = aggregatedIngredients.flatMap(doc =>
    //         doc.originalIds.map((id: string | ObjectId) => new ObjectId(id))
    //     );


    //     await client.db("IntelliDish").collection("Ingredients").deleteMany({
    //         _id: { $in: allOldIds }
    //     });

    //     // Step 3: Insert merged records with a new MongoDB _id
    //     const mergedData = aggregatedIngredients.map(doc => ({
    //         _id: new ObjectId(),
    //         name: doc.name,  // Keep the merged lowercase name
    //         category: doc.category,  // Keep or resolve category
    //         quantity: doc.totalQuantity  // Store merged quantity
    //     }));

    //     await client.db("IntelliDish").collection("Ingredients").insertMany(mergedData);

    //     res.status(200).send("Ingredients merged successfully");
    // };

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