const db = require("../models/index.js");

(async () => {
  try {
    // const allSports = await db.Sports.getSports();
    // console.log(allSports);
    // const newSport = await db.Sports.addSport("Test Sport");
    // console.log(newSport);
    // const allSports2 = await db.Sports.getSports();
    // console.log(allSports2);
    // id: 6, Test Sport
    // const players = await db.Players.getPlayers();
    // console.log(" ====  CURRENT PLAYERS ===");
    // console.log(players);
    // const newPlayer = await db.Players.addPlayer(
    //   "Test Player 2",
    //   "testplayer2@email.com",
    //   "password",
    //   "user"
    // );
    // console.log(" ====  NEW PLAYER ===");
    // console.log(newPlayer);
    // get date in yyyy-mm-dd format
    // const date = new Date().toISOString().slice(0, 10);
    // // get time
    // const time = new Date().toLocaleTimeString("en-US");
    // const session = await db.Sessions.addSession(
    //   date,
    //   time,
    //   "local",
    //   10,
    //   1,
    //   6,
    //   [1, 2]
    // );
    // console.log(" ====  NEW SESSION ===");
    // console.log(session);

    // const session = await db.Sessions.findByPk(3);
    // const players = await session.getPlayers();
    // console.log(players);

    const player = await db.Players.findByPk(8);
    const sessions = await player.getUpcomingSessions();
    console.log(sessions.map((session) => session.toJSON()));

    // console.log(session);

    // get all players in a S
  } catch (error) {
    console.log(error);
  }
})();
