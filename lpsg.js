// ==UserScript==
// @name         LPSG Video Unblocker (Universal)
// @namespace    https://lpsg.com/
// @version      1.2
// @description  Remove LPSG blockers and replace all poster images (thread attachments and gallery media) with <video> tags on every load and AJAX update.
// @author       You
// @match        *://www.lpsg.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1) Remove overlay/blocker elements by class name
    function removeBlockers() {
        document.querySelectorAll('.video-easter-egg-blocker, .video-easter-egg-overlay')
                .forEach(el => el.remove());
    }

    // 2) Replace any poster <img> with a real <video> element
    function replacePosters() {
        // Match both thread attachments and gallery posters
        const imgs = document.querySelectorAll(
            'img[src*="/data/attachments/posters/"],' +
            'img[src*="/data/xfmg/poster/"]'
        );

        imgs.forEach(img => {
            if (img.dataset.replaced) return;

            const src = img.src;
            let videoUrl = null;

            // 2a) Thread-attachment posters
            let m = src.match(/\/data\/attachments\/posters\/(\d+)\/(\d+)-([a-f0-9]+)\.jpg/);
            if (m) {
                const [ , postId, videoId, hash ] = m;
                videoUrl = `https://cdn-videos.lpsg.com/data/video/${postId}/${videoId}-${hash}.mp4`;
            } else {
                // 2b) Gallery-media posters
                let m2 = src.match(/\/data\/xfmg\/poster\/(\d+)\/(\d+)-([a-f0-9]+)\.jpg/);
                if (m2) {
                    const [ , albumId, mediaId, hash ] = m2;
                    videoUrl = `https://cdn-videos.lpsg.com/data/xfmg/video/${albumId}/${mediaId}-${hash}.mp4`;
                }
            }

            if (videoUrl) {
                const video = document.createElement('video');
                video.src = videoUrl;
                video.controls = true;
                video.style.width = img.width ? img.width + 'px' : '100%';
                video.style.maxWidth = '100%';
                video.dataset.replaced = 'true';

                // **New**: If the video fails to load (e.g. 404), remove it
                video.addEventListener('error', () => {
                    video.remove();
                });

                img.replaceWith(video);
            }
        });
    }

    // 3) Kick off on initial load
    function init() {
        removeBlockers();
        replacePosters();
    }

    // 4) Re-apply whenever content is dynamically loaded
    const observer = new MutationObserver(() => {
        removeBlockers();
        replacePosters();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // 5) Run on DOMContentLoaded
    window.addEventListener('DOMContentLoaded', init);
})();
