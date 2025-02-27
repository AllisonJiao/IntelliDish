import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface IPotluck extends Document {
    name: string; // Name of the potluck event
    date: Date; // Date of the potluck
    host: ObjectId; // Unique host for the potluck
    participants: { user: ObjectId; ingredients: ObjectId[] }[]; // Users with their ingredients
    ingredients: ObjectId[]; // All ingredients contributed
    recipes: ObjectId[]; // Recipes generated/shared for the potluck
}

const PotluckSchema = new Schema<IPotluck>(
    {
        name: { type: String, required: true },
        date: { type: Date, required: true },
        host: { type: Schema.Types.ObjectId, ref: "User", required: true },
        participants: [
            {
                user: { type: Schema.Types.ObjectId, ref: "User", required: true },
                ingredients: [{ type: Schema.Types.ObjectId, ref: "Ingredient" }]
            }
        ],
        ingredients: [{ type: Schema.Types.ObjectId, ref: "Ingredient" }],
        recipes: [{ type: Schema.Types.ObjectId, ref: "Recipe" }],
    },
    { timestamps: true }
);

const PotluckModel = mongoose.model<IPotluck>("Potluck", PotluckSchema);

export default PotluckModel;
