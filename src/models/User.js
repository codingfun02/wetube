import bcrypt from "bcrypt";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {type: String, required: true, unique: true},
  avatarUrl: String,
  socialOnly: {type:Boolean, default: false},
  username: {type: String, required: true, unique: true},
  password: String,
  name: String,
  location: String
});

//업뎉 할땐 적용 ❌
userSchema.pre("save", async function() {
  this.password = await bcrypt.hash(this.password, 5);
});

const User = mongoose.model('User', userSchema);
export default User;