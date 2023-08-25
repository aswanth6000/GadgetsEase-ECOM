const express = require('express')
const app = express();

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