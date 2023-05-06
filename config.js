const config = {
    MONGO_DB_URL:"mongodb://localhost:27017/chatlio",
    MONGO_DB_URL_DEBUG:"mongodb+srv://forbiddenrelationships:jPXgf5RgNM8H5Zdj@cluster0.t312spd.mongodb.net/?retryWrites=true&w=majority",
    PORT:process.env.PORT || 3300,
    PRIVATE_KEY:"56454743358713353",
    API_ROUTE:"api/",
    MIN_PASSWORD_LENGTH:6,
    AUTHORIZATION:"Bearer ",
    PROD:false,
    APP_NAME:"Chatlio Chat & Find Love",
    EMAIL: "forbiddenrelationships@gmail.com",
    AUTHOR:"Osman",
}
module.exports = config