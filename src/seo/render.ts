import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import App from '../App.vue';
export const render = (path: string) =>
  renderToString(createSSRApp(App, { routePath: path, routeSearch: '' }));
