import express from "express";
import { registerView, createComment, deleteComment, editComment } from '../controllers/videoController';
import { protectorMiddleware } from '../middlewares';

const apiRouter = express.Router();

apiRouter.post("/videos/:id([0-9a-f]{24})/view", registerView);
apiRouter.post("/videos/:id([0-9a-f]{24})/comment", protectorMiddleware, createComment);
apiRouter.delete("/videos/:videoId([0-9a-f]{24})/comment/delete", protectorMiddleware, deleteComment);
apiRouter.put("/videos/:videoId([0-9a-f]{24})/comment/edit", protectorMiddleware, editComment);

export default apiRouter;