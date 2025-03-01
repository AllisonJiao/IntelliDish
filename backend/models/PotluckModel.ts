import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface IPotluck extends Document {
    name: string;
    date: Date;
    host: ObjectId;
    participants: { user: ObjectId; ingredients: string[] }[];
    ingredients: string[];
    recipes: ObjectId[];
}

const PotluckSchema = new Schema<IPotluck>(
    {
        name: { type: String, required: true },
        date: { type: Date, required: true },
        host: { type: Schema.Types.ObjectId, ref: "User", required: true },
        participants: [
            {
                user: { type: Schema.Types.ObjectId, ref: "User", required: true },
                ingredients: [{ type: String, required: true }]
            }
        ],
        ingredients: [{ type: String, required: true }],
        recipes: [{ type: Schema.Types.ObjectId, ref: "Recipe" }],
    },
    { timestamps: true }
);

const PotluckModel = mongoose.model<IPotluck>("Potluck", PotluckSchema);

export default PotluckModel;
