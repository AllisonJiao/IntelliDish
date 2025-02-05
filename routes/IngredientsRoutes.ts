import { IngredientsController } from "../controllers/IngredientsController";
import { body, param } from "express-validator";

const controller = new IngredientsController();

export const IngredientsRoutes = [
    {
        method: "get",
        route: "/ingredients",
        action: controller.getAllIngredients,
        validation: []
    }, 
    {
        method: "get",
        route: "/ingredients/id/:id",
        action: controller.getIngredientById,
        validation: [
            param("id").isMongoId()
        ]
    }, 
    {
        method: "get",
        route: "/ingredients/name/:name",
        action: controller.getIngredientByName,
        validation: [
            param("name").isString()
        ]
    }, 
    {
        method: "post",
        route: "/ingredients",
        action: controller.postNewIngredient,
        validation: [
            body("name").isString(),
            body("category").isString(),
            // body("amount").isInt() --> is a non-negative integer, check for function later
        ]
    },
    {
        method: "post",
        route: "/ingredients/AI",
        action: controller.postIngredientsFromAI,
        validation: [
            // TODO: 
            // Add validation conditions
        ]
    },
    {
        method: "put",
        route: "/ingredients",
        action: controller.updateIngredientQuantity,
        validation: [
            body("name").isString()
        ]
    }, 
    {
        method: "put",
        route: "/ingredients/:id",
        action: controller.putIngredientById,
        validation: [
            param("id").isMongoId(),
            body("name").isString(),
            body("category").isString()
        ]
    }, 
    {
        method: "delete",
        route: "/ingredients/:id",
        action: controller.deleteIngredientById,
        validation: [
            param("id").isMongoId()
        ]
    },
];