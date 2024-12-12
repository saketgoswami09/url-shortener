const express = require('express');
const { connectToMongoDB } = require("./connect");
const path = require("path")
const URL = require("./models/url");
const cookieParser = require('cookie-parser');
const { restrictToLogedinUserOnly, checkAuth } = require("./middlewares/auth");
const urlRoute = require("./routes/url");
const staticRoute = require("./routes/staticRouter")
const userRoute = require("./routes/user")

const app = express();
const PORT = 8001;

connectToMongoDB("mongodb://127.0.0.1:27017/short-url").then(() =>
  console.log("MongoDB Connected")
);


// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser());

// ejs
app.set("view engine", "ejs")
app.set("views", path.resolve("./views"))


app.use("/url",restrictToLogedinUserOnly, urlRoute);
app.use("/user",  userRoute);
app.use("/",checkAuth, staticRoute)

app.get("/:shortId", async (req, res) => {
  const shortId = req.params.shortId;

  try {
    const entry = await URL.findOneAndUpdate(
      { shortId },
      {
        $push: {
          visitHistory: { timestamp: Date.now() },
        },
      },
      { new: true } // Ensures the updated document is returned
    );

    if (!entry) {
      // If no entry is found, return a 404 response
      return res.status(404).send("Short URL not found");
    }

    // If entry exists, redirect to the original URL
    res.redirect(entry.redirectURL);
  } catch (error) {
    console.error("Error fetching short URL:", error);
    res.status(500).send("Internal server error");
  }
});

app.listen(PORT, () => console.log(`Server Statred at PORT ${PORT}`));
