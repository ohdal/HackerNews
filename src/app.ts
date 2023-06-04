import Router from "./core/router";
import { Store } from "./types";
import { NewsFeedView, NewsDetailView } from "./page";

const store: Store = {
  currentPage: 1,
  feed: [],
};

// TS는 아래와같이 window에 속성을 추가해야한다.
declare global {
  interface Window {
    store: Store;
  }
}

const router: Router = new Router();
const newsFeedView = new NewsFeedView("root");
const newsDetailView = new NewsDetailView("root");

router.setDefaultPage(newsFeedView);
router.addRoutePath("/page/", newsFeedView);
router.addRoutePath("/show/", newsDetailView);

router.route();