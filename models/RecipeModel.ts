import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface IRecipe extends Document {
    name: string;
    ingredients: string[];
    procedure: string[];
    cuisineType: string;
    recipeComplexity: "Don't Care" | "Very Easy" | "Easy" | "Medium" | "Hard" | "Very Hard";
    preparationTime: number; // Time in minutes
    calories: number; // Total calories per serving
    price: number;
}

// Define the schema
const RecipeSchema = new Schema<IRecipe>({
    name: { type: String, required: true, trim: true },
    ingredients: { type: [String], required: true},// Reference to Ingredient model
    procedure: { type: [String], required: true }, // Steps for the recipe
    cuisineType: { type: String, required: false },
    recipeComplexity: { 
        type: String, 
        enum: ["Don't Care", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"], 
        required: false 
    },
    preparationTime: { type: Number, required: false, min: 0 }, // Time in minutes
    calories: { type: Number, required: false, min: 0 }, // Total calories per serving
    price: { type: Number, required: false, min: 0 } 
});

// Create the model
const RecipeModel = mongoose.model<IRecipe>("Recipe", RecipeSchema);

export default RecipeModel;
