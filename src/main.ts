import { createApp, nextTick } from 'vue';
import App from './App.vue';
import './style.css';
createApp(App).mount('#app');

// Vue renders the footer after the document's initial fragment navigation.
if (window.location.hash === '#riot-disclaimer') {
  void nextTick(() => document.getElementById('riot-disclaimer')?.scrollIntoView());
}
