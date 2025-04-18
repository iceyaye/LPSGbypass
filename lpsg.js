// ==UserScript==
// @name         Videos LPSG
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Agora você pode ver porno sem pagar.
// @author       ylfs
// @match        https://www.lpsg.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    function removeElementsByClass(className) {
            const elements = document.querySelectorAll(`.${className}`);
            elements.forEach(element => element.remove());
        }
        removeElementsByClass('video-easter-egg-blocker');
        removeElementsByClass('video-easter-egg-overlay');

    function substituirImgPorVideo() {
        const imagens = document.querySelectorAll('img[src*="cdn-videos.lpsg.com/data/attachments/posters/"]');

        imagens.forEach(img => {
            const src = img.src;
            const match = src.match(/\/data\/attachments\/posters\/(\d+)\/(\d+)-([a-f0-9]+)\.jpg/);

            if (match) {
                const postId = match[1];
                const videoId = match[2];
                const hash = match[3];
                const videoUrl = `https://cdn-videos.lpsg.com/data/video/${postId}/${videoId}-${hash}.mp4`;
                const video = document.createElement('video');
                video.src = videoUrl;
                video.controls = true;
                video.style.width = '100%';
                img.replaceWith(video);
            }
        });
    }
    window.addEventListener('load', substituirImgPorVideo);
    const observer = new MutationObserver(substituirImgPorVideo);
    observer.observe(document.body, { childList: true, subtree: true });
})();
