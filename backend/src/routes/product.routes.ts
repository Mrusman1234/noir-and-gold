import { Router } from "express";
import { getProducts, getProductByIdOrSlug } from "../controllers/product.controller.js";

export const productRouter = Router();

productRouter.get("/", getProducts);
productRouter.get("/:id", getProductByIdOrSlug);
