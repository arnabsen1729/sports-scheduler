"use strict";
const { Model, Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Sports extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sports.hasMany(models.Sessions, {
        foreignKey: "sportId",
        as: "sessions",
      });
    }

    static async getSports() {
      const sports = await Sports.findAll();
      return sports;
    }

    static async addSport(sportName) {
      const newSport = await Sports.create({ name: sportName });
      return newSport;
    }

    updateSportName(sportName) {
      return this.update({ name: sportName });
    }

    static async deleteSport(sportId) {
      const sport = await Sports.findByPk(sportId);
      await sport.destroy();
    }

    async getUpcomingSessions() {
      const sessions = await this.getSessions({
        where: {
          date: {
            [Op.gte]: new Date(),
          },
        },
      });
      return sessions;
    }

    async getPastSessions() {
      const sessions = await this.getSessions({
        where: {
          date: {
            [Op.lt]: new Date(),
          },
        },
      });
      return sessions;
    }
  }
  Sports.init(
    {
      name: DataTypes.STRING,
    },
    {
      sequelize,
      modelName: "Sports",
    }
  );
  return Sports;
};
