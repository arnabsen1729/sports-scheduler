"use strict";
const { Model } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Sessions extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sessions.belongsTo(models.Players, {
        foreignKey: "createdBy",
        as: "creator",
      });

      Sessions.belongsTo(models.Sports, {
        foreignKey: "sportId",
        as: "sport",
      });

      Sessions.belongsToMany(models.Players, {
        through: "SessionPlayers",
        foreignKey: "SessionId",
        as: "players",
      });
    }

    static async getSessionById(id) {
      const session = await Sessions.findByPk(id, {
        include: [
          {
            model: sequelize.models.Players,
            as: "players",
          },
          {
            model: sequelize.models.Players,
            as: "creator",
          },
          {
            model: sequelize.models.Sports,
            as: "sport",
          },
        ],
      });

      return session;
    }

    static async getSessions() {
      const sessions = await Sessions.findAll();
      return sessions;
    }

    static async addSession(
      date,
      time,
      venue,
      playerCount,
      createdBy,
      sportId,
      players
    ) {
      const newSession = await Sessions.create({
        date: date,
        time: time,
        venue: venue,
        playerCount: playerCount,
        createdBy: createdBy,
        sportId: sportId,
      });

      const sessionPlayers = players.map((player) => {
        return {
          SessionId: newSession.id,
          PlayerId: player,
        };
      });

      await sequelize.models.SessionPlayers.bulkCreate(sessionPlayers);

      return newSession;
    }

    static async deleteSession(id) {
      const session = await Sessions.findByPk(id);
      await session.destroy();
    }

    async updateSession(date, time, venue, playerCount, players) {
      this.update({
        date: date,
        time: time,
        venue: venue,
        playerCount: playerCount,
      });

      const sessionPlayers = players.map((player) => {
        return {
          SessionId: this.id,
          PlayerId: player,
        };
      });

      await sequelize.models.SessionPlayers.destroy({
        where: {
          SessionId: this.id,
        },
      });

      await sequelize.models.SessionPlayers.bulkCreate(sessionPlayers);

      return this;
    }

    async addPlayer(playerId) {
      await sequelize.models.SessionPlayers.create({
        SessionId: this.id,
        PlayerId: playerId,
      });

      return this;
    }

    async removePlayer(playerId) {
      await sequelize.models.SessionPlayers.destroy({
        where: {
          SessionId: this.id,
          PlayerId: playerId,
        },
      });

      return this;
    }

    static async getSessionCountsBySport() {
      const sessionCounts = await Sessions.findAll({
        attributes: [[sequelize.literal("COUNT(*)"), "sessionCount"]],
        include: [
          {
            model: sequelize.models.Sports,
            as: "sport",
            attributes: ["name"],
          },
        ],
        group: ["sport.id", "sport.name"],
      });

      const sessionCountsBySport = {};
      sessionCounts.forEach((session) => {
        sessionCountsBySport[session.sport.name] = parseInt(
          session.get("sessionCount")
        );
      });

      return sessionCountsBySport;
    }

    static async getPlayerCountsBySport() {
      // Build the main query
      const query = `
WITH session_counts AS (
  SELECT s."sportId", sp."SessionId", COUNT(sp."PlayerId") AS playerCount
  FROM "SessionPlayers" sp
  JOIN "Sessions" s ON sp."SessionId" = s.id
  GROUP BY s."sportId", sp."SessionId"
)
SELECT sc."sportId", SUM(sc.playerCount) AS totalPlayerCount, sp.name AS sportName
FROM session_counts sc
JOIN "Sports" sp ON sc."sportId" = sp.id
GROUP BY sc."sportId", sp.name;
`;

      // Execute the query
      const res = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
      });
      return res.map((row) => {
        return {
          sportId: row.sportId,
          totalplayercount: parseInt(row.totalplayercount),
          sportname: row.sportname,
        };
      });
    }

    static async getMostPopularSport() {
      const playerCounts = await Sessions.getPlayerCountsBySport();

      let mostPopularSport = null;
      let mostPopularSportCount = 0;
      playerCounts.forEach((playerCount) => {
        if (playerCount.totalplayercount > mostPopularSportCount) {
          mostPopularSport = playerCount.sportname;
          mostPopularSportCount = playerCount.totalplayercount;
        }
      });

      return mostPopularSport;
    }

    static async getMostPlayersInSession() {
      const query = `
      SELECT s."id", COUNT(sp."PlayerId") AS playerCount
FROM "Sessions" s
JOIN "SessionPlayers" sp ON s."id" = sp."SessionId"
GROUP BY s."id"
ORDER BY playerCount DESC
LIMIT 1;`;

      const res = await sequelize.query(query, {
        type: sequelize.QueryTypes.SELECT,
      });

      return parseInt(res[0].playercount);
    }

    static async getUserWithMostCreatedSessions() {
      const userSessions = await Sessions.findAll({
        attributes: [
          "createdBy",
          [sequelize.fn("COUNT", sequelize.col("id")), "sessionCount"],
        ],
        group: "createdBy",
        order: [["sessionCount", "DESC"]],
        limit: 1,
      });

      if (userSessions.length > 0) {
        const { createdBy, sessionCount } = userSessions[0].get();
        const user = await sequelize.models.Players.findByPk(createdBy);
        return {
          user: user.get().name,
          sessionCount,
        };
      }
      return null;
    }

    static async getTotalSessions() {
      const totalSessions = await Sessions.count();
      return totalSessions;
    }
  }
  Sessions.init(
    {
      date: DataTypes.DATE,
      time: DataTypes.TIME,
      venue: DataTypes.STRING,
      playerCount: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Sessions",
    }
  );
  return Sessions;
};
