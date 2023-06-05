import { NewsFeed, NewsDetail } from "../types";
import { NEWS_URL, CONTENT_URL } from "../config";

export class Api {
  // Generic & protected
  protected getRequestWithXHR<AjaxResponse>(url: string, cb: (data: AjaxResponse) => void): void {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url);
    xhr.addEventListener("load", () => {
      cb(JSON.parse(xhr.response) as AjaxResponse);
    });
    xhr.send();
  }

  protected getRequestWithPromise<AjaxResponse>(url: string, cb: (data: AjaxResponse) => void): void {
    fetch(url)
      .then((response) => response.json()) // 비동기적으로 json을 객체화해서 바꾼다.
      .then(cb)
      .catch(() => {
        console.error("데이터를 받아오지 못했습니다.");
      });
  }
}

export class NewsFeedApi {
  getDataWithXHR(cb: (data: NewsFeed[]) => void): void {
    this.printHello();
    this.getRequestWithXHR<NewsFeed[]>(NEWS_URL, cb);
  }
  
  getDataWithPromise(cb: (data: NewsFeed[]) => void): void {
    this.getRequestWithPromise<NewsFeed[]>(NEWS_URL, cb);
  }
}

export class NewsDetailApi {
  getDataWithXHR(id: string, cb: (data: NewsDetail) => void): void {
    this.getRequestWithXHR<NewsDetail>(CONTENT_URL.replace("@id", id), cb);
  }
  
  getDataWithPromise(id: string, cb: (data: NewsDetail) => void): void {
    this.getRequestWithPromise<NewsDetail>(CONTENT_URL.replace("@id", id), cb);
  }
}

export class Test {
  protected printHello(): void {
    console.log("Hello");
  }
}

// 기존의 extends라고 하는 방식의 상속 방법은 코드에 적시되어야 하는 상속 방법이다.
// 상속의 관계를 바꾸고 싶으면 코드 자체를 바꿔야 한다는 의미이다. (관계를 유연하게 가져갈 수 없다.)

// JS와 TS의 class extends 문법은 다중상속을 지원하지 않는다.
// 상위 class n개를 받을수 있게 만들어보자 !
// 아래 코드는 TS 공식 문서에서 제공하는 Mixin 관련 코드이며 Mixin을 구현하는 코드중 하나이다.
function applyApiMixins(targetClass: any, baseClass: any[]): void {
  baseClass.forEach((baseClass) => {
    Object.getOwnPropertyNames(baseClass.prototype).forEach((name) => {
      const descriptor = Object.getOwnPropertyDescriptor(baseClass.prototype, name);

      if (descriptor) {
        Object.defineProperty(targetClass.prototype, name, descriptor);
      }
    });
  });
}

// TS 컴파일러에게 Api class를 내부적으론 합성한다는 사실을 알려주기 위해 interface를 작성한다.
export interface NewsFeedApi extends Api, Test {}
export interface NewsDetailApi extends Api {}

applyApiMixins(NewsFeedApi, [Api, Test]);
applyApiMixins(NewsDetailApi, [Api]);
