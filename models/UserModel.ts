import mongoose, { Schema, Document, ObjectId } from "mongoose";

interface IUser extends Document {
    email: string;
    name: string;
    friends: ObjectId[];
}

const UserSchema = new Schema<IUser>({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] 
});

const UserModel = mongoose.model<IUser>("User", UserSchema);

export default UserModel;