import { Router, type IRouter } from "express";
import healthRouter    from "./health";
import supportRouter   from "./support";
import authRouter      from "./auth";
import guildRouter     from "./guild";
import playlistsRouter from "./playlists";
import activityRouter  from "./activity";

const router: IRouter = Router();

router.use(healthRouter);
router.use(supportRouter);
router.use(authRouter);
router.use(guildRouter);
router.use(playlistsRouter);
router.use(activityRouter);

export default router;
