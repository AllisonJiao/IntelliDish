import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface IPotluck extends Document {
    users: ObjectId[];      // Array of user IDs participating in the potluck
    ingredients: ObjectId[]; // Array of ingredient IDs brought to the potluck
    recipes: ObjectId[];     // Array of recipe IDs included in the potluck
}

const PotluckSchema = new Schema<IPotluck>({
    users: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    ingredients: [{ type: Schema.Types.ObjectId, ref: "Ingredient", required: true }],
    recipes: [{ type: Schema.Types.ObjectId, ref: "Recipe", required: true }],
});

const PotluckModel = mongoose.model<IPotluck>("Potluck", PotluckSchema);

export { PotluckModel, IPotluck };
