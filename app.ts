type Store = {
  currentPage: number;
  feed: NewsFeed[];
}

type NewsFeed = {
  id: number;
  comments_count: number;
  url: string;
  user: string;
  time_ago: string;
  points: number;
  title: string;
  read?: boolean;
}

const container : HTMLElement | null = document.getElementById("root");

const NEWS_URL = "https://api.hnpwa.com/v0/news/1.json";
const CONTENT_URL = "https://api.hnpwa.com/v0/item/@id.json";

const store : Store = {
  currentPage: 1,
  feed: [],
};

const ajax : XMLHttpRequest = new XMLHttpRequest();

const getData = (url: string) => {
  ajax.open("GET", url, false);
  ajax.send();

  return JSON.parse(ajax.response);
};

function makeFeeds(feeds) {
  for (let i = 0; i < feeds.length; i++) {
    feeds[i].read = false;
  }

  return feeds;
}

function updateView(html) {
  if(container) {
    container.innerHTML = html
  } else {
    console.error('최상위 컨테이너가 없어 UI를 표시하지 못합니다.');
  }
}

function newsFeed() {
  let newsFeed: NewsFeed[] = store.feed;
  const newsList = [];
  const pageSize = 10;
  const totalPages =
    Math.floor(newsFeed.length / pageSize) +
    (newsFeed.length % pageSize > 0 ? 1 : 0);

  if (newsFeed.length === 0) {
    newsFeed = store.feed = makeFeeds(getData(NEWS_URL));
  }

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
  template = template.replace(
    "{{__prev_page__}}",
    store.currentPage > 1
      ? `<a href="#/page/${
          store.currentPage - 1
        }" class="text-gray-500">Previous</a>`
      : ""
  );
  template = template.replace(
    "{{__next_page__}}",
    store.currentPage < totalPages
      ? `<a href="#/page/${
          store.currentPage + 1
        }" class="text-gray-500 ml-4">Next</a>`
      : ""
  );

  updateView(template);
}

function newsDetail() {
  const id = location.hash.substring(7);
  const newsContent = getData(CONTENT_URL.replace("@id", id));

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

  function makeComment(comments, called = 0) {
    const commentString = [];

    for (let i = 0; i < comments.length; i++) {
      commentString.push(`
        <div style="padding-left: ${called * 40}px;" class="mt-4">
           <div class="text-gray-400">
            <i class="fa fa-sort-up mr-2"></i>
            <strong>${comments[i].user}</strong> ${comments[i].time_ago}
          </div>
          <p class="text-gray-700">${comments[i].content}</p>
        </div>
      `);

      if (comments[i].comments.length > 0) {
        commentString.push(makeComment(comments[i].comments, called + 1));
      }
    }

    return commentString.join("");
  }


  updateView(template.replace(
    "{{__comments__}}",
    makeComment(newsContent.comments)
  ))
}

function router() {
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