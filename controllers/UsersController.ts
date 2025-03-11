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

    async getFriends(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.id;
    
            // Validate the user ID
            if (!mongoose.isValidObjectId(userId)) {
                return res.status(400).json({ message: "Invalid user ID format" });
            }
    
            // Find the user
            const user = await UserModel.findById(userId).populate("friends", "name email"); // Populate friend details
    
            if (!user) {
                return res.status(404).json({ error: `User with ID '${userId}' not found.` });
            }
    
            // Return the list of friends
            res.status(200).json({ friends: user.friends });
        } catch (error) {
            console.error("Error fetching friends:", error);
            res.status(500).json({ error: "Failed to retrieve friends list." });
        }
    }    

    async deleteUserAccount(req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.id;

            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({ error: "Invalid user ID format." });
            }

            await UserModel.findOneAndDelete({ _id: userId });

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

    async getRecipes (req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.id;
    
            // Validate the user ID
            if (!mongoose.isValidObjectId(userId)) {
                return res.status(400).json({ message: "Invalid user ID format" });
            }
    
            // Find the user
            const user = await UserModel.findById(userId).populate("recipes", "name procedure"); // Populate recipes details
    
            if (!user) {
                return res.status(404).json({ error: `User with ID '${userId}' not found.` });
            }
    
            // Return the list of recipes
            res.status(200).json({ recipes: user.recipes });
        } catch (error) {
            console.error("Error fetching recipes:", error);
            res.status(500).json({ error: "Failed to retrieve recipes." });
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

    async getIngredients (req: Request, res: Response, next: NextFunction) {
        try {
            const userId = req.params.id;
    
            // Validate the user ID
            if (!mongoose.isValidObjectId(userId)) {
                return res.status(400).json({ message: "Invalid user ID format" });
            }
    
            // Find the user
            const user = await UserModel.findById(userId).populate("ingredients", "name category"); // Populate ingredient details
    
            if (!user) {
                return res.status(404).json({ error: `User with ID '${userId}' not found.` });
            }
    
            // Return the list of ingredients
            res.status(200).json({ ingredients: user.ingredients });
        } catch (error) {
            console.error("Error fetching ingredients:", error);
            res.status(500).json({ error: "Failed to retrieve ingredients." });
        }
    }

    // Potluck related functions
    async getPotluckSessions(req: Request, res: Response, next: NextFunction) {
        try {
            const potlucks = await PotluckModel.find()
                .populate("host", "name email")
                .populate("participants.user", "name email")
                .populate("recipes", "name");

            res.status(200).json({ potlucks });
        } catch (error) {
            console.error("Error retrieving potluck sessions:", error);
            res.status(500).json({ error: "Failed to retrieve potluck sessions." });
        }
    }

    async getPotluckSessionsById(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid Potluck ID format." });
            }

            const potluck = await PotluckModel.findById(id)
                .populate("host", "name email")
                .populate("participants.user", "name email")
                .populate("recipes", "name");

            if (!potluck) {
                return res.status(404).json({ error: "Potluck session not found." });
            }

            res.status(200).json({ potluck });
        } catch (error) {
            console.error("Error retrieving potluck session:", error);
            res.status(500).json({ error: "Failed to retrieve potluck session." });
        }
    }

    
    async createPotluckSession(req: Request, res: Response, next: NextFunction) {
        try {
            const { name, date, host, participants = [], ingredients = [], recipes = [] } = req.body;
    
            if (!name || !date || !host) {
                return res.status(400).json({ error: "Name, Date, and Host are required." });
            }
    
            const user = await UserModel.findById(host);
            if (!user) {
                return res.status(404).json({ error: "Host user not found." });
            }
    
            // Directly use `participants` and `ingredients` from frontend request
            const newPotluck = new PotluckModel({
                name,
                date,
                host,
                participants,  // Use participants exactly as received
                ingredients,   // Use ingredients exactly as received
                recipes,
            });
    
            await newPotluck.save();
    
            // Update host's potluck list
            await UserModel.updateOne({ _id: host }, { $push: { potluck: newPotluck._id } });
    
            // Update all participants' potluck lists
            if (participants.length > 0) {
                const participantIds = participants.map((p: { user: string }) => p.user);
                await UserModel.updateMany(
                    { _id: { $in: participantIds } },
                    { $addToSet: { potluck: newPotluck._id } } // Ensure no duplicate potluck IDs
                );
            }
    
            res.status(201).json({ message: "Potluck session created successfully.", potluck: newPotluck });
        } catch (error) {
            console.error("Error creating potluck session:", error);
            res.status(500).json({ error: "Failed to create potluck session." });
        }
    }
    
    
    async getPotluckSessionsByHostId(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
    
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid User ID format." });
            }
    
            const potlucks = await PotluckModel.find({ host: id })
                .populate("host", "name email")
                .populate("participants.user", "name email")
                .populate("recipes", "name"); // No need to populate `participants.ingredients` and `ingredients` (they are strings)
    
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
            const { id } = req.params;
    
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid Participant ID format." });
            }
    
            const potlucks = await PotluckModel.find({ "participants.user": id })
                .populate("host", "name email")
                .populate("participants.user", "name email")
                .populate("recipes", "name"); // No need to populate `participants.ingredients` and `ingredients` (they are strings)
    
            if (!potlucks.length) {
                return res.status(404).json({ error: "No potluck sessions found for this participant." });
            }
    
            res.status(200).json({ potlucks });
        } catch (error) {
            console.error("Error retrieving potluck sessions by participant ID:", error);
            res.status(500).json({ error: "Failed to retrieve potluck sessions." });
        }
    }    


    async addPotluckIngredientsToParticipant(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params; // Potluck ID
            const { participantId, ingredients } = req.body; // Participant ID and list of ingredient names
    
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid Potluck ID format." });
            }
    
            if (!mongoose.Types.ObjectId.isValid(participantId)) {
                return res.status(400).json({ error: "Invalid Participant ID format." });
            }
    
            if (!Array.isArray(ingredients) || ingredients.length === 0) {
                return res.status(400).json({ error: "Ingredients must be a non-empty array of names." });
            }
    
            const potluck = await PotluckModel.findById(id);
            if (!potluck) {
                return res.status(404).json({ error: "Potluck session not found." });
            }
    
            const participant = potluck.participants.find((p) => p.user.toString() === participantId);
            if (!participant) {
                return res.status(400).json({ error: "Participant is not part of this potluck." });
            }
    
            // Add unique ingredients to participant's ingredient list
            participant.ingredients = [...new Set([...participant.ingredients, ...ingredients])];
    
            // Add unique ingredients to the potluck's overall list
            potluck.ingredients = [...new Set([...potluck.ingredients, ...ingredients])];
    
            await potluck.save();
    
            const updatedPotluck = await PotluckModel.findById(id)
                .populate("host", "name email")
                .populate("participants.user", "name email")
                .populate("recipes", "name"); // No need to populate `ingredients`
    
            res.status(200).json({
                message: "Ingredients added successfully to participant and potluck.",
                potluck: updatedPotluck,
            });
        } catch (error) {
            console.error("Error adding ingredients to potluck:", error);
            res.status(500).json({ error: "Failed to add ingredients." });
        }
    }
    
    async removePotluckIngredientsFromParticipant(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params; // Potluck ID
            const { participantId, ingredients } = req.body; // Participant ID and list of ingredient names to remove
    
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid Potluck ID format." });
            }
    
            if (!mongoose.Types.ObjectId.isValid(participantId)) {
                return res.status(400).json({ error: "Invalid Participant ID format." });
            }
    
            if (!Array.isArray(ingredients) || ingredients.length === 0) {
                return res.status(400).json({ error: "Ingredients must be a non-empty array of names." });
            }
    
            const potluck = await PotluckModel.findById(id);
            if (!potluck) {
                return res.status(404).json({ error: "Potluck session not found." });
            }
    
            const participant = potluck.participants.find((p) => p.user.toString() === participantId);
            if (!participant) {
                return res.status(400).json({ error: "Participant is not part of this potluck." });
            }
    
            // Remove specified ingredients from participant's ingredient list
            participant.ingredients = participant.ingredients.filter((ing) => !ingredients.includes(ing));
    
            // Remove only ingredients that are not assigned to any participant
            const participantIngredients = potluck.participants.flatMap((p) => p.ingredients);
            potluck.ingredients = potluck.ingredients.filter((ing) => participantIngredients.includes(ing));
    
            await potluck.save();
    
            const updatedPotluck = await PotluckModel.findById(id)
                .populate("host", "name email")
                .populate("participants.user", "name email")
                .populate("recipes", "name");
    
            res.status(200).json({
                message: "Ingredients removed successfully from participant and potluck.",
                potluck: updatedPotluck,
            });
        } catch (error) {
            console.error("Error removing ingredients from potluck:", error);
            res.status(500).json({ error: "Failed to remove ingredients." });
        }
    }
    
    async addPotluckParticipants(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params; // Potluck ID
            const { participants } = req.body; // List of participant IDs to add
    
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid Potluck ID format." });
            }
    
            if (!Array.isArray(participants) || participants.length === 0) {
                return res.status(400).json({ error: "Participants must be an array with at least one ID." });
            }
    
            if (!participants.every((participant) => mongoose.Types.ObjectId.isValid(participant))) {
                return res.status(400).json({ error: "One or more participant IDs are invalid." });
            }
    
            const potluck = await PotluckModel.findById(id);
            if (!potluck) {
                return res.status(404).json({ error: "Potluck session not found." });
            }
    
            const existingParticipants = new Set(potluck.participants.map((p) => p.user.toString()));
    
            const newParticipants = participants
                .filter((userId) => !existingParticipants.has(userId.toString()))
                .map((userId) => ({
                    user: new mongoose.Types.ObjectId(userId) as unknown as ObjectId,
                    ingredients: [],
                }));
    
            if (newParticipants.length === 0) {
                return res.status(400).json({ error: "All selected participants are already in the potluck." });
            }
    
            potluck.participants.push(...newParticipants);
            await potluck.save();

            await UserModel.updateMany(
                { _id: { $in: participants } },
                { $addToSet: { potluck: id } }
            );
    
            const updatedPotluck = await PotluckModel.findById(id)
                .populate("host", "name email")
                .populate("participants.user", "name email")
                .populate("recipes", "name");
    
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
    
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid Potluck ID format." });
            }
    
            if (!Array.isArray(participants) || participants.length === 0) {
                return res.status(400).json({ error: "Participants must be an array with at least one ID." });
            }
    
            if (!participants.every((participant) => mongoose.Types.ObjectId.isValid(participant))) {
                return res.status(400).json({ error: "One or more participant IDs are invalid." });
            }
    
            const potluck = await PotluckModel.findById(id);
            if (!potluck) {
                return res.status(404).json({ error: "Potluck session not found." });
            }
    
            const participantsSet = new Set(participants);
    
            const ingredientsToRemove = potluck.participants
                .filter((p) => participantsSet.has(p.user.toString()))
                .flatMap((p) => p.ingredients);
    
            potluck.participants = potluck.participants.filter((p) => !participantsSet.has(p.user.toString()));
    
            potluck.ingredients = potluck.ingredients.filter((ingredient) => !ingredientsToRemove.includes(ingredient));
    
            await potluck.save();

            await UserModel.updateMany(
                { _id: { $in: participants } },
                { $pull: { potluck: id } }
            );
            
    
            const updatedPotluck = await PotluckModel.findById(id)
                .populate("host", "name email")
                .populate("participants.user", "name email")
                .populate("recipes", "name");
    
            res.status(200).json({ message: "Participants removed successfully.", potluck: updatedPotluck });
        } catch (error) {
            console.error("Error removing participants from potluck:", error);
            res.status(500).json({ error: "Failed to remove participants." });
        }
    }
    
    
    async updatePotluckRecipesByAI(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id; // Potluck ID
    
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid Potluck ID format." });
            }
    
            const potluck = await PotluckModel.findById(id);
            if (!potluck) {
                return res.status(404).json({ error: "Potluck session not found." });
            }
    
            if (!potluck.ingredients || potluck.ingredients.length === 0) {
                return res.status(400).json({ error: "No ingredients found in the potluck session." });
            }
    
            // Directly use ingredient names from the model
            const ingredientNames = potluck.ingredients;
    
            console.log("Ingredients for AI recipe generation:", ingredientNames);
    
            // Call AI to generate recipes
            const generatedRecipes = await recipesGeneration({ ingredients: ingredientNames });
    
            if (!generatedRecipes || generatedRecipes.length === 0) {
                return res.status(400).send({ error: "AI did not generate any recipes." });
            }
    
            // Insert AI-generated recipes into the database
            const insertedRecipes = await RecipeModel.insertMany(generatedRecipes);
    
            // Extract inserted recipe IDs
            const recipeIds = insertedRecipes.map(recipe => recipe._id);
    
            // Update the potluck session with new recipe IDs
            const updatedPotluck = await PotluckModel.findByIdAndUpdate(
                id,
                { $addToSet: { recipes: { $each: recipeIds } } }, // Add unique recipes
                { new: true }
            ).populate("recipes", "name");
    
            res.status(200).json({
                message: "AI-generated recipes added successfully.",
                recipe: insertedRecipes
            });
        } catch (error) {
            console.error("Error updating potluck recipes by AI:", error);
            res.status(500).json({ error: "Failed to update potluck recipes." });
        }
    }
    
    async endPotluckSession(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.params;
    
            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid Potluck ID format." });
            }
    
            const potluck = await PotluckModel.findById(id);
            if (!potluck) {
                return res.status(404).json({ error: "Potluck session not found." });
            }
            
            //Remove potluck session from all participants' list:
            await UserModel.updateMany(
                { _id: { $in: potluck.participants } }, // Find all participants
                { $pull: { potluck: id } } // Remove potluck ID from their list
            );

            // Delete the potluck session
            await PotluckModel.deleteOne({ _id: id });
    
            res.status(200).json({ message: "Potluck session deleted successfully." });
        } catch (error) {
            console.error("Error deleting potluck session:", error);
            res.status(500).json({ error: "Failed to delete potluck session." });
        }
    }    
}