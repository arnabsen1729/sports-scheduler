const express = require("express");
const { Sports, Players, Sessions } = require("./models");

const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const cookieParser = require("cookie-parser");
const csrf = require("tiny-csrf");

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("somesecretkey"));
app.use(csrf("NAA41FhDUQ6TgdADAO9fzPjKCqP9UwrY", ["POST", "PUT", "DELETE"]));

app.set("view engine", "ejs");

app.use(
  session({
    secret: "my-secret-key-NAA41FhDUQ6TgdADAO9fzPjKCqP9UwrY",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (username, password, done) => {
      try {
        const player = await Players.findOne({ where: { email: username } });
        console.log("Player found", player);
        if (!player) {
          return done(null, false, { message: "Incorrect username." });
        }
        if (player.password !== password) {
          return done(null, false, { message: "Incorrect password." });
        }
        return done(null, player);
      } catch (error) {
        return done(error);
      }
    }
  )
);

passport.serializeUser((player, done) => {
  console.log("Serializing user in session", player.id);
  done(null, player.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const player = await Players.findByPk(id);
    console.log("Deserializing user from session", player.id);
    done(null, player);
  } catch (error) {
    done(error);
  }
});

app.get("/", (req, res) => {
  res.render("index");
});

// ---- SPORTS ----

app.get("/sports/new", connectEnsureLogin.ensureLoggedIn(), (req, res) => {
  res.render("sports/new", { csrfToken: req.csrfToken() });
});

app.get("/sports", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  try {
    const sports = await Sports.getSports();
    if (req.headers.accept.includes("text/html")) {
      res.render("sports/all", { sports: sports });
    } else {
      res.json(sports);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get(
  "/sports/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
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
  }
);

app.get(
  "/sports/:id/edit",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      const sport = await Sports.findByPk(req.params.id);
      ejs.renderFile(
        "./views/sports/edit.ejs",
        { id: sport.id, name: sport.name, csrfToken: req.csrfToken() },
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
  }
);

app.get(
  "/sports/:id/delete",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      const sport = await Sports.findByPk(req.params.id);
      ejs.renderFile(
        "./views/sports/delete.ejs",
        { id: sport.id, name: sport.name, csrfToken: req.csrfToken() },
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
  }
);

app.post("/sports", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
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

app.put(
  "/sports/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      const sport = await Sports.findByPk(req.params.id);
      console.log(sport);
      await sport.updateSportName(req.body.name);
      res.json(sport);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.delete(
  "/sports/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      await Sports.deleteSport(req.params.id);
      res.json({ deleted: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// ---- PLAYERS/USERS ----

app.get("/signup", (req, res) => {
  res.render("signup", { csrfToken: req.csrfToken() });
});

app.post("/players", async (req, res) => {
  try {
    const newPlayer = await Players.addPlayer(
      req.body.name,
      req.body.email,
      req.body.password,
      "user"
    );

    console.log(newPlayer);

    if (req.headers.accept.includes("text/html")) {
      req.login(newPlayer, (err) => {
        if (err) {
          return res.status(422).json({ error: err });
        }
        res.redirect("/");
      });
    } else {
      res.json(newPlayer);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/login", (req, res) => {
  res.render("login", { csrfToken: req.csrfToken() });
});

app.get("/signout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
  }),
  (req, res) => {
    console.log("user: ", req.user);
    res.redirect("/");
  }
);

// ----- SESSIONS -----

app.get(
  "/sports/:id/sessions/new",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      const sport = await Sports.findByPk(req.params.id);
      res.render("sessions/new", {
        sportId: sport.id,
        sportName: sport.name,
        csrfToken: req.csrfToken(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.post("/sessions", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  try {
    const newSession = await Sessions.addSession(
      req.body.date,
      req.body.time,
      req.body.venue,
      req.body.playerCount,
      req.body.createdBy, // TODO: get the id from userSession
      req.body.sportId,
      req.body.players
    );

    if (req.headers.accept.includes("text/html")) {
      res.redirect("/");
    } else {
      res.json(newSession);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
