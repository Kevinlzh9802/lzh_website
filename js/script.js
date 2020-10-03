$(function () { // Same as document.addEventListener("DOMContentLoaded"...
  console.log("111");
});

(function (global) {
	console.log("222");
})(window);