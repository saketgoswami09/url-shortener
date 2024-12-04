const express = require("express");
const { connectToMongoDB } = require("./connect");
const path = require("path")
const urlRoute = require("./routes/url");
const URL = require("./models/url");

const staticRoute = require("./routes/staticRouter")

const app = express();
const PORT = 8001;

connectToMongoDB("mongodb://127.0.0.1:27017/short-url").then(() =>
  console.log("MongoDB Connected")
);

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false}))

// ejs
app.set("view engine", "ejs")
app.set("views", path.resolve("./views"))


// app.get("/test", async (req, res) => {
//     const allUrls = await URL.find({});
    
//     return res.render("home", {
//       urls: allUrls,
//     })
// })

app.use("/url", urlRoute);
app.use("/", staticRoute)


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
