import express from "express";
import cors from "cors";
import productRoutes from "./routes/products";
import orderRoutes from "./routes/orders";
import statsRoutes from "./routes/stats";
import restaurantRoutes from "./routes/restaurants";
import employeeRouter from "./routes/employees";
import ruleRouter from "./routes/rules";
import { scheduleRouter } from "./routes/schedule";
import employeeTypesRouter from "./routes/employeeTypes";
import employeePositionsRouter from "./routes/employeePositions";
import { roleRouter } from "./routes/Role";
import employeeWorkHoursRouter from "./routes/employeeWorkHours";
import authRouter from "./routes/auth";
import recettesRouter from "./routes/Recettes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/products", productRoutes);

app.use("/uploads", express.static("uploads"));

app.use("/api/orders", orderRoutes);

app.use("/api/stats", statsRoutes);

app.use("/api/restaurants", restaurantRoutes);

app.use("/api/employees", employeeRouter);

app.use("/api/rules", ruleRouter);

app.use("/api/schedule", scheduleRouter);

app.use("/api/employee-types", employeeTypesRouter);

app.use("/api/employee-positions", employeePositionsRouter);

app.use("/api/roles", roleRouter);

app.use("/api/auth", authRouter);

app.use("/api/work-hours", employeeWorkHoursRouter);

app.use("/api/recettes", recettesRouter);

app.listen(4000, "0.0.0.0", () => {
    console.log("🚀 Serveur démarré sur http://0.0.0.0:4000");
});