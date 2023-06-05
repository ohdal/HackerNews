import View from "../core/view";
import { NewsFeedApi } from "../core/api";
import { NewsFeed, NewsStore } from "../types";

export default class NewsFeedView extends View {
  private api: NewsFeedApi;
  private totalPages: number;
  private pageSize: number;
  private store: NewsStore;

  constructor(containerId: string, store: NewsStore) {
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
    this.store = store;
    this.totalPages = 1;
    this.pageSize = 10;
  }
  
  render() {
    this.store.currentPage = Number(location.hash.substring(7)) || 1;

    if(!this.store.hasFeeds) {
      this.api.getData((feeds: NewsFeed[]) => {
        this.store.setFeeds(feeds);
        this.totalPages =Math.floor(this.store.numberOfFeed / this.pageSize) +(this.store.numberOfFeed % this.pageSize > 0 ? 1 : 0);
        this.renderView();
      })
      
      return;
    }

    this.renderView();
  }
  
  private renderView() {
    let page = this.store.currentPage - 1;
  
    for (let i = page * this.pageSize; i < (page + 1) * this.pageSize; i++) {
      const { id, title, comments_count, user, points, time_ago, read } = this.store.getFeed(i);
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
      `<a href="#/page/${this.store.prevPage}" class="${
        this.store.currentPage > 1
          ? "text-gray-500"
          : "pointer-events-none text-gray-200"
      }">Previous</a>`
    );
    this.setTemplatedata(
      "next_page",
      `<a href="#/page/${this.store.nextPage}" class="ml-4 ${
        this.store.currentPage < this.totalPages
          ? "text-gray-500"
          : "pointer-events-none text-gray-200"
      }">Next</a>`
    );
  
    this.updateView();

  }
}
