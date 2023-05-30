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
  readonly url : string;
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

interface NewsComment extends News{
  readonly comments: NewsComment[];
  readonly level: number;
}

const container : HTMLElement | null = document.getElementById("root");

const NEWS_URL = "https://api.hnpwa.com/v0/news/1.json";
const CONTENT_URL = "https://api.hnpwa.com/v0/item/@id.json";

const store : Store = {
  currentPage: 1,
  feed: [],
};

const ajax : XMLHttpRequest = new XMLHttpRequest();

// Generic
const getData = <AjaxResponse>(url: string) : AjaxResponse => {
  ajax.open("GET", url, false);
  ajax.send();

  return JSON.parse(ajax.response);
};

function makeFeeds(feeds: NewsFeed[]) : NewsFeed[] {
  for (let i = 0; i < feeds.length; i++) {
    feeds[i].read = false;
  }

  return feeds;
}

function updateView(html: string): void {
  if(container) {
    container.innerHTML = html
  } else {
    console.error('최상위 컨테이너가 없어 UI를 표시하지 못합니다.');
  }
}

function newsFeed(): void {
  let newsFeed: NewsFeed[] = store.feed;
  const newsList = [];
  const pageSize = 10;
  let totalPages = 1;

  console.log(newsFeed)
  if (newsFeed.length === 0) {
    newsFeed = store.feed = makeFeeds(getData<NewsFeed[]>(NEWS_URL));
  }

  totalPages = Math.floor(newsFeed.length / pageSize) + (newsFeed.length % pageSize > 0 ? 1 : 0);

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

  let page = store.currentPage - 1;
  for (let i = page * pageSize; i < (page + 1) * pageSize; i++) {
    newsList.push(`
    <div class="p-6 ${
      newsFeed[i].read ? "bg-red" : "bg-white"
    } mt-6 rounded-lg shadow-md transition-colors duration-500 hover:bg-green-100">
      <div class="flex">
        <div class="flex-auto">
          <a href="#/show/${newsFeed[i].id}">${newsFeed[i].title}</a>
        </div>
        <div class="text-center text-sm">
          <div class="w-10 text-white bg-green-300 rounded-lg px-0 py-2">${
            newsFeed[i].comments_count
          }</div>
        </div>
      </div>
      <div class="flex mt-3">
        <div class="grid grid-cols-3 text-sm text-gray-500">
          <div><i class="fas fa-user mr-1"></i>${newsFeed[i].user}</div>
          <div><i class="fas fa-heart mr-1"></i>${newsFeed[i].points}</div>
          <div><i class="fas fa-clock mr-1"></i>${newsFeed[i].time_ago}</div>
        </div>
      </div>
    </div>
    `);
  }

  template = template.replace("{{__news_feed__}}", newsList.join(""));
  template = template.replace("{{__prev_page__}}",`<a href="#/page/${store.currentPage - 1}" class="${store.currentPage > 1 ? "text-gray-500" : "pointer-events-none text-gray-200"}">Previous</a>`);
  template = template.replace("{{__next_page__}}",`<a href="#/page/${store.currentPage + 1}" class="ml-4 ${store.currentPage < totalPages ? "text-gray-500" : "pointer-events-none text-gray-200"}">Next</a>`)

  updateView(template);
}

function newsDetail(): void {
  const id = location.hash.substring(7);
  const newsContent = getData<NewsDetail>(CONTENT_URL.replace("@id", id));

  let template = `
    <div class="bg-gray-600 min-h-screen">
      <div class="bg-white text-xl">
        <div class="mx-auto px-4">
          <div class="flex justify-between items-center py-6">
            <div class="flex justify-start">
              <h1 class="font-extrabold">Hacker News</h1>
            </div>
            <div class="item-center justify-end">
              <a href="#/page/${store.currentPage}" class="text-gray-500">
                <i class="fa fa-times"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="h-full border rounded-xl bg-white m-6 p-4">
        <h2>${newsContent.title}</h2>
        <div class="text-gray-400 h-20">
          ${newsContent.content}
        </div>

        {{__comments__}}

      </div>
    </div>
  `;

  for (let i = 0; i < store.feed.length; i++) {
    if (store.feed[i].id === Number(id)) {
      store.feed[i].read = true;
      break;
    }
  }


  updateView(template.replace(
    "{{__comments__}}",
    makeComment(newsContent.comments)
  ))
}


function makeComment(comments: NewsComment[]): string {
  const commentString = [];

  for (let i = 0; i < comments.length; i++) {
    const comment: NewsComment = comments[i];
    commentString.push(`
      <div style="padding-left: ${comment.level * 40}px;" class="mt-4">
         <div class="text-gray-400">
          <i class="fa fa-sort-up mr-2"></i>
          <strong>${comment.user}</strong> ${comment.time_ago}
        </div>
        <p class="text-gray-700">${comment.content}</p>
      </div>
    `);

    if (comment.comments.length > 0) {
      commentString.push(makeComment(comment.comments));
    }
  }

  return commentString.join("");
}
function router(): void {
  const routePath = location.hash;
  const pathList = routePath.split("/");

  if (routePath) {
    if (routePath.indexOf("#/page/") > -1) {
      store.currentPage = Number(routePath.substring(7));
      newsFeed();
    } else if (routePath.indexOf("#/show/") > -1) {
      newsDetail();
    }
  } else {
    newsFeed();
  }
}

window.addEventListener("hashchange", router);

router();
