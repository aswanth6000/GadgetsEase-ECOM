const express = require('express')
const app = express();
const mongoose = require('mongoose')
const session = require('express-session')

app.set('view engine', 'ejs')
app.use(express.static(__dirname + "/public"))
app.use(express.json())
app.use(express.urlencoded({extended : true}))
app.use(session({
    secret: 'your_session_secret',
    resave: false,
    saveUninitialized: true
  }));

app.use(require('./routes/user routes/login'))
app.use(require('./routes/user routes/userhome'))
app.use(require('./routes/user routes/product'))
app.use(require('./routes/user routes/checkout'))
app.use(require('./routes/admin routes/admin-routes'))
app.use(require('./routes/user routes/signup'))





// Server


const PORT = process.env.PORT || 8000;
app.listen(PORT, ()=>{
    console.log(`server running on ${PORT}`);
})







// Database 


mongoose.connect('mongodb://localhost:27017/GadgetsEaseUser',{
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection;
db.on('error',console.error.bind(console,'connection error'))
db.once('open',()=>{
    console.log("Database connected");
})