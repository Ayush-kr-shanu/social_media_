const express = require("express");
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")

const { UserModel } = require("../Models/User.model");

require("dotenv").config()
const userRoute = express.Router();

const redis=require("redis")
const redisClient=redis.createClient()

userRoute.get("/", async (req, res) => {
  try {
    const user = await UserModel.find();

    if (user.length === 0) {
      return res.status(404).send({ msg: "No users found" });
    }

    res.status(200).send(user);
  } catch (err) {
    res.status(400).send({ msg: "Internal server error", err: err.message });
  }
});

//adding the user
userRoute.post("/register", async(req,res)=>{
    try {
        const {name, email, password}=req.body

        const userExist=await UserModel.findOne({email})
        if(userExist){
            res.status(401).send({ msg: `This emailId ${email} is already registered` });
        }

        const salt=await bcrypt.genSalt(7)
        const hashed=await bcrypt.hash(password, salt)

        const user=new UserModel({name, email, password:hashed})

        user.save()

        res.status(201).send({msg:"User registered scuessfully", user})
    } catch (err) {
        res.status(500).send({ msg: "Error in registering user", err: err.message });
    }
})

//login route
userRoute.post("/login", async(req,res)=>{
    try {
        const {email, password}=req.body
        const user=await UserModel.findOne({email})
        if(!user){
            return res.status(401).send({msg: "Inavalid email or password"})
        }

        const matchedPass=await bcrypt.compare(password, user.password)
        if(!matchedPass){
            return res.status(401).send({msg: "Inavalid email or password"})
        }

        const acessToken=jwt.sign({userId:user._id}, process.env.JWT_CODE,{
            expiresIn:"1h"
        })

        res.status(200).send({msg:"Login sucessfull", acessToken, user:user})
    } catch (err) {
        res.status(500).send({ msg: "something went wrong in loggin", error: err.message });
    }
})

userRoute.get("/users/friends", async (req, res) => {
    try {
      const { user } = req;
  
      const authenticatedUser = await UserModel.findById(user._id).populate("friends", "name email profilePicture");
  
      if (!authenticatedUser) {
        return res.status(404).send({ msg: "User not found" });
      }
  
      res.send(authenticatedUser.friends);
    } catch (err) {
      res.status(500).send({ msg: "Internal Server Error", error: err.message });
    }
});

userRoute.post("/users/:id/friends", async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    const targetUser = await UserModel.findById(id);
    if (!targetUser) {
      return res.status(404).send({ msg: "User not found" });
    }

    const isAlreadyRequested = targetUser.friendRequests.includes(user._id);
    if (isAlreadyRequested) {
      return res.status(400).send({ error: "Friend request already sent" });
    }

    targetUser.friendRequests.push(user._id);
    await targetUser.save();

    res.send({ message: "Friend request sent successfully" });
  } catch (err) {
    res.status(500).send({ msg: "Internal Server Error", err: err.message });
  }
});

module.exports={userRoute}