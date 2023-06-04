import View from "../core/view";

// Union 타입을 사용해야하면 type alias 를 사용한다
// 그 이외에는 interface를 더 많이 사용하는 경향이 있다.
// interface는 사용법을 봤을때 글로써 표현하여(extends) 무슨일을 하는지 더 명확히 표현한다는 장점이 있다.

export interface Store {
  currentPage: number;
  feed: NewsFeed[];
}

export interface News {
  readonly id: Number;
  readonly time_ago: string;
  readonly title: string;
  readonly url: string;
  readonly user: string;
  readonly content: string;
}

export interface NewsFeed extends News {
  readonly comments_count: number;
  readonly points: number;
  read?: boolean;
}

export interface NewsDetail extends News {
  readonly comments: NewsComment[];
}

export interface NewsComment extends News {
  readonly comments: NewsComment[];
  readonly level: number;
}

export interface RouteInfo {
  path: string;
  page: View;
}
