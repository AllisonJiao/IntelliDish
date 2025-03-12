import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface IUser extends Document {
    email: string;
    name: string;
    friends: ObjectId[];
    recipes: ObjectId[];
    ingredients: ObjectId[];
    potluck?: ObjectId[];
}

const UserSchema = new Schema<IUser>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
    recipes: [{ type: Schema.Types.ObjectId, ref: "Recipe" }],
    ingredients: [{ type: Schema.Types.ObjectId, ref: "Ingredient" }],
    potluck: [{ type: Schema.Types.ObjectId, ref: "Potluck"}]
});

// Middleware to remove user from friends lists when deleted
UserSchema.pre("findOneAndDelete", async function (next) {
    const deletedUser = await this.model.findOne(this.getQuery());
  
    if (deletedUser) {
      await mongoose.model("User").updateMany(
        { friends: deletedUser._id },
        { $pull: { friends: deletedUser._id } }
      );
    }
    next();
});

const UserModel = mongoose.model<IUser>("User", UserSchema);

export default UserModel;