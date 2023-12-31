const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("../swagger.json");
const cors = require("cors");
const serverlessHttp = require("serverless-http");

const app = express();
const router = express.Router();

// Middleware to parse incoming JSON data
router.use(express.json());

// Enable CORS for all routes
router.use(cors());

// Google Sign-In client ID (Replace this with your own client ID)
const GOOGLE_CLIENT_ID =
  "60528208097-0m6p833tdtob9gcgvmr01iqi8d6c5bsn.apps.googleusercontent.com";

// Sample data (you can replace this with a database or other data source)
let todos = [
  // Sample todos...
];

// Function to validate Google ID token
async function validateGoogleToken(idToken) {
  const client = new OAuth2Client(GOOGLE_CLIENT_ID);
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  } catch (error) {
    console.error("Error validating Google ID token:", error.message);
    return null;
  }
}

// Middleware to validate Google ID token
async function tokenValidationMiddleware(req, res, next) {
  const token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ error: "Authorization token is missing." });
  }

  const idToken = token.replace("Bearer ", "");

  const payload = await validateGoogleToken(idToken);
  if (!payload) {
    return res
      .status(401)
      .json({ error: "Invalid or expired Google ID token." });
  }

  req.user = payload;
  next();
}

// Route to validate Google ID token
router.post("/validate-token", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token is required for validation." });
  }

  const payload = await validateGoogleToken(token);
  if (!payload) {
    return res
      .status(401)
      .json({ error: "Invalid or expired Google ID token." });
  }

  res.json({ message: "Token is valid.", payload });
});

// Protected route, requires token validation
router.get("/todos", tokenValidationMiddleware, (req, res) => {
  res.json(todos);
});

// Protected route, requires token validation
router.post("/todos", tokenValidationMiddleware, (req, res) => {
  // Rest of the code for creating a new todo...
});

// Protected route, requires token validation
router.put("/todos/:id", tokenValidationMiddleware, (req, res) => {
  // Rest of the code for updating a todo...
});

// Protected route, requires token validation
router.delete("/todos/:id", tokenValidationMiddleware, (req, res) => {
  // Rest of the code for deleting a todo...
});

// Serve Swagger UI at /api-docs
router.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Start the server
// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });

// Export the app for serverless deployment
app.use("/.netlify/functions/api", router);
module.exports.handler = serverlessHttp(app);
