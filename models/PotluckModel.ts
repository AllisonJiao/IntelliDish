import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface IPotluck extends Document {
    host: ObjectId; // Unique host for the potluck
    participants: ObjectId[]; // Array of user IDs participating
    ingredients: ObjectId[]; // Array of ingredient IDs
    recipes: ObjectId[]; // Array of recipe IDs
}

const PotluckSchema = new Schema<IPotluck>({
    host: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true }, // Ensure only one host
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }], // Array of user references
    ingredients: [{ type: Schema.Types.ObjectId, ref: "Ingredient", required: true }], // Ingredient references
    recipes: [{ type: Schema.Types.ObjectId, ref: "Recipe", required: true }], // Recipe references
}, { timestamps: true }); // Adds createdAt and updatedAt timestamps

const PotluckModel = mongoose.model<IPotluck>("Potluck", PotluckSchema);

export { PotluckModel, IPotluck };

