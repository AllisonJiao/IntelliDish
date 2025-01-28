import { NextFunction, Response, Request } from "express";
import { client } from "../services";
import { MongoClient, ObjectId } from "mongodb";

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

    async postNewIngredient (req: Request, res: Response, nextFunction: NextFunction) {
        // Create a new ingredient
        const new_ingredient = await client.db("IntelliDish").collection("Ingredients").insertOne(req.body);
        res.status(200).send(`Created ingredient with id: ${new_ingredient.insertedId}`);
    };

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