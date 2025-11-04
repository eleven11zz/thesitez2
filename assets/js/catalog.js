(function () {
  const videos = document.querySelectorAll('.hover-play');
  if (!videos.length) return;

  const loadVideo = (video) => {
    if (video.dataset.loaded === 'true') return;
    const source = video.querySelector('source[data-src]');
    if (source && source.dataset.src) {
      source.src = source.dataset.src;
    }
    video.load();
    video.dataset.loaded = 'true';
  };

  const resetVideo = (video) => {
    video.pause();
    try {
      video.currentTime = 0;
    } catch (e) {
      /* ignore reset errors prior to metadata load */
    }
    video.classList.add('is-paused');
    video.classList.remove('is-playing');
  };

  const playVideo = (video) => {
    loadVideo(video);
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        video.classList.remove('is-paused');
        video.classList.add('is-playing');
      }).catch(() => {
        /* playback may be blocked until user interacts */
      });
    }
  };

  const pauseVideo = (video) => resetVideo(video);

  const observer = 'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadVideo(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: '120px 0px', threshold: 0.1 }
      )
    : null;

  videos.forEach((video) => {
    resetVideo(video);
    if (observer) {
      observer.observe(video);
    } else {
      loadVideo(video);
    }

    video.addEventListener('mouseenter', () => playVideo(video));
    video.addEventListener('focus', () => playVideo(video));
    video.addEventListener('mouseleave', () => pauseVideo(video));
    video.addEventListener('blur', () => pauseVideo(video));
    video.addEventListener('click', () => {
      if (video.classList.contains('is-playing')) {
        pauseVideo(video);
      } else {
        playVideo(video);
      }
    });
  });
})();
