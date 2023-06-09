const express = require("express");
const { Sports, Players, Sessions } = require("./models");

const app = express();
const bodyParser = require("body-parser");
const ejs = require("ejs");
const cookieParser = require("cookie-parser");
const csrf = require("tiny-csrf");

const bcrypt = require("bcrypt");
const flash = require("connect-flash");
const path = require("path");

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");

const saltRounds = 10;

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("somesecretkey"));
app.use(csrf("NAA41FhDUQ6TgdADAO9fzPjKCqP9UwrY", ["POST", "PUT", "DELETE"]));
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");

app.use(
  session({
    secret: "my-secret-key-NAA41FhDUQ6TgdADAO9fzPjKCqP9UwrY",
    cookie: {
      maxAge: 24 * 60 * 60 * 10000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.serializeUser((player, done) => {
  done(null, player.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const player = await Players.findByPk(id);
    done(null, player);
  } catch (error) {
    done(error);
  }
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      console.log("Local strategy callback, username: ", username);
      Players.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (!result) {
            return done(null, false, { message: "Invalid password" });
          }
          return done(null, user);
        })
        .catch((err) => {
          console.log(err);
          return done(null, false, { message: "Invalid email" });
        });
    }
  )
);

function requireAdmin(req, res, next) {
  if (req.user && req.user.role === "admin") {
    return next();
  } else {
    res.redirect("/home");
  }
}

app.get("/", (req, res) => {
  if (req.user) {
    res.redirect("/home");
  } else {
    res.render("index");
  }
});

// ---- SPORTS ----

app.get("/home", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  try {
    const sports = await Sports.getSports();
    const upcommingSessions = await req.user.getUpcomingSessions();
    const isAdmin = req.user.role === "admin";
    res.render("home.ejs", {
      sports: sports,
      username: req.user.name,
      upcommingSessions: upcommingSessions,
      isAdmin: isAdmin,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/sports/new", requireAdmin, (req, res) => {
  res.render("sports/new", {
    username: req.user.name,
    csrfToken: req.csrfToken(),
  });
});

app.get(
  "/sports/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      const sport = await Sports.findByPk(req.params.id);
      const upcommingSessions = await sport.getUpcomingSessions();
      const pastSessions = await sport.getPastSessions();

      const isAdmin = req.user.role === "admin";

      ejs.renderFile(
        "./views/sports/index.ejs",
        {
          id: sport.id,
          name: sport.name,
          upcommingSessions,
          pastSessions,
          isAdmin,
          username: req.user.name,
          csrfToken: req.csrfToken(),
        },
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

app.get("/sports/:id/edit", requireAdmin, async (req, res) => {
  try {
    const sport = await Sports.findByPk(req.params.id);
    ejs.renderFile(
      "./views/sports/edit.ejs",
      {
        id: sport.id,
        name: sport.name,
        username: req.user.name,
        csrfToken: req.csrfToken(),
      },
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

app.post("/sports", requireAdmin, async (req, res) => {
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

app.put("/sports/:id", requireAdmin, async (req, res) => {
  try {
    const sport = await Sports.findByPk(req.params.id);
    console.log(sport);
    await sport.updateSportName(req.body.name);
    res.json(sport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/sports/:id", requireAdmin, async (req, res) => {
  try {
    await Sports.deleteSport(req.params.id);
    res.json({ deleted: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ---- PLAYERS/USERS ----

app.get("/signup", (req, res) => {
  if (req.user) {
    return res.redirect("/home");
  }

  res.render("signup", { csrfToken: req.csrfToken() });
});

app.post("/players", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, saltRounds);
    const newPlayer = await Players.addPlayer(
      req.body.name,
      req.body.email,
      hashedPassword,
      "user"
    );

    req.login(newPlayer, (err) => {
      if (err) {
        return res.status(422).json({ error: err });
      }
      res.redirect("/home");
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/login", (req, res) => {
  if (req.user) {
    return res.redirect("/home");
  }
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
    failureFlash: true,
  }),
  (req, res) => {
    res.redirect("/home");
  }
);

// ----- SESSIONS -----

app.get(
  "/sports/:id/sessions/new",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      const sport = await Sports.findByPk(req.params.id);
      const players = await Players.findAll();
      res.render("sessions/new", {
        sportId: sport.id,
        sportName: sport.name,
        userId: req.user.id,
        username: req.user.name,
        players,
        csrfToken: req.csrfToken(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.get(
  "/sessions/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      const session = await Sessions.getSessionById(req.params.id);
      const isCreator = session.createdBy === req.user.id;
      const alreadyJoined = session.players.some(
        (player) => player.id === req.user.id
      );

      res.render("sessions/index", {
        sportName: session.sport.name,
        sessionId: session.id,
        sessionDate: session.date,
        sessionTime: session.time,
        sessionVenue: session.venue,
        players: session.players,
        playerCount: session.playerCount,
        createdBy: session.createdBy,
        username: req.user.name,
        isCreator,
        alreadyJoined,
        csrfToken: req.csrfToken(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.get(
  "/sessions/:id/edit",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      const session = await Sessions.getSessionById(req.params.id);

      if (session.createdBy !== req.user.id) {
        return res.redirect("/home");
      }

      const selectedPlayers = session.players;
      const players = await Players.findAll();
      const unselectedPlayers = players.filter(
        (player) =>
          !selectedPlayers.some(
            (selectedPlayer) => selectedPlayer.id === player.id
          )
      );

      res.render("sessions/edit", {
        sportName: session.sport.name,
        sportId: session.sport.id,
        sessionId: session.id,
        sessionDate: session.date,
        sessionTime: session.time,
        sessionVenue: session.venue,
        selectedPlayers,
        unselectedPlayers,
        playerCount: session.playerCount,
        createdBy: session.createdBy,
        username: req.user.name,
        csrfToken: req.csrfToken(),
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.put(
  "/sessions/:id/join",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      const session = await Sessions.getSessionById(req.params.id);
      await session.addPlayer(req.user.id);

      res.json({ joined: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.put(
  "/sessions/:id/leave",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      const session = await Sessions.getSessionById(req.params.id);
      await session.removePlayer(req.user.id);

      res.json({ joined: false });
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
      req.user.id,
      req.body.sportId,
      req.body.playerIds
    );

    res.json(newSession);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put(
  "/sessions/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      const session = await Sessions.findByPk(req.params.id);
      if (session.createdBy !== req.user.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const updatedSession = await session.updateSession(
        req.body.date,
        req.body.time,
        req.body.venue,
        req.body.playerCount,
        req.body.playerIds
      );

      res.json(updatedSession);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.delete(
  "/sessions/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    console.log("Trying to delete session");
    try {
      // check if the user is the creator of the session
      const session = await Sessions.findByPk(req.params.id);
      if (session.createdBy !== req.user.id) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      await Sessions.deleteSession(req.params.id);
      res.json({ deleted: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

app.listen(3000, () => {
  console.log("Server is listening on port 3000");
});
