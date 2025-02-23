import { NextFunction, Response, Request } from "express";
import mongoose, { ObjectId } from "mongoose";
import { recipesGeneration } from "../aiHelper";
import UserModel from "../models/UserModel";
import RecipeModel from "../models/RecipeModel";
import IngredientModel from "../models/IngredientModel";
import PotluckModel from "../models/PotluckModel";

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

    async addRecipeToUser(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.id;
            const recipeId = req.body._id;
    
            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(recipeId)) {
                return res.status(400).json({ error: "Invalid user ID or recipe ID format." });
            }
    
            if (!recipeId) {
                return res.status(400).json({ error: "Recipe ID is required." });
            }
    
            // Check if the recipe exists
            const recipe = await RecipeModel.findById(recipeId);
            if (!recipe) {
                return res.status(404).json({ error: "Recipe not found in the database." });
            }
    
            // Add recipe reference to user's savedRecipes
            const updatedUser = await UserModel.findByIdAndUpdate(
                userId,
                { $addToSet: { recipes: recipe._id } }, // Store only the recipe ID
                { new: true }
            );
    
            if (!updatedUser) {
                return res.status(404).json({ error: "User not found or recipe already added." });
            }
    
            res.status(200).json({ message: "Recipe added to user successfully.", user: updatedUser });
        } catch (error) {
            console.error("Error adding recipe to user:", error);
            res.status(500).json({ error: "Failed to add recipe to user." });
        }
    }

    async deleteRecipeFromUser(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.id;
            const recipeId = req.body._id;
    
            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(recipeId)) {
                return res.status(400).json({ error: "Invalid user ID or recipe ID format." });
            }
    
            if (!recipeId) {
                return res.status(400).json({ error: "Recipe ID is required." });
            }
    
            // Check if user exists
            const user = await UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({ error: "User not found." });
            }
    
            // Remove the recipe from the user's savedRecipes array
            const updatedUser = await UserModel.findByIdAndUpdate(
                userId,
                { $pull: { recipes: recipeId } }, // Remove only the recipe ID reference
                { new: true }
            );
    
            if (!updatedUser) {
                return res.status(404).json({ error: "Recipe not found in saved list." });
            }
    
            res.status(200).json({ message: "Recipe removed from user successfully.", user: updatedUser });
        } catch (error) {
            console.error("Error removing recipe from user:", error);
            res.status(500).json({ error: "Failed to remove recipe from user." });
        }
    }

    async addIngredientToUser(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.id;
            const ingredientId = req.body._id;
    
            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(ingredientId)) {
                return res.status(400).json({ error: "Invalid user ID or ingredient ID format." });
            }
    
            if (!ingredientId) {
                return res.status(400).json({ error: "Ingredient ID is required." });
            }
    
            // Fetch ingredient from the database
            const ingredient = await IngredientModel.findById(ingredientId);
            if (!ingredient) {
                return res.status(404).json({ error: "Ingredient not found in the database." });
            }
    
            // Add the ingredient ID to the user's ingredients list (prevents duplicates)
            const updatedUser = await UserModel.findByIdAndUpdate(
                userId,
                { $addToSet: { ingredients: ingredient._id } }, // Store only the ingredient ID
                { new: true }
            );
    
            if (!updatedUser) {
                return res.status(404).json({ error: "User not found or ingredient already added." });
            }
    
            res.status(200).json({ message: "Ingredient added to user successfully.", user: updatedUser });
        } catch (error) {
            console.error("Error adding ingredient to user:", error);
            res.status(500).json({ error: "Failed to add ingredient to user." });
        }
    }

    async deleteIngredientFromUser(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.id;
            const ingredientId = req.body._id;
    
            // Validate ObjectId format
            if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(ingredientId)) {
                return res.status(400).json({ error: "Invalid user ID or ingredient ID format." });
            }
    
            if (!ingredientId) {
                return res.status(400).json({ error: "Ingredient ID is required." });
            }
    
            // Remove the ingredient from the user's ingredients list
            const updatedUser = await UserModel.findByIdAndUpdate(
                userId,
                { $pull: { ingredients: ingredientId } }, // Remove ingredient ID from array
                { new: true }
            );
    
            if (!updatedUser) {
                return res.status(404).json({ error: "User not found." });
            }
    
            res.status(200).json({ message: "Ingredient removed from user successfully.", user: updatedUser });
        } catch (error) {
            console.error("Error removing ingredient from user:", error);
            res.status(500).json({ error: "Failed to remove ingredient from user." });
        }
    }

    // Potluck related functions
    async getPotluckSessions(req: Request, res: Response, next: NextFunction) {
        try {
            // Retrieve all potluck sessions
            const potlucks = await PotluckModel.find()
                .populate("host", "name email") // Populate host info
                .populate("participants", "name email") // Populate participant info
                .populate("ingredients", "name") // Populate ingredient names
                .populate("recipes", "name"); // Populate recipe names
    
            res.status(200).json({ potlucks });
        } catch (error) {
            console.error("Error retrieving potluck sessions:", error);
            res.status(500).json({ error: "Failed to retrieve potluck sessions." });
        }
    }    

    async getPotluckSessionsById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params; // Get potluck ID from request params
    
            // Validate if ID is a valid MongoDB ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid Potluck ID format." });
            }
    
            // Find the potluck session by ID
            const potluck = await PotluckModel.findById(id)
                .populate("host", "name email") // Populate host info
                .populate("participants", "name email") // Populate participant info
                .populate("ingredients", "name") // Populate ingredient names
                .populate("recipes", "name"); // Populate recipe names
    
            // If the potluck session is not found
            if (!potluck) {
                return res.status(404).json({ error: "Potluck session not found." });
            }
    
            res.status(200).json({ potluck });
        } catch (error) {
            console.error("Error retrieving potluck session:", error);
            res.status(500).json({ error: "Failed to retrieve potluck session." });
        }
    }

    async getPotluckSessionsByHostId(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params; // Get user ID from request params
    
            // Validate if userId is a valid MongoDB ObjectId
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid User ID format." });
            }
    
            // Find all potluck sessions hosted by this user
            const potlucks = await PotluckModel.find({ host: id })
                .populate("host", "name email") // Populate host info
                .populate("participants", "name email") // Populate participant info
                .populate("ingredients", "name") // Populate ingredient names
                .populate("recipes", "name"); // Populate recipe names
    
            // If no potluck sessions are found
            if (!potlucks.length) {
                return res.status(404).json({ error: "No potluck sessions found for this user." });
            }
    
            res.status(200).json({ potlucks });
        } catch (error) {
            console.error("Error retrieving potluck sessions by host ID:", error);
            res.status(500).json({ error: "Failed to retrieve potluck sessions." });
        }
    }
    
    async getPotluckSessionsByParticipantId(req: Request, res: Response, next: NextFunction) {
        try {
            const participantId = req.params.id; // Get participant ID from request params
    
            // Validate if participantId is a valid MongoDB ObjectId
            if (!mongoose.Types.ObjectId.isValid(participantId)) {
                return res.status(400).json({ error: "Invalid Participant ID format." });
            }
    
            // Find all potluck sessions where this user is a participant
            const potlucks = await PotluckModel.find({ participants: participantId })
                .populate("host", "name email") // Populate host info
                .populate("participants", "name email") // Populate participant info
                .populate("ingredients", "name") // Populate ingredient names
                .populate("recipes", "name"); // Populate recipe names
    
            // If no potluck sessions are found
            if (!potlucks.length) {
                return res.status(404).json({ error: "No potluck sessions found for this participant." });
            }
    
            res.status(200).json({ potlucks });
        } catch (error) {
            console.error("Error retrieving potluck sessions by participant ID:", error);
            res.status(500).json({ error: "Failed to retrieve potluck sessions." });
        }
    }    

    async createPotluckSession(req: Request, res: Response, next: NextFunction) {
        try {
            const { host, participants, ingredients, recipes } = req.body;
    
            // Validate required fields
            if (!host) {
                return res.status(400).json({ error: "Host is required for a potluck session." });
            }
    
            // Check if the user exists
            const user = await UserModel.findById(host);
            if (!user) {
                return res.status(404).json({ error: "Host user not found." });
            }
    
            // Create the new Potluck session
            const newPotluck = new PotluckModel({
                host,
                participants: participants || [],
                ingredients: ingredients || [],
                recipes: recipes || [],
            });
    
            await newPotluck.save();
    
            // Update the User model by pushing the potluck session ID
            await UserModel.updateOne(
                { _id: host },
                { $push: { potluck: newPotluck._id } } // Append the new potluck ID
            );
    
            res.status(201).json({ message: "Potluck session created successfully.", potluck: newPotluck });
        } catch (error) {
            console.error("Error creating potluck session:", error);
            res.status(500).json({ error: "Failed to create potluck session." });
        }
    }

    async addPotluckIngredients(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params; // Potluck ID
            const { ingredients } = req.body; // List of ingredient IDs to add
    
            // Validate Potluck ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid Potluck ID format." });
            }
    
            // Check if ingredients are provided and are in an array
            if (!Array.isArray(ingredients) || ingredients.length === 0) {
                return res.status(400).json({ error: "Ingredients must be an array with at least one ID." });
            }
    
            // Ensure all ingredient IDs are valid
            if (!ingredients.every(ingredient => mongoose.Types.ObjectId.isValid(ingredient))) {
                return res.status(400).json({ error: "One or more ingredient IDs are invalid." });
            }
    
            // Add new ingredients to the potluck session (avoids duplicates)
            const updatedPotluck = await PotluckModel.findByIdAndUpdate(
                id,
                { $addToSet: { ingredients: { $each: ingredients } } }, // Adds only unique values
                { new: true }
            ).populate("ingredients", "name"); // Populate ingredients info
    
            if (!updatedPotluck) {
                return res.status(404).json({ error: "Potluck session not found." });
            }
    
            res.status(200).json({ message: "Ingredients added successfully.", potluck: updatedPotluck });
        } catch (error) {
            console.error("Error adding ingredients to potluck:", error);
            res.status(500).json({ error: "Failed to add ingredients." });
        }
    }

    async removePotluckIngredients(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params; // Potluck ID
            const { ingredients } = req.body; // List of ingredient IDs to remove
    
            // Validate Potluck ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid Potluck ID format." });
            }
    
            // Check if ingredients are provided and are in an array
            if (!Array.isArray(ingredients) || ingredients.length === 0) {
                return res.status(400).json({ error: "Ingredients must be an array with at least one ID." });
            }
    
            // Ensure all ingredient IDs are valid
            if (!ingredients.every(ingredient => mongoose.Types.ObjectId.isValid(ingredient))) {
                return res.status(400).json({ error: "One or more ingredient IDs are invalid." });
            }
    
            // Remove specified ingredients from the potluck session
            const updatedPotluck = await PotluckModel.findByIdAndUpdate(
                id,
                { $pull: { ingredients: { $in: ingredients } } }, // Removes specified ingredient IDs
                { new: true }
            ).populate("ingredients", "name"); // Populate ingredients info
    
            if (!updatedPotluck) {
                return res.status(404).json({ error: "Potluck session not found." });
            }
    
            res.status(200).json({ message: "Ingredients removed successfully.", potluck: updatedPotluck });
        } catch (error) {
            console.error("Error removing ingredients from potluck:", error);
            res.status(500).json({ error: "Failed to remove ingredients." });
        }
    }

    async addPotluckParticipants(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params; // Potluck ID
            const { participants } = req.body; // List of participant IDs to add
    
            // Validate Potluck ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid Potluck ID format." });
            }
    
            // Check if participants are provided and are in an array
            if (!Array.isArray(participants) || participants.length === 0) {
                return res.status(400).json({ error: "Participants must be an array with at least one ID." });
            }
    
            // Ensure all participant IDs are valid
            if (!participants.every(participant => mongoose.Types.ObjectId.isValid(participant))) {
                return res.status(400).json({ error: "One or more participant IDs are invalid." });
            }
    
            // Add new participants to the potluck session (avoids duplicates)
            const updatedPotluck = await PotluckModel.findByIdAndUpdate(
                id,
                { $addToSet: { participants: { $each: participants } } }, // Adds only unique values
                { new: true }
            ).populate("participants", "name"); // Populate participants info
    
            if (!updatedPotluck) {
                return res.status(404).json({ error: "Potluck session not found." });
            }
    
            res.status(200).json({ message: "Participants added successfully.", potluck: updatedPotluck });
        } catch (error) {
            console.error("Error adding participants to potluck:", error);
            res.status(500).json({ error: "Failed to add participants." });
        }
    }

    async removePotluckParticipants(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params; // Potluck ID
            const { participants } = req.body; // List of participant IDs to remove
    
            // Validate Potluck ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid Potluck ID format." });
            }
    
            // Check if participants are provided and are in an array
            if (!Array.isArray(participants) || participants.length === 0) {
                return res.status(400).json({ error: "Participants must be an array with at least one ID." });
            }
    
            // Ensure all participant IDs are valid
            if (!participants.every(participant => mongoose.Types.ObjectId.isValid(participant))) {
                return res.status(400).json({ error: "One or more participant IDs are invalid." });
            }
    
            // Remove specified participants from the potluck session
            const updatedPotluck = await PotluckModel.findByIdAndUpdate(
                id,
                { $pull: { participants: { $in: participants } } }, // Removes specified ingredient IDs
                { new: true }
            ).populate("participants", "name"); // Populate participants info
    
            if (!updatedPotluck) {
                return res.status(404).json({ error: "Potluck session not found." });
            }
    
            res.status(200).json({ message: "Participants removed successfully.", potluck: updatedPotluck });
        } catch (error) {
            console.error("Error removing participants from potluck:", error);
            res.status(500).json({ error: "Failed to remove participants." });
        }
    }

    async updatePotluckRecipesByAI(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id; // Potluck ID
    
            // Validate Potluck ID
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid Potluck ID format." });
            }
    
            // Find the potluck session
            const potluck = await PotluckModel.findById(id);
            if (!potluck) {
                return res.status(404).json({ error: "Potluck session not found." });
            }
    
            // Ensure potluck has ingredients
            if (!potluck.ingredients || potluck.ingredients.length === 0) {
                return res.status(400).json({ error: "No ingredients found in the potluck session." });
            }
    
            // Fetch ingredient names from the database
            const ingredients = await IngredientModel.find(
                { _id: { $in: potluck.ingredients } }, // Find all ingredients matching ObjectId[]
                { name: 1, _id: 0 } // Only return the name field
            );
    
            // Extract ingredient names into a string array
            const ingredientNames = ingredients.map(ingredient => ingredient.name);
    
            // Ensure we have ingredient names before proceeding
            if (ingredientNames.length === 0) {
                return res.status(400).json({ error: "No valid ingredient names found." });
            }

            console.log(ingredientNames);
    
            // Call AI to generate recipes based on ingredient names
            const obj = await recipesGeneration({ ingredients: ingredientNames });
    
            // Extract the recipe
            if (!obj) {
                return res.status(400).send("No recipes found.");
            }
    
            // Ensure obj is an array before inserting
            const recipesArray = Array.isArray(obj) ? obj : [obj];
    
            console.log(`An AI-generated recipe is posted!`);
    
            // Insert generated recipes into the database
            const insertedRecipes = await RecipeModel.insertMany(recipesArray);
    
            // Extract inserted recipe IDs
            const recipeIds = insertedRecipes.map(recipe => recipe._id);
    
            // Update the potluck session with new recipe IDs
            const updatedPotluck = await PotluckModel.findByIdAndUpdate(
                id,
                { $addToSet: { recipes: { $each: recipeIds } } }, // Adds unique recipe IDs to the potluck session
                { new: true }
            ).populate("recipes", "name"); // Populate updated recipes info
    
            res.status(200).json({ message: "Potluck recipes updated successfully with AI-generated recipes.", potluck: updatedPotluck });
        } catch (error) {
            console.error("Error updating potluck recipes by AI:", error);
            res.status(500).json({ error: "Failed to update potluck recipes." });
        }
    }      

    async endPotluckSession(req: Request, res: Response, next: NextFunction) {
        try {
            const potluckId = req.params.id; // Potluck ID from request params
    
            // Validate Potluck ID
            if (!mongoose.Types.ObjectId.isValid(potluckId)) {
                return res.status(400).json({ error: "Invalid Potluck ID format." });
            }
    
            console.log("Valid potluck ID: ", potluckId);
    
            // Find the potluck session
            const potluck = await PotluckModel.findById(potluckId);
            if (!potluck) {
                return res.status(404).json({ error: "Potluck session not found." });
            }
    
            console.log("Found potluck session.");
    
            // Remove potluck session reference from the host user
            await UserModel.updateOne(
                { _id: potluck.host },
                { $pull: { potluck: potluckId } } // Remove only this potluck ID
            );
    
            // Delete the potluck session
            await PotluckModel.deleteOne({ _id: potluckId });
    
            res.status(200).json({ message: "Potluck session deleted successfully." });
        } catch (error) {
            console.error("Error deleting potluck session:", error);
            res.status(500).json({ error: "Failed to delete potluck session." });
        }
    }    
}