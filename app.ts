// Union 타입을 사용해야하면 type alias 를 사용한다
// 그 이외에는 interface를 더 많이 사용하는 경향이 있다.
// interface는 사용법을 봤을때 글로써 표현하여(extends) 무슨일을 하는지 더 명확히 표현한다는 장점이 있다.

interface Store {
  currentPage: number;
  feed: NewsFeed[];
}

interface News {
  readonly id: Number;
  readonly time_ago: string;
  readonly title: string;
  readonly url: string;
  readonly user: string;
  readonly content: string;
}

interface NewsFeed extends News {
  readonly comments_count: number;
  readonly points: number;
  read?: boolean;
}

interface NewsDetail extends News {
  readonly comments: NewsComment[];
}

interface NewsComment extends News {
  readonly comments: NewsComment[];
  readonly level: number;
}

interface RouteInfo {
  path: string;
  page: View;
}

const container: HTMLElement | null = document.getElementById("root");

const NEWS_URL = "https://api.hnpwa.com/v0/news/1.json";
const CONTENT_URL = "https://api.hnpwa.com/v0/item/@id.json";

const store: Store = {
  currentPage: 1,
  feed: [],
};

// 기존의 extends라고 하는 방식의 상속 방법은 코드에 적시되어야 하는 상속 방법이다.
// 상속의 관계를 바꾸고 싶으면 코드 자체를 바꿔야 한다는 의미이다. (관계를 유연하게 가져갈 수 없다.)

// JS와 TS의 class extends 문법은 다중상속을 지원하지 않는다.
// 상위 class n개를 받을수 있게 만들어보자 !
// 아래 코드는 TS 공식 문서에서 제공하는 Mixin 관련 코드이며 Mixin을 구현하는 코드중 하나이다.
function applyApiMixins(targetClass: any, baseClass: any[]): void {
  baseClass.forEach((baseClass) => {
    Object.getOwnPropertyNames(baseClass.prototype).forEach((name) => {
      const descriptor = Object.getOwnPropertyDescriptor(
        baseClass.prototype,
        name
      );

      if (descriptor) {
        Object.defineProperty(targetClass.prototype, name, descriptor);
      }
    });
  });
}

class Test {
  protected printHello(): void {
    console.log("Hello");
  }
}

class Api {
  // Generic & protected
  protected getRequest<AjaxResponse>(url: string): AjaxResponse {
    const ajax = new XMLHttpRequest();
    ajax.open("GET", url, false);
    ajax.send();

    return JSON.parse(ajax.response);
  }
}

class NewsFeedApi {
  getData(): NewsFeed[] {
    this.printHello();
    return this.getRequest<NewsFeed[]>(NEWS_URL);
  }
}

class NewsDetailApi {
  getData(id: string): NewsDetail {
    return this.getRequest<NewsDetail>(CONTENT_URL.replace("@id", id));
  }
}

// TS 컴파일러에게 Api class를 내부적으론 합성한다는 사실을 알려주기 위해 interface를 작성한다.
interface NewsFeedApi extends Api, Test {}
interface NewsDetailApi extends Api {}

applyApiMixins(NewsFeedApi, [Api, Test]);
applyApiMixins(NewsDetailApi, [Api]);

class Router {
  private routeTable: RouteInfo[];
  private defaultRoute: RouteInfo | null;

  constructor() {
    const routePath = location.hash;
    const pathList = routePath.split("/");

    window.addEventListener("hashchange", this.route.bind(this));

    this.routeTable = [];
    this.defaultRoute = null;
  }

  setDefaultPage(page: View): void {
    this.defaultRoute = { path: "", page };
  }

  addRoutePath(path: string, page: View): void {
    this.routeTable.push({ path, page });
  }

  route(): void {
    const routePath = location.hash;

    if (routePath === "" && this.defaultRoute) {
      this.defaultRoute.page.render();
    } else {
      for (const routeInfo of this.routeTable) {
        if (routePath.indexOf(routeInfo.path) >= 0) {
          routeInfo.page.render();
          break;
        }
      }
    }
  }
}

abstract class View {
  private template: string;
  private renderTemplate: string;
  private container: HTMLElement;
  private htmlList: string[];

  constructor(containerId: string, template: string) {
    const containerElement = document.getElementById(containerId);

    if (!containerElement) {
      throw "최상위 컨테이너가 없어 UI를 진행하지 못합니다.";
    }

    this.container = containerElement;
    this.template = template;
    this.renderTemplate = template;
    this.htmlList = [];
  }

  protected updateView(): void {
    this.container.innerHTML = this.renderTemplate;
    this.renderTemplate = this.template;
  }

  protected addHtml(htmlString: string): void {
    this.htmlList.push(htmlString);
  }

  protected getHtml(): string {
    const snapshot = this.htmlList.join("");
    this.clearHtmlList();

    return snapshot;
  }

  protected setTemplatedata(key: string, value: string): void {
    this.renderTemplate = this.renderTemplate.replace(`{{__${key}__}}`, value);
  }

  private clearHtmlList(): void {
    this.htmlList = [];
  }

  abstract render(): void; // 추상 메서드
}

class NewsFeedView extends View {
  private api: NewsFeedApi;
  private feeds: NewsFeed[];
  private totalPages: number;
  private pageSize: number;

  constructor(containerId: string) {
    let template = `
    <div class="bg-gray-600 min-h-screen">
    <div class="bg-white text-xl">
    <div class="mx-auto px-4">
    <div class="flex justify-between items-center py-6">
    <div class="flex justify-start">
    <h1 class="font-extrabold">Hacker News</h1>
    </div>
    <div class="item-center justify-end">
    {{__prev_page__}}
    {{__next_page__}}
    </div>
    </div>
    </div>
    </div>
    <div class="p-4 text-2xl text-gray-700">
    {{__news_feed__}}
    </div>
    </div>
    `;

    super(containerId, template);
    this.api = new NewsFeedApi();
    this.feeds = store.feed;
    this.totalPages = 1;
    this.pageSize = 10;

    if (this.feeds.length === 0) {
      store.feed = this.feeds = this.api.getData();
      this.makeFeeds();
    }

    this.totalPages =
      Math.floor(this.feeds.length / this.pageSize) +
      (this.feeds.length % this.pageSize > 0 ? 1 : 0);
  }

  render() {
    store.currentPage = Number(location.hash.substring(7)) || 1;
    let page = store.currentPage - 1;

    for (let i = page * this.pageSize; i < (page + 1) * this.pageSize; i++) {
      const { id, title, comments_count, user, points, time_ago, read } = this.feeds[i];
      this.addHtml(`
      <div class="p-6 ${
        read ? "bg-red" : "bg-white"
      } mt-6 rounded-lg shadow-md transition-colors duration-500 hover:bg-green-100">
      <div class="flex">
      <div class="flex-auto">
      <a href="#/show/${id}">${title}</a>
          </div>
          <div class="text-center text-sm">
            <div class="w-10 text-white bg-green-300 rounded-lg px-0 py-2">${comments_count}</div>
          </div>
        </div>
        <div class="flex mt-3">
          <div class="grid grid-cols-3 text-sm text-gray-500">
            <div><i class="fas fa-user mr-1"></i>${user}</div>
            <div><i class="fas fa-heart mr-1"></i>${points}</div>
            <div><i class="fas fa-clock mr-1"></i>${time_ago}</div>
          </div>
        </div>
      </div>
      `);
    }

    this.setTemplatedata("news_feed", this.getHtml());
    this.setTemplatedata(
      "prev_page",
      `<a href="#/page/${store.currentPage - 1}" class="${
        store.currentPage > 1
          ? "text-gray-500"
          : "pointer-events-none text-gray-200"
      }">Previous</a>`
    );
    this.setTemplatedata(
      "next_page",
      `<a href="#/page/${store.currentPage + 1}" class="ml-4 ${
        store.currentPage < this.totalPages
          ? "text-gray-500"
          : "pointer-events-none text-gray-200"
      }">Next</a>`
    );

    this.updateView();
  }

  private makeFeeds(): void {
    for (let i = 0; i < this.feeds.length; i++) {
      this.feeds[i].read = false;
    }
  }
}

class NewsDetailView extends View {
  private api: NewsDetailApi;

  constructor(containerId: string) {
    let template = `
    <div class="bg-gray-600 min-h-screen">
      <div class="bg-white text-xl">
        <div class="mx-auto px-4">
          <div class="flex justify-between items-center py-6">
            <div class="flex justify-start">
              <h1 class="font-extrabold">Hacker News</h1>
            </div>
            <div class="item-center justify-end">
              <a href="#/page/{{__current_page__}}" class="text-gray-500">
                <i class="fa fa-times"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="h-full border rounded-xl bg-white m-6 p-4">
        <h2>{{__title__}}</h2>
        <div class="text-gray-400 h-20">
          {{__content__}}
        </div>

        {{__comments__}}

      </div>
    </div>
  `;

    super(containerId, template);

    this.api = new NewsDetailApi();
  }

  render() {
    const id = location.hash.substring(7);
    const newsContent = this.api.getData(id);

    for (let i = 0; i < store.feed.length; i++) {
      if (store.feed[i].id === Number(id)) {
        store.feed[i].read = true;
        break;
      }
    }

    this.setTemplatedata("comments", this.makeComment(newsContent.comments));
    this.setTemplatedata("current_page", String(store.currentPage));
    this.setTemplatedata("title", newsContent.title);
    this.setTemplatedata("content", newsContent.content);

    this.updateView();
  }

  private makeComment(comments: NewsComment[]): string {
    for (let i = 0; i < comments.length; i++) {
      const comment: NewsComment = comments[i];
      this.addHtml(`
        <div style="padding-left: ${comment.level * 40}px;" class="mt-4">
           <div class="text-gray-400">
            <i class="fa fa-sort-up mr-2"></i>
            <strong>${comment.user}</strong> ${comment.time_ago}
          </div>
          <p class="text-gray-700">${comment.content}</p>
        </div>
      `);

      if (comment.comments.length > 0) {
        this.addHtml(this.makeComment(comment.comments));
      }
    }

    return this.getHtml();
  }
}

const router: Router = new Router();
const newsFeedView = new NewsFeedView("root");
const newsDetailView = new NewsDetailView("root");

router.setDefaultPage(newsFeedView);
router.addRoutePath("/page/", newsFeedView);
router.addRoutePath("/show/", newsDetailView);

router.route();
