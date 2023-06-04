import View from "../core/view";
import { NewsDetailApi } from "../core/api";
import { NewsComment } from "../types";

export default class NewsDetailView extends View {
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

    const store = window.store;
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
