import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface IPotluck extends Document {
    host: ObjectId; // Unique host for the potluck
    participants: ObjectId[]; // Array of user IDs participating
    ingredients: ObjectId[]; // Array of ingredient IDs
    recipes: ObjectId[]; // Array of recipe IDs
}

const PotluckSchema = new Schema<IPotluck>({
    host: { type: Schema.Types.ObjectId, ref: "User", required: true},
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    ingredients: [{ type: Schema.Types.ObjectId, ref: "Ingredient" }],
    recipes: [{ type: Schema.Types.ObjectId, ref: "Recipe" }],
});

const PotluckModel = mongoose.model<IPotluck>("Potluck", PotluckSchema);

export default PotluckModel;

