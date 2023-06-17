const express=require("express")
const { Connection } = require("mongoose")
const { userRoute } = require("./Routes/User.routes")

const app=express()

app.use(express.json())

app.get("/", (req,res)=>{
    res.send("Welcome to TekBook Server")
})


app.use("/api",userRoute)


app.listen(4500, async()=>{
    try {
        await Connection
        console.log("Database Connected");
    } catch (err) {
        console.log(err);
    }
    console.log("Port is Running");
})