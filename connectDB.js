const { Sequelize } = require("sequelize");

const database = "mydatabase";
const username = "myuser";
const password = "mysecretpassword";
const sequelize = new Sequelize(database, username, password, {
  host: "localhost",
  dialect: "postgres",
});

const connect = async () => {
  return sequelize.authenticate();
};

module.exports = {
  connect,
  sequelize,
};
