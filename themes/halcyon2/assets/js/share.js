"use strict";


function openShareScreen() {
  const title = document.title;
  const url = getCanonicalUrl();

  if (navigator.share) {
    // Use the native iOS/Android/macOS share sheet if available
    // We don't really care for the results of the share sheet, they could be
    // used for analytics but that would be creepy.

    return navigator.share({
      title: title,
      url: url
    })
      .catch(() => {/* do absolutely nothing */});
  } else {
    document.querySelector(".share-grid").style.display = "block";
    document.querySelector("button.share").style.display = "none";
    document.querySelector("button.share").setAttribute("aria-expanded", "true");
  }
}

function setupShare() {
  document.querySelectorAll("button.share")
    .forEach(button => button.addEventListener('click', openShareScreen));
}

function getCanonicalUrl() {
  if (document.querySelector('link[rel=canonical]')) {
    return document.querySelector('link[rel=canonical]').href;
  } else {
    return document.location.href;
  }
}

document.addEventListener('DOMContentLoaded', setupShare);
