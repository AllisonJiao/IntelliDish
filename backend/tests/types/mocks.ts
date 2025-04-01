import { Document } from 'mongoose';

export interface IIngredient {
    _id: string;
    name: string;
    category: string;
    quantity?: number;
    unit?: string;
}

export interface IRecipe {
    _id: string;
    name: string;
    description: string;
    ingredients: Array<{
        name: string;
        quantity: number;
        unit: string;
    }>;
    instructions: string[];
    prepTime?: number;
    cookTime?: number;
    servings?: number;
}

export type IngredientDocument = Document & IIngredient;
export type RecipeDocument = Document & IRecipe;

export type MockFind = jest.Mock<Promise<any>, [any]>;
export type MockFindById = jest.Mock<Promise<any>, [string]>;
export type MockFindOne = jest.Mock<Promise<any>, [any]>;
export type MockCreate = jest.Mock<Promise<any>, [any]>;
export type MockSave = jest.Mock<Promise<any>, []>;
export type MockRecipeCreate = jest.Mock<Promise<Partial<Document>>>;
export type MockFindByIdAndUpdate = jest.Mock<Promise<Partial<Document> | null>>;
export type MockFindByIdAndDelete = jest.Mock<Promise<Partial<Document> | null>>; 