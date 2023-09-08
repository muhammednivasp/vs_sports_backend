const express = require('express')
const app = express()
const mongoose = require('mongoose')
const cors = require('cors')
// const cookieparser = require('cookie-parser');
const userRoute = require('./routes/userRoute');
const clubRoute = require('./routes/clubRoute');
const adminRoute = require('./routes/adminRoute')

// const bodyParser = require('body-parser')

require('dotenv').config();

const port = process.env.PORT || 4000;

//port
app.listen(port, () => {
  console.log(`Server started on port ${port}`);
});

//database
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });
  console.log(process.env.BASE_URL);


app.use(
  
  cors({
    // origin: [`${process.env.BASE_URL}`,"https://vs-sports.netlify.app","http://localhost:5173"],
    origin: ["http://localhost:5173"],
    method: ["get", "post", "delete", "put", "patch"],
    credentials: true,
  })
)

// app.use(cookieparser())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
// app.use(bodyParser.urlencoded({ extended: false }));
app.use("/user", userRoute)
app.use("/club", clubRoute)
app.use("/admin", adminRoute)


  // app.get("/",(req,res)=>{
  //   res.send('hello world')
  //     })