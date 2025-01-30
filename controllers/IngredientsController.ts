import { NextFunction, Response, Request } from "express";
import { client } from "../services";
import { MongoClient, ObjectId } from "mongodb";
import { ingredientsRecognition } from "../index";

export class IngredientsController {
    async getAllIngredients (req: Request, res: Response, nextFunction: NextFunction) {
        // Return ALL ingredients
        const all_ingredients = await client.db("IntelliDish").collection("Ingredients").find().toArray();
        res.status(200).send(all_ingredients);
    };

    async getIngredientById (req: Request, res: Response, nextFunction: NextFunction) {
        // Return an unique ingredient by id
        const ingredient_by_id = await client.db("IntelliDish").collection("Ingredients").find({_id: new ObjectId(req.params.id)}).toArray();
        res.status(200).send(ingredient_by_id);
    };

    async getIngredientByName (req: Request, res: Response, nextFunction: NextFunction) {
        // Return an ingredient/ingredients by name 
        const ingredientName = req.params.name;
        const ingredient_by_name = await client.db("IntelliDish").collection("Ingredients").find({name: { $regex: `^${ingredientName}$`, $options: "i" }}).toArray();
        if (ingredient_by_name.length === 0) {
            return res.status(404).json({ error: `Ingredient '${ingredientName}' not found` });
        } else {
            res.status(200).send(ingredient_by_name);
        }
    }

    async postNewIngredient (req: Request, res: Response, nextFunction: NextFunction) {
        // Create a new ingredient
        const new_ingredient = await client.db("IntelliDish").collection("Ingredients").insertOne(req.body);
        res.status(200).send(`Created ingredient with id: ${new_ingredient.insertedId}`);
    };

    async updateIngredientQuantity (req: Request, res: Response, nextFunction: NextFunction) {
        const db = client.db("IntelliDish");
        const ingredientsCollection = db.collection("Ingredients");

        // Step 1: Aggregate ingredients by name (case insensitive) and sum quantities
        const aggregatedIngredients = await ingredientsCollection.aggregate([
            {
                $group: {
                    _id: { $toLower: "$name" },  // Case-insensitive grouping
                    totalQuantity: { $sum: "$quantity" },  // Sum up quantities
                    categories: { $addToSet: "$category" }, // Collect all unique categories
                    originalIds: { $push: "$_id" }  // Store original IDs for deletion
                }
            },
            {
                $project: {
                    name: "$_id",
                    totalQuantity: 1,
                    category: {
                        $cond: {
                            if: { $eq: [{ $size: "$categories" }, 1] }, // If only one unique category
                            then: { $arrayElemAt: ["$categories", 0] }, // Keep that category
                            else: "Mixed" // If multiple categories exist, set to "Mixed"
                        }
                    },
                    originalIds: 1
                }
            }
        ]).toArray();

        if (aggregatedIngredients.length === 0) {
            return res.status(404).json({ error: "No ingredients found to merge." });
        }

        // Step 2: Remove old duplicate ingredients
        const allOldIds = aggregatedIngredients.flatMap(doc => doc.originalIds);
        await ingredientsCollection.deleteMany({ _id: { $in: allOldIds } });

        // Step 3: Insert merged records with a new MongoDB _id
        const mergedData = aggregatedIngredients.map(doc => ({
            _id: new ObjectId(),
            name: doc.name,  // Keep the merged lowercase name
            category: doc.category,  // Keep or resolve category
            quantity: doc.totalQuantity  // Store merged quantity
        }));

        await ingredientsCollection.insertMany(mergedData);

        res.status(200).send("Ingredients merged successfully");
    }

    async putIngredientById (req: Request, res: Response, nextFunction: NextFunction) {
        // Update an ingredient by id
        const updatedIngredient = await client.db("IntelliDish").collection("Ingredients").replaceOne({_id: new ObjectId(req.params.id)}, req.body);

        if (! updatedIngredient.acknowledged || updatedIngredient.modifiedCount == 0) {
            res.status(400).send("Ingredient with given Id does not exist");
        } else {
            res.status(200).send("Ingredient updated");
        }
    };

    async deleteIngredientById (req: Request, res: Response, nextFunction: NextFunction) {
        // Delete an ingredient by Id
        const deleteIngredient = await client.db("IntelliDish").collection("Ingredients").deleteOne({_id: new ObjectId(req.params.id)});

        if (! deleteIngredient.acknowledged || deleteIngredient.deletedCount == 0) {
            res.status(400).send("Ingredient with given Id does not exist");
        } else {
            res.status(200).send("Ingredient deleted");
        }
    };
}