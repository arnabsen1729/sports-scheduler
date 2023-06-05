const express = require("express");
const { Sports } = require("./models");

const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));

app.set("view engine", "ejs");

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/sports/new", (req, res) => {
  res.render("sports/new");
});

app.get("/sports", async (req, res) => {
  try {
    const sports = await Sports.getSports();
    if (req.headers.accept.includes("text/html")) {
      res.redirect("/sports/all");
    } else {
      res.json(sports);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/sports/all", async (req, res) => {
  const sports = await Sports.getSports();
  ejs.renderFile("./views/sports/all.ejs", { sports: sports }, (err, html) => {
    if (err) {
      console.log(err);
    }
    res.send(html);
  });
});

app.get("/sports/:id", async (req, res) => {
  try {
    const sport = await Sports.findByPk(req.params.id);
    ejs.renderFile(
      "./views/sports/index.ejs",
      { id: sport.id, name: sport.name },
      (err, html) => {
        if (err) {
          console.log(err);
        }
        res.send(html);
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/sports/:id/edit", async (req, res) => {
  try {
    const sport = await Sports.findByPk(req.params.id);
    ejs.renderFile(
      "./views/sports/edit.ejs",
      { id: sport.id, name: sport.name },
      (err, html) => {
        if (err) {
          console.log(err);
        }
        res.send(html);
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/sports/:id/delete", async (req, res) => {
  try {
    const sport = await Sports.findByPk(req.params.id);
    ejs.renderFile(
      "./views/sports/delete.ejs",
      { id: sport.id, name: sport.name },
      (err, html) => {
        if (err) {
          console.log(err);
        }
        res.send(html);
      }
    );
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/sports", async (req, res) => {
  try {
    const newSport = await Sports.addSport(req.body.name);
    console.log(newSport);
    if (req.headers.accept.includes("text/html")) {
      res.redirect(`/sports/${newSport.id}`);
    } else {
      res.json(newSport);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/sports/:id", async (req, res) => {
  try {
    const sport = await Sports.findByPk(req.params.id);
    console.log(sport);
    await sport.updateSportName(req.body.name);
    res.json(sport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/sports/:id", async (req, res) => {
  try {
    await Sports.deleteSport(req.params.id);
    res.json({ deleted: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
