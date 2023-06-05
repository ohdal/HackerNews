import Router from "./core/router";
import Store from "./store";
import { NewsFeedView, NewsDetailView } from "./page";

const store = new Store();

const router: Router = new Router();
const newsFeedView = new NewsFeedView("root", store);
const newsDetailView = new NewsDetailView("root", store);

router.setDefaultPage(newsFeedView);
router.addRoutePath("/page/", newsFeedView);
router.addRoutePath("/show/", newsDetailView);

router.route();