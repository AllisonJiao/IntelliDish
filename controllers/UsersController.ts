import { NextFunction, Response, Request } from "express";
import mongoose, { ObjectId } from "mongoose";
import UserModel from "../models/UserModel";

export class UsersController {
    async getUsers(req: Request, res: Response, next: NextFunction) {
        try {
            const allUsers = await UserModel.find();  // Now safely querying
            res.status(200).json(allUsers);
        } catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({ error: "Failed to fetch users." });
        }
    }

    async getUserById(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.id;

            // Validate if userId is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: "Invalid user ID format." });
            }

            const user = await UserModel.findById(userId);

            if (!user) {
                return res.status(404).json({ error: `User with ID '${userId}' not found.` });
            }

            res.status(200).json(user);
        } catch (error) {
            console.error("Error fetching user by ID:", error);
            res.status(500).json({ error: "Failed to fetch user." });
        }
    }


    async getUserByEmail(req: Request, res: Response, next: NextFunction) {
        try {
            const userEmail = req.params.email;

            const userByEmail = await UserModel.findOne({ email: userEmail });

            if (!userByEmail) {
                return res.status(404).json({ error: `User with email '${userEmail}' not found.` });
            }

            res.status(200).send(userByEmail);
        } catch (error) {
            console.error("Error fetching user by email:", error);
            res.status(500).json({ error: "Failed to fetch user." });
        }
    }

    async createNewUser(req: Request, res: Response, next: NextFunction) {
        try {
            const newUser = new UserModel(req.body);
            await newUser.save();
            res.status(201).send(`Created user with id: ${newUser._id}`);
        } catch (error) {
            console.error("Error creating user:", error);
            res.status(500).json({ error: "Failed to create user." });
        }
    }

    async updateUserName(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.id;
            const newName = req.body.name;

            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: "Invalid user ID format." });
            }

            const updatedUser = await UserModel.findByIdAndUpdate(
                userId,
                { name: newName },
                { new: true, runValidators: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ error: "User not found or name unchanged." });
            }

            res.status(200).send("User name updated successfully.");
        } catch (error) {
            console.error("Error updating user name:", error);
            res.status(500).json({ error: "Failed to update user name." });
        }
    }

    async addNewFriend(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.id;
            const friendId = req.body._id;

            if (!friendId) {
                return res.status(400).json({ error: "Friend ID is required." });
            }

            if (String(friendId) === String(userId)) {
                return res.status(400).json({ error: "Cannot add yourself as a friend." });
            }

            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(friendId)) {
                return res.status(400).json({ error: "Invalid user ID format." });
            }

            const userObjectId = new mongoose.Types.ObjectId(userId);
            const friendObjectId = new mongoose.Types.ObjectId(friendId);

            const user = await UserModel.findById(userId);
            const friend = await UserModel.findById(friendId);

            if (!user || !friend) {
                return res.status(404).json({ error: "User or friend not found." });
            }

            // Check if the friend is already in the list
            if (user.friends && user.friends.includes(friendId)) {
                return res.status(400).json({ error: "Friend already added." });
            }

            // Add friend to the user's friends list
            const user_add = await UserModel.updateOne(
                {_id: userObjectId},
                {$push: {friends: friendObjectId}}
            )
            // Add user to the friend's freinds list
            const friend_add = await UserModel.updateOne(
                {_id: friendObjectId},
                {$push: {friends: userObjectId}}
            )

            res.status(200).send("Friend added successfully.");
        } catch (error) {
            console.error("Error adding friend:", error);
            res.status(500).json({ error: "Failed to add friend." });
        }
    }

    async deleteFriend (req: Request, res: Response, next: NextFunction) {
        const userId = req.params.id;
        const friendId = req.body._id;

        if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(friendId)) {
            return res.status(400).json({ message: "Invalid user ID format" });
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);
        const friendObjectId = new mongoose.Types.ObjectId(friendId);

        const user_delete = await UserModel.updateOne(
            { _id: userObjectId },
            { $pull: { friends: friendObjectId } }
        );
        const friend_delete = await UserModel.updateOne(
            { _id: friendObjectId },
            { $pull: { friends: userObjectId } }
        );

        if (user_delete.matchedCount === 0 || friend_delete.matchedCount === 0) {
            return res.status(404).send("User not found or not friends");
        }

        res.status(200).send("Delete friend successfully");
    }

    async deleteUserAccount(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.id;

            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: "Invalid user ID format." });
            }
            const deletedUser = await UserModel.findByIdAndDelete(userId);

            if (!deletedUser) {
                return res.status(404).json({ error: "User not found." });
            }

            res.status(200).send("User account deleted successfully.");
        } catch (error) {
            console.error("Error deleting user account:", error);
            res.status(500).json({ error: "Failed to delete user account." });
        }
    }

    // async addRecipeToUser(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         const userId = req.params.id;
    //         const { recipeId } = req.body;

    //         if (!recipeId) {
    //             return res.status(400).json({ error: "Recipe ID is required." });
    //         }

    //         // Check if the recipe exists
    //         const recipe = await client.db("IntelliDish").collection("Recipes").findOne({ _id: new ObjectId(recipeId) });

    //         if (!recipe) {
    //             return res.status(404).json({ error: "Recipe not found in the database." });
    //         }

    //         const updatedUser = await client.db("IntelliDish").collection("Users").updateOne(
    //             { _id: new ObjectId(userId) },
    //             { $addToSet: { savedRecipes: recipe } } // Store the entire recipe object
    //         );

    //         if (updatedUser.modifiedCount === 0) {
    //             return res.status(404).json({ error: "User not found or recipe already added." });
    //         }

    //         res.status(200).send("Recipe added to user successfully.");
    //     } catch (error) {
    //         console.error("Error adding recipe to user:", error);
    //         res.status(500).json({ error: "Failed to add recipe to user." });
    //     }
    // }


    // async deleteRecipeFromUser(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         const userId = req.params.id;
    //         const { recipeId } = req.body;

    //         if (!recipeId) {
    //             return res.status(400).json({ error: "Recipe ID is required." });
    //         }

    //         const userObjectId = new ObjectId(userId);
    //         const recipeObjectId = new ObjectId(recipeId);

    //         // Check if user exists
    //         const user = await client.db("IntelliDish").collection("Users").findOne({ _id: userObjectId });
    //         if (!user) {
    //             return res.status(404).json({ error: "User not found." });
    //         }

    //         // Remove the recipe from the user's savedRecipes array
    //         const updateResult = await client.db("IntelliDish").collection("Users").updateOne(
    //             { _id: userObjectId },
    //             { $pull: { savedRecipes: { _id: recipeObjectId } } } as any  // Pull the entire object matching _id
    //         );

    //         if (updateResult.modifiedCount === 0) {
    //             return res.status(404).json({ error: "Recipe not found in saved list." });
    //         }

    //         res.status(200).json({ message: "Recipe removed from user successfully." });
    //     } catch (error) {
    //         console.error("Error removing recipe from user:", error);
    //         res.status(500).json({ error: "Failed to remove recipe from user." });
    //     }
    // }



    // async addIngredientToUser(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         const userId = req.params.id;
    //         const { ingredientId } = req.body;

    //         if (!ingredientId) {
    //             return res.status(400).json({ error: "Ingredient ID is required." });
    //         }

    //         // Fetch full ingredient details from Ingredients DB
    //         const ingredient = await client.db("IntelliDish").collection("Ingredients").findOne({ _id: new ObjectId(ingredientId) });

    //         if (!ingredient) {
    //             return res.status(404).json({ error: "Ingredient not found in the database." });
    //         }

    //         const updatedUser = await client.db("IntelliDish").collection("Users").updateOne(
    //             { _id: new ObjectId(userId) },
    //             { $addToSet: { ingredients: ingredient } }
    //         );

    //         if (updatedUser.modifiedCount === 0) {
    //             return res.status(404).json({ error: "User not found or ingredient already added." });
    //         }

    //         res.status(200).send("Ingredient added to user successfully.");
    //     } catch (error) {
    //         console.error("Error adding ingredient to user:", error);
    //         res.status(500).json({ error: "Failed to add ingredient to user." });
    //     }
    // }


    // async deleteIngredientFromUser(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         const userId = req.params.id;
    //         const { ingredientId } = req.body;

    //         if (!ingredientId) {
    //             return res.status(400).json({ error: "Ingredient ID is required." });
    //         }

    //         const result = await client.db("IntelliDish").collection("Users").updateOne(
    //             { _id: new ObjectId(userId) },
    //             { $pull: { ingredients: { _id: new ObjectId(ingredientId) } } } as any
    //         );

    //         if (result.matchedCount === 0) {
    //             return res.status(404).json({ error: "User not found." });
    //         }

    //         if (result.modifiedCount === 0) {
    //             return res.status(404).json({ error: "Ingredient not in saved list." });
    //         }

    //         res.status(200).send("Ingredient removed from user successfully.");

    //     } catch (error) {
    //         console.error("Error removing ingredient from user:", error);
    //         res.status(500).json({ error: "Failed to remove ingredient from user." });
    //     }
    // }



    // Potluck related functions
    async getPotluckSessions() {

    }

    async getPotluckSessionsById() {

    }

    async getPotluckSessionByUserId() {

    }

    async createPotluckSession() {

    }

    async updatePotluckIngredients() {

    }

    async updatePotluckParticipants() {

    }

    async updatePotluckRecipesByAI() {

    }

    async endPotluckSession() {

    }
}