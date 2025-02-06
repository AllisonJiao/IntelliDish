import { NextFunction, Response, Request } from "express";
import { client } from "../services";
import { MongoClient, ObjectId } from "mongodb";

export class UsersController {
    async function getUsers() {
        // Return ALL users (admin only)
        const all_users = await client.db("IntelliDish").collection("Users").find().toArray();
       res.status(200).send(all_users);
    }

    async function getUserByEmail() {
       // Return a user by email
       const userEmail = req.params.email;
       const user_by_email = await client.db("IntelliDish").collection("Users").find({email: { $regex: `^${userEmail}$`, $options: "i" }}).toArray();
       res.status(200).send(user_by_email);
    }

    async function createNewUser() {
        // Create a new user
       const new_user = await client.db("IntelliDish").collection("Users").insertOne(req.body);
       res.status(200).send(`Created user with id: ${new_user.insertedId}`);
    }

    async function updateUserName() {
        
    }

    async function updateUserFriends() {

    }

    async function updateUserSavedRecipes() {

    }

    async function updateUserIngredients() {

    }

    async function deleteUserAccount() {

    }

    // Potluck related functions
    async function getPotluckSessions() {

    }

    async function getPotluckSessionsById() {

    }

    async function getPotluckSessionByUserId() {

    }

    async function createPotluckSession() {

    }

    async function updatePotluckIngredients() {

    }

    async function updatePotluckParticipants() {

    }

    async function updatePotluckRecipesByAI() {

    }

    async function endPotluckSession() {

    }
}