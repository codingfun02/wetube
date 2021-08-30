import fetch from "node-fetch";
import bcrypt from "bcrypt";
import User from "../models/User";
import Video from '../models/Video';

export const getJoin = (req, res) => res.render("users/join", {pageTitle: "Join"});

export const postJoin = async (req, res) => {
  const {name, username, email, password, password2, location} = req.body;
  const pageTitle = "Join";
  if(password !== password2) {
    req.flash("error", "Password confirmation does not match");
    return res.status(400).render("users/join", {
      pageTitle
    });
  }
  const exists = await User.exists({$or: [{username}, {email}]});
  if(exists) {
    req.flash("error", "This email/password is alreay taken");
    return res.status(400).redirect("/join");
  }
  try {
    await User.create({
      name,
      avatarUrl: "",
      username,
      email,
      password,
      location
    });
  } catch(error) {
    req.flash("error", error._message);
    return res.status(400).redirect("/join");
  }
  res.redirect("/login");
};

export const getLogin = (req, res) => res.render("users/login", {pageTitle: "Login"});

export const postLogin = async (req, res) => {
  const {username, password} = req.body;
  const pageTitle = "Login";
  const user = await User.findOne({username, socialOnly: false});
  if(!user) {
    req.flash("error", "This account does not exists");
    return res.status(400).redirect("/login");
  }
  const ok = await bcrypt.compare(password, user.password);
  if(!ok) {
    req.flash("error", "Wrong password");
    return res.status(400).redirect("/login");
  }
  req.session.loggedIn = true;
  req.session.user = user;
  return res.redirect("/");
};

export const logout = (req, res) => {
  req.session.destroy();
  return res.redirect("/");
};

export const see = async (req, res) => {
  const {id} = req.params;
  const user = await User.findById(id).populate({
    path: "videos",
    populate: {
      path: "owner",
      model: "User"
    }
  });
  user.videos.sort((a, b) => {
    if (a > b) return 1;
    else if (a === b) return 0;
    else if (a < b) return -1;
  });
  if (!user) {
    req.flash("error", "User not found");
    return res.status(404).render("404");
  }
  return res.render("users/profile", {pageTitle: user.name, user})
};

export const startGithubLogin = (req, res) => {
  const baseUrl = "https://github.com/login/oauth/authorize";
  const config = {
    client_id: process.env.GH_CLIENT,
    allow_signup: false,
    scope: "read:user user:email"
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  return res.redirect(finalUrl);
};

export const finishGithubLogin = async (req, res) => {
  const baseUrl = "https://github.com/login/oauth/access_token";
  const config = {
    client_id: process.env.GH_CLIENT,
    client_secret: process.env.GH_SECRET,
    code: req.query.code
  }
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  const tokenRequest = await (await fetch(finalUrl, {
    method: "POST",
    headers: {
      Accept: "application/json"
    }
  })).json();
  if ("access_token" in tokenRequest) {
    const {access_token} = tokenRequest;
    const apiUrl = "https://api.github.com"
    const userData = await(await fetch (`${apiUrl}/user`, {
      headers: {
        Authorization : `token ${access_token}`
      }
    })).json();
    const emailData = await(await fetch (`${apiUrl}/user/emails`, {
      headers: {
        Authorization : `token ${access_token}`
      }
    })).json();
    const emailObj = emailData.find(email => email.primary && email.verified);
    if (!emailObj) {
      return res.redirect("/login");
    }
    let user = await User.findOne({email: emailObj.email});
    if(!user) {
      user = await User.create({
        avatarUrl: userData.avatar_url,
        name: userData.name ? userData.name : "anonymous",
        username: userData.login,
        email: emailObj.email,
        password: "",
        socialOnly: true,
        location: userData.location
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
  } else {
    return res.redirect("/login");
  }
};

export const getEdit = (req, res) => {
  return res.render("users/edit-profile", {pageTitle: "Edit Profile"});
};

export const postEdit = async (req, res) => {
  const {
    session: {user: {_id, avatarUrl}},
    body: {name, email, username, location},
    file
  } = req;
  if (req.session.user.email !== email || req.session.user.username !== username) {
    const isDuplicated = await User.exists({$or: [{username}, {email}], _id: {$ne: _id}});
    console.log(isDuplicated);
    if(isDuplicated) {
      res.flash("error", "This email/username is already taken")
      return res.status(400).render("edit-profile", {
        pageTitle: "Edit Profile"
      });
    }
  }
  const updatedUser = await User.findByIdAndUpdate(_id, {
    avatarUrl: file ? file.path : avatarUrl,
    name,
    email,
    username,
    location
  }, {new: true});
  req.session.user = updatedUser;
  return res.redirect("/users/edit");
};

export const getChangePassword = (req, res) => {
  if (req.session.user.socialOnly) {
    return res.redirect("/");
  }
  return res.render("users/change-password", {pageTitle: "Change Password"});
};

export const postChangePassword = async (req, res) => {
  const {
    session: {user: {_id, password}},
    body: {oldPassword, newPassword, newPasswordConfirmation}
  } = req;
  const user = await User.findById(_id);
  const ok = await bcrypt.compare(oldPassword, user.password);
  if(!ok) {
    req.flash("error", "The old password is incorrect");
    return res.status(400).redirect("/users/edit");
  }
  if (newPassword !== newPasswordConfirmation) {
    req.flash("error", "The password does not match the confirmation");
    return res.status(400).redirect("/users/edit");
  }
  user.password = newPassword;
  await user.save();
  // send notification
  return res.redirect("/users/logout");
};