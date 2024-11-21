console.log('map.js');

import { controls } from './controls.js';



declare global {
  interface Window {
    w3_open: () => void;
    w3_close: () => void;
    fireModelsList: any;
  }
}

window.w3_open = function () {
  console.log("open");
  const sidebar = document.getElementById("mapSidebar");
  if (sidebar) {
    sidebar.style.display = "block";
  }
}

window.w3_close = function() {
  console.log("close");
  const sidebar = document.getElementById("mapSidebar");
  if (sidebar) {
    sidebar.style.display = "none";
  }
}

controls(window.fireModelsList);