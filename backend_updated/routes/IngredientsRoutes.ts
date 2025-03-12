import { IngredientsController } from "../controllers/IngredientsController";
import { body, param, query } from "express-validator";

const controller = new IngredientsController();

const validCategories = ["Vegetables", "Fruit", "Whole Grains", "Meats", "Eggs", "Dairy", "Condiments", "Others"];

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
        route: "/ingredients/name",
        action: controller.getIngredientByName,
        validation: [
            query("name").isString().notEmpty().withMessage("Ingredient name is required.")
        ]
    },  
    {
        method: "post",
        route: "/ingredients",
        action: controller.postNewIngredient,
        validation: [
            body("name").isString().notEmpty().withMessage("Name must be a non-empty string"),
            body("category")
                .isString().withMessage("Category must be a string")
                .isIn(validCategories).withMessage(`Category must be one of: ${validCategories.join(", ")}`),
            body("quantity").isInt().withMessage("Quantity must be an integer"),
            body("unit").isString().withMessage("Unit must be a string")
        ]
    },
    {
        method: "post",
        route: "/ingredients/AI",
        action: controller.postIngredientsFromAI,
        validation: [
            body("imgPath").isString().withMessage("Image path must be a string"),
            body("imgPath").matches(/\.(jpg|jpeg|png)$/i).withMessage("File must be an image (.jpg, .jpeg, .png)")
        ]
    },
    {
        method: "put",
        route: "/ingredients/:id",
        action: controller.putIngredientById,
        validation: [
            param("id").isMongoId(),
            body("name").isString().notEmpty().withMessage("Name must be a non-empty string"),
            body("category")
                .isString().withMessage("Category must be a string")
                .isIn(validCategories).withMessage(`Category must be one of: ${validCategories.join(", ")}`),
            body("quantity").isInt().withMessage("Quantity must be an integer"),
            body("unit").isString().withMessage("Unit must be a string")
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