import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface IRecipe extends Document {
    name: string;
    ingredients: ObjectId[];
    procedure: string[];
    recipeComplexity: "Don't Care" | "Very Easy" | "Easy" | "Medium" | "Hard" | "Very Hard";
    preparationTime: number; // Time in minutes
    calories: number; // Total calories per serving
}

// Define the schema
const RecipeSchema = new Schema<IRecipe>({
    name: { type: String, required: true, trim: true },
    ingredients: [{ type: Schema.Types.ObjectId, ref: "Ingredient", required: true }], // Reference to Ingredient model
    procedure: { type: [String], required: true }, // Steps for the recipe
    recipeComplexity: { 
        type: String, 
        enum: ["Don't Care", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"], 
        required: true 
    },
    preparationTime: { type: Number, required: true, min: 0 }, // Time in minutes
    calories: { type: Number, required: true, min: 0 } // Total calories per serving
});

// Create the model
const RecipeModel = mongoose.model<IRecipe>("Recipe", RecipeSchema);

export default RecipeModel;
