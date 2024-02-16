const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const { Schema } = mongoose

mongoose.connect(process.env['db_url'])

const UserSchema = new Schema({
  username:String 
})
const User = mongoose.model('User', UserSchema)

const ExerciseSchema = new Schema({
  user_id:{ type:String, required : true },
  description:String,
  duration:Number,
  date:String 
})
const Exercice = mongoose.model('Exercice', ExerciseSchema)


app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.get("/api/users", async (req, res)=>{
  const users = await User.find({}).select("_id username")
  if(!users){
    console("there is no users")
  }else{
    res.json(users)
  }
                    
})
app.post('/api/users', async (req,res)=>{
  console.log(req.body)
  const userObj = new User({
    username:req.body.username
  })
  try{
    
  const user = await userObj.save()
  console.log(user)
    res.json(user)
  }catch(err){
    
    console.log(err)
    
  }
 
})

app.post("/api/users/:_id/exercises", async (req,res)=>{
  const id = req.params._id
  const {description, duration, date} = req.body
  try{
    const user = await User.findById(id)
    if(!user){
      res.send("could not find user")
    }else {
      const exerciceObj = new Exercice({
        user_id:id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      })
      const exercice = await exerciceObj.save()
      res.json({
        id:user._id,
        username:user.username,
        description:exercice.description,
        duration:exercice.duration,
        date:new Date(exercice.date).toDateString()
      })
    }
  }catch(err){
    
    console.log(err)
    res.send("error saving the exercice ")
    
  }
  
})

 app.get( "/api/users/:_id/logs", async (req,res)=>{
   const {from, to, limit} = req.query
   const id = req.params._id
   const user = await User.findById(id)
   if(!user){
     res.send("error no user")
     return;
     
   }
   let dateObj = {}
   if(from){
     dateObj["$gte"] = new Date(from)
   }
   if(to){
     dateObj["$lte"] = new Date(to)
   }
   let filter = {
     user_id:id
   }
   if(from || to){
     filter.date = dateObj
   }
   const exercices = await Exercice.find(filter).limit(+limit ?? 500)  
   const log = exercices.map(e =>({
    description: e.description,
     duration: e.duration,
     date: e.date.toDateString()
   }))
   res.json({
     username:user.username,
     count:exercices.length,
     _id:user._id,
     log
   })
   
 })

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
