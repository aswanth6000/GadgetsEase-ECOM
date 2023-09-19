const express = require('express')
const app = express();
const mongoose = require('mongoose')
const session = require('express-session')
const nocache = require('nocache')
const http = require('http')
const server = http.createServer(app);
require('dotenv').config();
app.set('view engine', 'ejs')

app.use(express.static(__dirname + "/public"))
app.use(nocache())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(session({
    secret: 'your_session_secret',
    resave: false,
    saveUninitialized: true,
    
}));

app.use(require('./routes/user routes/userhome'))
app.use(require('./routes/user routes/product'))
app.use(require('./routes/user routes/checkout'))
app.use(require('./routes/admin routes/admin-routes'))
app.use(require('./routes/user routes/userAuthRoutes'))


// Server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server running on ${PORT}`);
});

// Database
const dbUrl = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`; 
mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error'))
db.once('open', () => {
    console.log("Database connected");
});