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
        route: "/users/email/:email",
        action: controller.getUserByEmail,
        validation: []
    },
    {
        method: "get",
        route: "/users/id/:id",
        action: controller.getUserById,
        validation: []
    },
    {
        method: "post",
        route: "/users",
        action: controller.createNewUser,
        validation: []
    },
    {
        method: "put",
        route: "/users/addFriend/:id",
        action: controller.addNewFriend,
        validation: []
    },
    {
        method: "put",
        route: "/users/:id",
        action: controller.updateUserName,
        validation: [
            body("name")
                .trim()
                .notEmpty().withMessage("Name is required")
                .isString().withMessage("Name must be a string")
        ]
    }
];