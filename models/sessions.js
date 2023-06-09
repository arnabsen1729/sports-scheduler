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
