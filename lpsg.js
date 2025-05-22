// ==UserScript==
// @name         LPSG Video Unblocker
// @namespace    https://lpsg.com/
// @version      1.4
// @description  Remove blockers, swap posters for <video>, hide 404s, and bold the container text when replacement succeeds.
// @match        *://www.lpsg.com/*
// @grant        none
// ==/UserScript==
(function() {
    'use strict';
    
    console.log('[LPSG Video Unblocker] Script initialized');
    
    // Track videos that are currently being retried to avoid duplicates
    const retryingVideos = new Set();
    
    // Remove any overlay/blocker elements
    function removeBlockers() {
        const blockers = document.querySelectorAll(
            '.video-easter-egg-blocker, .video-easter-egg-overlay'
        );
        if (blockers.length > 0) {
            console.log(`[LPSG Video Unblocker] Removing ${blockers.length} blocker element(s)`);
            blockers.forEach(el => el.remove());
        }
    }
    
    // Helper function to handle video loading with retries
    function loadVideoWithRetry(video, videoUrl, retryCount = 0) {
        const maxRetries = 2;
        const retryDelay = 500; // 0.5 seconds
        
        // Create unique identifier for this video
        const videoId = videoUrl;
        
        console.log(`[LPSG Video Unblocker] Loading video (attempt ${retryCount + 1}/${maxRetries + 1}): ${videoUrl}`);
        
        const handleError = (event) => {
            console.log(`[LPSG Video Unblocker] Video load failed (attempt ${retryCount + 1}):`, event);
            
            if (retryCount < maxRetries) {
                console.log(`[LPSG Video Unblocker] Retrying in ${retryDelay}ms... (${retryCount + 1}/${maxRetries} retries used)`);
                
                // Mark this video as currently retrying
                retryingVideos.add(videoId);
                
                setTimeout(() => {
                    // Force reload by updating the src
                    const currentSrc = video.src;
                    video.src = '';
                    video.src = currentSrc;
                    loadVideoWithRetry(video, videoUrl, retryCount + 1);
                }, retryDelay);
            } else {
                console.log(`[LPSG Video Unblocker] All retry attempts exhausted. Removing video: ${videoUrl}`);
                retryingVideos.delete(videoId);
                video.remove();
            }
        };
        
        const handleSuccess = () => {
            console.log(`[LPSG Video Unblocker] Video loaded successfully: ${videoUrl}`);
            retryingVideos.delete(videoId);
        };
        
        // Remove any existing listeners to avoid duplicates
        video.removeEventListener('error', handleError);
        video.removeEventListener('loadeddata', handleSuccess);
        
        // Add event listeners
        video.addEventListener('error', handleError);
        video.addEventListener('loadeddata', handleSuccess);
    }
    
    // Replace posters and highlight their container
    function replacePosters() {
        const selectors = [
            'img[src*="/data/attachments/posters/"]',
            'img[src*="/data/xfmg/poster/"]',
            '.fancybox-container .video-easter-egg-poster img'
        ];
        
        const images = document.querySelectorAll(selectors.join(','));
        console.log(`[LPSG Video Unblocker] Found ${images.length} poster image(s) to process`);
        
        images.forEach((img, index) => {
            if (img.dataset.replaced) {
                console.log(`[LPSG Video Unblocker] Image ${index + 1} already replaced, skipping`);
                return;
            }
            
            const src = img.src;
            console.log(`[LPSG Video Unblocker] Processing image ${index + 1}: ${src}`);
            
            let videoUrl = null;
            let m;
            
            // thread attachments
            m = src.match(/\/data\/attachments\/posters\/(\d+)\/(\d+)-([a-f0-9]+)\.jpg/);
            if (m) {
                const [, postId, videoId, hash] = m;
                videoUrl = `https://cdn-videos.lpsg.com/data/video/${postId}/${videoId}-${hash}.mp4`;
                console.log(`[LPSG Video Unblocker] Matched thread attachment pattern, video URL: ${videoUrl}`);
            } else {
                // gallery / fancybox posters
                m = src.match(/\/data\/xfmg\/poster\/(\d+)\/(\d+)-([a-f0-9]+)\.jpg/);
                if (m) {
                    const [, albumId, mediaId, hash] = m;
                    videoUrl = `https://cdn-videos.lpsg.com/data/xfmg/video/${albumId}/${mediaId}-${hash}.mp4`;
                    console.log(`[LPSG Video Unblocker] Matched gallery/fancybox pattern, video URL: ${videoUrl}`);
                }
            }
            
            if (videoUrl) {
                // Exclude thumbnail URLs that are being blocked
                if (videoUrl.includes('/data/xfmg/thumbnail/') || videoUrl.includes('/data/xfmg/album_thumbnail/')) {
                    console.log(`[LPSG Video Unblocker] Skipping blocked thumbnail URL: ${videoUrl}`);
                    return;
                }
                
                // Check if this video is already being retried
                if (retryingVideos.has(videoUrl)) {
                    console.log(`[LPSG Video Unblocker] Video already being retried, skipping: ${videoUrl}`);
                    return;
                }
                
                console.log(`[LPSG Video Unblocker] Creating video element for: ${videoUrl}`);
                
                const video = document.createElement('video');
                video.src = videoUrl;
                video.controls = true;
                video.style.width = img.width ? img.width + 'px' : '100%';
                video.style.maxWidth = '100%';
                video.dataset.replaced = 'true';
                
                // Mark the original image as replaced BEFORE swapping
                img.dataset.replaced = 'true';
                
                // Set up retry logic for errors
                loadVideoWithRetry(video, videoUrl);
                
                // swap in the video
                img.replaceWith(video);
                console.log(`[LPSG Video Unblocker] Replaced image with video element`);
                
                // now bold the nearest container's text
                const container = video.closest('article, .block, .message, .fancybox-slide');
                if (container) {
                    container.style.fontWeight = 'bold';
                    console.log(`[LPSG Video Unblocker] Container text bolded`);
                } else {
                    console.log(`[LPSG Video Unblocker] No container found to bold`);
                }
            } else {
                console.log(`[LPSG Video Unblocker] No matching pattern found for image: ${src}`);
            }
        });
    }
    
    // Initial run
    function init() {
        console.log('[LPSG Video Unblocker] Running initial scan');
        removeBlockers();
        replacePosters();
    }
    
    // Re-apply on AJAX/page changes
    const observer = new MutationObserver((mutations) => {
        console.log(`[LPSG Video Unblocker] DOM mutations detected (${mutations.length} changes)`);
        removeBlockers();
        replacePosters();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
    console.log('[LPSG Video Unblocker] Mutation observer started');
    
    window.addEventListener('DOMContentLoaded', init);
    console.log('[LPSG Video Unblocker] DOMContentLoaded listener added');
})();
