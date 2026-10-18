import { Router } from "express";
import { getCategories } from "../controllers/category.controller.js";

export const categoryRouter = Router();

categoryRouter.get("/", getCategories);
