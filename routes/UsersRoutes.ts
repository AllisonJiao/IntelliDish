import { UsersController } from "../controllers/UsersController";
import { body, param } from "express-validator";

const controller = new UsersController();

export const UsersRoutes = [
    {
        method: "get",
        route: "/users",
        action: controller.getUsers,
        validation: []
    },
    {
        method: "get",
        route: "/users/id/:id",
        action: controller.getUserById,
        validation: [
            param("id").isMongoId().withMessage("Invalid MongoDB ID format")
        ]
    },
    {
        method: "get",
        route: "/users/email/:email",
        action: controller.getUserByEmail,
        validation: [
            param("email").isEmail()
        ]
    },
    {
        method: "post",
        route: "/users",
        action: controller.createNewUser,
        validation: [
            body("name").isString(),
            body("email").isEmail(),
            body("friends").optional().isArray()
        ]
    },
    {
        method: "put",
        route: "/users/:id/name",
        action: controller.updateUserName,
        validation: [
            param("id").isMongoId(),
            body("name").isString()
        ]
    },
    {
        method: "put",
        route: "/users/:id/addFriend",
        action: controller.addNewFriend,
        validation: [
            param("id").isMongoId(),
            body("_id").isMongoId()
        ]
    },
    {
        method: "put",
        route: "/users/:id/deleteFriend",
        action: controller.deleteFriend,
        validation: [
            param("id").isMongoId(),
            body("_id").isMongoId()
        ]
    },
    {
        method: "get",
        route: "/users/:id/friends",
        action: controller.getFriends,
        validation: [
            param("id").isMongoId()
        ]
    },
    {
        method: "delete",
        route: "/users/:id",
        action: controller.deleteUserAccount,
        validation: [
            param("id").isMongoId()
        ]
    },
    {
        method: "post",
        route: "/users/:id/recipe",
        action: controller.addRecipeToUser,
        validation: [
            param("id").isMongoId().withMessage("Invalid MongoDB ID format"),
            body("_id").isMongoId().withMessage("Invalid Recipe ID format")
        ]
    },
    {
        method: "delete",
        route: "/users/:id/recipe",
        action: controller.deleteRecipeFromUser,
        validation: [
            param("id").isMongoId(),
            body("_id").isMongoId() // Ensure valid ObjectId
        ]
    },
    {
        method: "get",
        route: "/users/:id/recipes",
        action: controller.getRecipes,
        validation: [
            param("id").isMongoId()
        ]
    },
    {
        method: "post",
        route: "/users/:id/ingredient",
        action: controller.addIngredientToUser,
        validation: [
            param("id").isMongoId().withMessage("Invalid MongoDB ID format"),
            body("_id").isMongoId().withMessage("Invalid ingredient ID format")
        ]
    },
    {
        method: "delete",
        route: "/users/:id/ingredient",
        action: controller.deleteIngredientFromUser,
        validation: [
            param("id").isMongoId().withMessage("Invalid MongoDB ID format"),
            body("_id").isMongoId().withMessage("Invalid ingredient ID format")
        ]
    },
    {
        method: "get",
        route: "/users/:id/ingredients",
        action: controller.getIngredients,
        validation: [
            param("id").isMongoId()
        ]
    },
    // === Potluck Routes ===
    {
        method: "get",
        route: "/potluck",
        action: controller.getPotluckSessions,
        validation: []
    },
    {
        method: "get",
        route: "/potluck/:id",
        action: controller.getPotluckSessionsById,
        validation: []
    },
    {
        method: "get",
        route: "/potluck/host/:id",
        action: controller.getPotluckSessionsByHostId,
        validation: []
    },
    {
        method: "get",
        route: "/potluck/participant/:id",
        action: controller.getPotluckSessionsByParticipantId,
        validation: []
    },
    {
        method: "post",
        route: "/potluck",
        action: controller.createPotluckSession,
        validation: [
            body("participants").isArray(),
            body("ingredients").isArray()
        ]
    },
    {
            method: "put",
            route: "/potluck/:id/ingredients",
            action: controller.addPotluckIngredients,
            validation: [
                param("id").isMongoId(),
                body("ingredients").isArray()
            ]
    },
    {
        method: "delete",
        route: "/potluck/:id/ingredients",
        action: controller.removePotluckIngredients,
        validation: [
            param("id").isMongoId(),
            body("ingredients").isArray()
        ]
    },
    {
        method: "put",
        route: "/potluck/:id/participants",
        action: controller.addPotluckParticipants,
        validation: [
            param("id").isMongoId(),
            body("participants").isArray()
        ]
    },
    {
        method: "delete",
        route: "/potluck/:id/participants",
        action: controller.removePotluckParticipants,
        validation: [
            param("id").isMongoId(),
            body("participants").isArray()
        ]
    },
    {
        method: "put",
        route: "/potluck/AI/:id",
        action: controller.updatePotluckRecipesByAI,
        validation: [
            param("id").isMongoId()
        ]
    },
    {
        method: "delete",
        route: "/potluck/:id",
        action: controller.endPotluckSession,
        validation: [
            param("id").isMongoId()
        ]
    }
];