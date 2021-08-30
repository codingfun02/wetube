import User from '../models/User';
import Video from "../models/Video";
import Comment from "../models/Comment";

export const home = async (req, res) => {
  const videos = await Video.find({}).sort().populate("owner");
  return res.render("videos/home", {pageTitle: "Home", videos});
};

export const watch = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id).populate("owner").populate("comments");
  if (!video) {
    return res.status(404).render("404", {pageTitle: "Video not found."});
  }
  return res.render("videos/watch", {pageTitle: video.title, video});
};

export const getEdit = async (req, res) => {
  const { id } = req.params;
  const video = await Video.findById(id);
  if (!video) {
    return res.status(404).render("404", {pageTitle: "Video not found."});
  }
  return res.render("videos/edit", {pageTitle: `Edit: ${video.title}`, video}); 
};

export const postEdit = async (req, res) => {
  const { id } = req.params;
  const {user: {_id}} = req.session;
  const {title, description, hashtags} = req.body;
  const video = await Video.findById(id);
  if (!video) {
    return res.render("404", {pageTitle: "Video not found."});
  }
  await Video.findByIdAndUpdate(id, {
    title,
    description,
    hashtags: Video.formatHashtags(hashtags)
  });
  req.flash("success", "Changes saved")
  return res.redirect(`/videos/${id}`);
};

export const getUpload = (req, res) => {
  return res.render("videos/upload", {pageTitle: "Upload Video"});
};

export const postUpload = async (req, res) => {
  const {user: {_id}} = req.session;
  console.log(req.files);
  const {video, thumb} = req.files;
  const {title, description, hashtags} = req.body;
  try {
    const newVideo = await Video.create({
      title,
      description,
      fileUrl: video[0].path,
      thumbUrl: thumb[0].path,
      owner: _id,
      hashtags: Video.formatHashtags(hashtags)
    });
    const user = await User.findById(_id);
    user.videos.push(newVideo._id);
    user.save();
    return res.redirect("/");
  } catch(error) {
    req.flash("error", error._message)
    return res.status(400).redirect("/videos/upload");
  }
};

export const deleteVideo = async (req, res) => {
  const {user: {_id}} = req.session;
  const { id } = req.params;
  const video = await Video.exists({_id: id});
  if (!video) {
    console.log("1");
    return res.status(404).render("404", {pageTitle: "Video not found."});
  }
  await Video.findByIdAndDelete(id);
  return res.redirect("/");
};

export const search = async (req, res) => {
  const { keyword } = req.query;
  let videos = [];
  if (keyword) {
    videos = await Video.find({
      title: {
        $regex: new RegExp(`${keyword}`, "i"),
      },
    }).populate("owner");
  }
  return res.render("videos/search", { pageTitle: "Search", videos });
};

export const registerView = async (req, res) => {
  const {id} = req.params;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  video.meta.views += 1;
  await video.save();
  return res.sendStatus(200);
}

export const createComment = async (req, res) => {
  const {
    session: {user},
    body: {text},
    params: {id}
  } = req;
  const video = await Video.findById(id);
  if (!video) {
    return res.sendStatus(404);
  }
  const comment = await Comment.create({
    text,
    owner: user._id,
    video: id
  });
  video.comments.push(comment._id);
  await video.save();
  return res.status(201).json({newCommentId: comment._id});
};

export const deleteComment = async (req, res) => {
  const {
    body: {commentId},
    params: {videoId}
  } = req;
  const video = await Video.findById(videoId);
  if (!video) {
    return res.sendStatus(404);
  }
  await Comment.findByIdAndDelete(commentId);
  const index = video.comments.findIndex((element) => String(element) === commentId);
  video.comments.splice(index, 1);
  await video.save();
  return res.sendStatus(200);
};

export const editComment = async (req, res) => {
  const {
    body: {commentId, changedText},
    params: {videoId}
  } = req;
  const video = await Video.findById(videoId);
  if (!video) {
    return res.sendStatus(404);
  }
  await Comment.findByIdAndUpdate(commentId, {
    text: changedText
  });
  return res.sendStatus(200);
};