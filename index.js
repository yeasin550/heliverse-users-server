const express = require("express");
const app = express();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
// const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
const port = process.env.PORT || 5000;

// middleware
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  // console.log("authorization", authorization);
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }

  const token = authorization.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3iohovs.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const userCollection = client.db("heliverse").collection("users");
    const teamsCollection = client.db("heliverse").collection("teams");
    // verify email jwt
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });

      res.send({ token });
    });

    // verify admin email
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user?.role !== "admin") {
        return res
          .status(403)
          .send({ error: true, message: "forbidden message" });
      }
      next();
    };

app.post("/team", async (req, res) => {
  try {
    const { teamName, users } = req.body;
    const database = client.db("your_database_name");
    const teamsCollection = database.collection("teams");
    const newTeam = {
      teamName,
      users,
    };
    const result = await teamsCollection.insertOne(newTeam);
    if (result.ops && result.ops.length > 0) {
      // Respond with the newly created team
      res.status(201).json(result.ops[0]);
    } else {
      console.error(
        "Error creating team: Unable to retrieve the newly created team."
      );
      res.status(500).json({ error: "Internal Server Error" });
    }
  } catch (error) {
    console.error("Error creating team:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", details: error.message });
  }
});



    app.get("/users", async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const pageSize = 21;
      const skip = (page - 1) * pageSize;

      let query = {};

      const searchName = req.query.searchName;
      if (searchName) {
        query = {
          $or: [
            { first_name: { $regex: searchName, $options: "i" } },
            { last_name: { $regex: searchName, $options: "i" } },
          ],
        };
      }

      const domainFilter = req.query.domain;
      if (domainFilter) {
        query.domain = { $in: domainFilter.split(",") };
      }

      const genderFilter = req.query.gender;
      if (genderFilter) {
        query.gender = { $in: genderFilter.split(",") };
      }

      const availabilityFilter = req.query.availability;
      if (availabilityFilter) {
        query.available = availabilityFilter === "true";
      }

      const users = await userCollection
        .find(query)
        .skip(skip)
        .limit(pageSize)
        .toArray();
      res.send(users);
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await userCollection.findOne(query);
      console.log(existingUser);
      if (existingUser) {
        return res.send({ message: "user already exists" });
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("SUMMER CAMP SCHOOL IS RUNNING");
});

app.listen(port, () => {
  console.log(`summer  is sitting on port ${port}`);
});
