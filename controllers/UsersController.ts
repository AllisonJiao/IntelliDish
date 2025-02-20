import { NextFunction, Response, Request } from "express";
import { client } from "../services";
import { MongoClient, ObjectId } from "mongodb";

export class UsersController {

    async getUsers (req: Request, res: Response, nextFunction: NextFunction) {
        // Return ALL users (admin only)
        const all_users = await client.db("IntelliDish").collection("Users").find().toArray();
       res.status(200).send(all_users);
    };

    async getUserByEmail (req: Request, res: Response, nextFunction: NextFunction) {
       // Return a user by email
       const userEmail = req.params.email;
       const user_by_email = await client.db("IntelliDish").collection("Users").find({email: { $regex: `^${userEmail}$`, $options: "i" }}).toArray();
       res.status(200).send(user_by_email);
    };

    async getUserById (req: Request, res: Response, nextFunction: NextFunction) {
        // Return a user by MongoId
        const user_by_id = await client.db("IntelliDish").collection("Users").find({_id: new ObjectId(req.params.id)}).toArray();
       res.status(200).send(user_by_id);
    };

    async createNewUser (req: Request, res: Response, nextFunction: NextFunction) {
        // Create a new user
       const new_user = await client.db("IntelliDish").collection("Users").insertOne(req.body);
       res.status(200).send(`Created user with id: ${new_user.insertedId}`);
    };

    async addNewFriend (req: Request, res: Response, nextFunction: NextFunction) {
        // Add a new friend
        const userId = new ObjectId(req.params.id); // Current user's id is in the request route
        const friendId = new ObjectId(req.body.id); // The new friend's id is in the request body

        if (String(userId) === String(friendId)) {
            return res.status(400).send("Cannot add yourself as a friend");
        }

        const userObjectId = new ObjectId(userId);
        const friendObjectId = new ObjectId(friendId);

        const result = await client.db("IntelliDish").collection("Users").updateOne({ _id: userId }, { $addToSet: { friends: friendId } });

        if (result.matchedCount === 0) {
            return res.status(404).send("User not found");
        }

        res.status(200).send("Friend added successfully");
    }

    async updateUserName (req: Request, res: Response, nextFunction: NextFunction) {
        // Update the user name
        const updatedName = await client.db("IntelliDish").collection("Users").updateOne({_id: new ObjectId(req.params.id)}, {$set: { name: req.body.name }});
        if (updatedName.matchedCount === 0) {
            return res.status(404).send("User not found");
        }

        res.status(200).send("Updated user name");
    }

    // async function updateUserSavedRecipes() {

    // }

    // async function updateUserIngredients() {

    // }

    // async function deleteUserAccount() {

    // }

    // // Potluck related functions
    // async function getPotluckSessions() {

    // }

    // async function getPotluckSessionsById() {

    // }

    // async function getPotluckSessionByUserId() {

    // }

    // async function createPotluckSession() {

    // }

    // async function updatePotluckIngredients() {

    // }

    // async function updatePotluckParticipants() {

    // }

    // async function updatePotluckRecipesByAI() {

    // }

    // async function endPotluckSession() {

    // }
}