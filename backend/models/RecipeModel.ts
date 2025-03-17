import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface IRecipe extends Document {
    name: string;
    ingredients: string[];
    procedure: string[];
    cuisineType: "Any" | "African" | "American" | "Brazilian" | "British" | "Caribbean" | "Chinese" | "Ethiopian" | "Filipino" | "French" | "German" | "Greek" | "Hawaiian" | "Indian" | "Indonesian" | "Italian" | "Japanese" | "Korean" | "Lebanese" | "Malaysian" | "Mediterranean" | "Mexican" | "Middle Eastern" | "Moroccan" | "Peruvian" | "Polish" | "Russian" | "Spanish" | "Swedish" | "Thai" | "Turkish" | "Vietnamese";
    recipeComplexity: "Don't Care" | "Very Easy" | "Easy" | "Moderate" | "Challenging" | "Complex";
    spiceLevel: "Don't Care" | "No Spice" | "Mild Spice" | "Low Spice" | "Medium Spice" | "High Spice" | "Extreme Spice";
    preparationTime: number; // Time in minutes
    calories: number; // Total calories per serving
    nutritionLevel: "Don't Care" | "Very Low" | "Low" | "Medium" | "High" | "Very High";
    price: number;
}

// Define the schema
const RecipeSchema = new Schema<IRecipe>({
    name: { type: String, required: true, trim: true },
    ingredients: { type: [String], required: true},// Reference to Ingredient model
    procedure: { type: [String], required: true }, // Steps for the recipe
    cuisineType: { 
        type: String, 
        enum: ["Any" , "African" , "American" , "Brazilian" , "British" , "Caribbean" , "Chinese" , "Ethiopian" , "Filipino" , "French" , "German" , "Greek" , "Hawaiian" , "Indian" , "Indonesian" , "Italian" , "Japanese" , "Korean" , "Lebanese" , "Malaysian" , "Mediterranean" , "Mexican" , "Middle Eastern" , "Moroccan" , "Peruvian" , "Polish" , "Russian" , "Spanish" , "Swedish" , "Thai" , "Turkish" , "Vietnamese"], 
        required: false 
    },
    recipeComplexity: { 
        type: String, 
        enum: ["Don't Care", "Very Easy", "Easy", "Medium", "Hard", "Very Hard"], 
        required: false 
    },
    spiceLevel: { 
        type: String, 
        enum: ["Don't Care" , "No Spice" , "Mild Spice" , "Low Spice" , "Medium Spice" , "High Spice" , "Extreme Spice"], 
        required: false 
    },
    preparationTime: { type: Number, required: false, min: 0 }, // Time in minutes
    calories: { type: Number, required: false, min: 0 }, // Total calories per serving
    nutritionLevel: { 
        type: String, 
        enum: ["Don't Care" , "Very Low" , "Low" , "Medium" , "High" , "Very High"], 
        required: false 
    },
    price: { type: Number, required: false, min: 0 } 
});

RecipeSchema.pre("findOneAndDelete", async function (next) {
    const recipeId = this.getQuery()._id;

    await mongoose.model("User").updateMany(
        { recipes: recipeId },
        { $pull: { recipes: recipeId } }
    );

    next();
});

// Create the model
const RecipeModel = mongoose.model<IRecipe>("Recipe", RecipeSchema);

export default RecipeModel;
