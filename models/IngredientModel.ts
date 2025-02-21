import mongoose, { Schema, Document, ObjectId } from "mongoose";

export interface IIngredient extends Document {
    name: string;
    category: "Vegetables" | "Fruit" | "Whole Grains" | "Meats" | "Eggs" | "Dairy" | "Condiments" | "Others";
    quantity: number;
    unit: "g" | "kg" | "ml" | "l" | "tsp" | "tbsp" | "cup" | "pcs";
}

const IngredientSchema = new Schema<IIngredient>({
    name: { type: String, required: true, trim: true },
    category: { 
        type: String, 
        enum: ["Vegetables", "Fruit", "Whole Grains", "Meats", "Eggs", "Dairy", "Condiments", "Others"], 
        required: true 
    }, 
    quantity: { type: Number, required: false, min: 0 },
    unit: { 
        type: String, 
        enum: ["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "pcs"], 
        required: false 
    }
});

const IngredientModel = mongoose.model<IIngredient>("Ingredient", IngredientSchema);

export default IngredientModel;