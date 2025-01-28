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
        route: "/ingredients/:id",
        action: controller.getIngredientById,
        validation: [
            param("id").isMongoId()
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
]