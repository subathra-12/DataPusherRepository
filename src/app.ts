import "reflect-metadata";
import { createExpressServer } from "routing-controllers";
import { AccountController } from "./controllers/AccountController";
import { AuthController } from './controllers/AuthController';
import { RateLimitMiddleware } from './middlewares/RateLimitMiddleware'
import { DataSource } from "./data-source";
import { authorizationChecker } from "./auth/authorizationChecker"; // ✅ Import here
import dotenv from "dotenv";
import { AccountMemberController } from "./controllers/AccountMemberController";
import { DestinationController } from "./controllers/DestinationController";
import { IncomingController } from "./controllers/IncomingController";
dotenv.config();

DataSource.initialize().then(() => {
  const app = createExpressServer({
    routePrefix: "/api",
    controllers: [AuthController, AccountMemberController , DestinationController ,IncomingController,AccountController],
    middlewares: [RateLimitMiddleware],
    authorizationChecker, // ✅ Add this
  });

  const port = process.env.PORT || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
  });
});
