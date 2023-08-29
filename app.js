const express = require('express')
const app = express();
const mongoose = require('mongoose')

app.set('view engine', 'ejs')
app.use(express.static(__dirname + "/public"))

app.use(require('./routes/user routes/login'))
app.use(require('./routes/user routes/userhome'))
app.use(require('./routes/user routes/product'))
app.use(require('./routes/user routes/checkout'))
app.use(require('./routes/admin routes/admin-home'))


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