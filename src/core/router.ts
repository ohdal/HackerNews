import { RouteInfo } from "../types";
import View from "./view";

export default class Router {
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
