/* ==========================================================================
   PORTFOLIO — ASHWIN MUKHERJEE
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --- Scroll reveal (reusable) ---
  function observeReveals(root) {
    const reveals = (root || document).querySelectorAll('.reveal:not(.is-visible)');
    if (!reveals.length) return;

    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    reveals.forEach((el) => revealObserver.observe(el));
  }

  observeReveals();


  // --- Photo page ---
  const photoPage = document.querySelector('.photo-page');
  if (photoPage) {
    const backLink = photoPage.querySelector('.photo-page__back');
    if (backLink) {
      backLink.addEventListener('click', (e) => {
        e.preventDefault();
        const href = backLink.href;
        photoPage.classList.add('is-leaving');
        setTimeout(() => { window.location.href = href; }, 200);
      });
    }

    // Fetch and render photos
    const photoSequence = photoPage.querySelector('.photo-sequence');
    if (photoSequence) {
      fetch('content/photos.json')
        .then((res) => res.json())
        .then((photos) => {
          photos.forEach((photo) => {
            const figure = document.createElement('figure');
            figure.className = 'photo-frame reveal reveal--fade';
            const img = document.createElement('img');
            img.src = photo.src;
            img.alt = photo.alt || '';
            img.loading = 'lazy';
            figure.appendChild(img);
            if (photo.caption) {
              const cap = document.createElement('figcaption');
              cap.textContent = photo.caption;
              figure.appendChild(cap);
            }
            photoSequence.appendChild(figure);
          });
          observeReveals(photoSequence);
        })
        .catch((err) => console.error('Failed to load photos:', err));
    }
  }


  // --- Landing page ---
  const landing = document.querySelector('.landing');
  if (!landing) return;


  // ==========================================================================
  // ENTRANCE: Swell (first visit) or Return (subsequent)
  // ==========================================================================

  const entrance = document.documentElement.getAttribute('data-entrance') || 'swell';
  landing.setAttribute('data-entrance', entrance);

  // Clean up after animation completes
  const entranceDuration = entrance === 'swell' ? 2000 : 500;

  setTimeout(() => {
    landing.removeAttribute('data-entrance');

    landing.querySelector('.landing-name').style.opacity = '0.5';

    landing.querySelectorAll('.landing-nav-item').forEach((el) => {
      el.style.opacity = '0.5';
    });

    landing.querySelectorAll('.landing-footer__links a').forEach((el) => {
      el.style.opacity = '0.35';
    });

    const locText = landing.querySelector('.landing-footer__location-text');
    if (locText) locText.style.opacity = '0.35';

    const dotEl = landing.querySelector('.landing-footer__dot');
    if (dotEl) dotEl.style.opacity = '0.5';
  }, entranceDuration);


  // ==========================================================================
  // HOVER: locked to indigo
  // ==========================================================================

  landing.setAttribute('data-hover', 'indigo');


  // ==========================================================================
  // SOLAR DOT — follows user's local time
  // ==========================================================================

  const dot = landing.querySelector('.landing-footer__dot');
  const locText = landing.querySelector('.landing-footer__location-text');

  const dotColorsLight = {
    preDawn:    '#4A5A52',
    dawn:       '#B09088',
    goldenAM:   '#A8976E',
    morning:    '#7A8B5E',
    midday:     '#B5A888',
    afternoon:  '#9A8E6E',
    goldenPM:   '#A68A5A',
    dusk:       '#8B7080',
  };

  const dotColorsDark = {
    earlyNight: '#E0B878',
    deepNight:  '#5E8A8A',
    lateNight:  '#9AAABE',
    preDawn:    '#6A7E88',
  };

  function getSolarTimes(dayOfYear) {
    const lat = 37.38 * Math.PI / 180;
    const decl = 23.45 * Math.sin(2 * Math.PI * (284 + dayOfYear) / 365) * Math.PI / 180;
    const ha = Math.acos(-Math.tan(lat) * Math.tan(decl)) * 180 / Math.PI;
    const sunrise = 12 - ha / 15;
    const sunset = 12 + ha / 15;
    return { sunrise, sunset };
  }

  function getDayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    return Math.floor((date - start) / 86400000);
  }

  function getSolarPhase() {
    const now = new Date();
    const doy = getDayOfYear(now);
    const { sunrise, sunset } = getSolarTimes(doy);
    const hour = now.getHours() + now.getMinutes() / 60;

    const dawn = sunrise - 0.75;
    const goldenAM = sunrise + 1;
    const goldenPM = sunset - 1;
    const dusk = sunset + 0.75;

    if (hour >= dawn && hour < sunrise) return { phase: 'dawn', mode: 'light' };
    if (hour >= sunrise && hour < goldenAM) return { phase: 'goldenAM', mode: 'light' };
    if (hour >= goldenAM && hour < goldenAM + 1) return { phase: 'morning', mode: 'light' };
    if (hour >= goldenAM + 1 && hour < goldenPM - 1) return { phase: 'midday', mode: 'light' };
    if (hour >= goldenPM - 1 && hour < goldenPM) return { phase: 'afternoon', mode: 'light' };
    if (hour >= goldenPM && hour < sunset) return { phase: 'goldenPM', mode: 'light' };
    if (hour >= sunset && hour < dusk) return { phase: 'dusk', mode: 'light' };

    if (hour < dawn) {
      return { phase: 'preDawn', mode: 'light' };
    }

    // Night phases — split dusk-to-dawn into segments
    const totalNight = (24 - dusk) + dawn;
    const intoNight = hour >= dusk ? (hour - dusk) : (hour + 24 - dusk);
    const progress = intoNight / totalNight;

    if (progress < 0.25) return { phase: 'earlyNight', mode: 'dark' };
    if (progress < 0.6) return { phase: 'deepNight', mode: 'dark' };
    if (progress < 0.85) return { phase: 'lateNight', mode: 'dark' };
    return { phase: 'preDawn', mode: 'dark' };
  }

  function applyDot() {
    if (!dot) return;
    const { phase, mode } = getSolarPhase();
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    let color;
    if (isDark) {
      color = dotColorsDark[phase] || dotColorsDark.earlyNight;
    } else {
      color = dotColorsLight[phase] || dotColorsLight.morning;
    }

    dot.style.setProperty('--dot-color', color);
  }

  applyDot();
  if (dot) dot.style.opacity = '0.85';
  if (locText) locText.style.opacity = '0.35';


  // ==========================================================================
  // NAV HOVER TRACKING
  // ==========================================================================

  const navItems = landing.querySelectorAll('.landing-nav-item');

  const hasHover = window.matchMedia('(hover: hover)').matches;

  navItems.forEach((item) => {
    const section = item.dataset.section;

    if (hasHover) {
      item.addEventListener('mouseenter', () => {
        if (landing.classList.contains('has-takeover')) return;
        landing.classList.add('is-hovering');
        landing.classList.add('is-hovering-' + section);
        item.classList.add('is-active');
      });

      item.addEventListener('mouseleave', () => {
        if (landing.classList.contains('has-takeover')) return;
        landing.classList.remove('is-hovering');
        landing.classList.remove('is-hovering-' + section);
        item.classList.remove('is-active');
      });
    }
  });


  // ==========================================================================
  // PAGE EXIT — fade out before navigating away (Film link)
  // ==========================================================================

  navItems.forEach((item) => {
    if (item.tagName !== 'A' || !item.href) return;

    item.addEventListener('click', (e) => {
      e.preventDefault();
      const href = item.href;
      landing.classList.add('is-leaving');
      setTimeout(() => { window.location.href = href; }, 200);
    });
  });

  // Restore from bfcache — clear is-leaving so landing isn't blank on browser back
  window.addEventListener('pageshow', (e) => {
    if (e.persisted) landing.classList.remove('is-leaving');
  });


  // ==========================================================================
  // TAKEOVER PANELS
  // ==========================================================================

  const takeovers = document.querySelectorAll('.landing-takeover');
  const projectsPanel = document.getElementById('takeover-projects');
  const writingPanel = document.getElementById('takeover-writing');

  // Click nav items with takeover targets
  navItems.forEach((item) => {
    const takeoverId = item.dataset.takeover;
    if (!takeoverId) return;

    item.addEventListener('click', () => {
      const panel = document.getElementById(takeoverId);
      if (!panel) return;

      landing.classList.remove('is-hovering');
      navItems.forEach((nav) => {
        landing.classList.remove('is-hovering-' + nav.dataset.section);
        nav.classList.remove('is-active');
      });

      landing.classList.add('has-takeover');

      // On touch devices, let landing text fade out before showing takeover
      const delay = hasHover ? 0 : 300;
      setTimeout(() => {
        panel.classList.add('is-active');

        // Push history for takeover
        if (panel === projectsPanel) {
          history.pushState({ view: 'projects' }, '', '#projects');
        } else if (panel === writingPanel) {
          history.pushState({ view: 'writing' }, '', '#writing');
        }
      }, delay);
    });
  });

  // Click negative space on takeover to close (only when showing the list, not the drawer)
  takeovers.forEach((panel) => {
    panel.addEventListener('click', (e) => {
      // If a drawer is open, don't close on negative space — use the back button
      if (panel.classList.contains('has-drawer')) return;
      // If click landed on a project/writing link, ignore — it opens a drawer
      if (e.target.closest('[data-project]')) return;
      if (e.target.closest('[data-writing]')) return;
      // If click landed on any other real link, let it navigate
      if (e.target.closest('a')) return;
      closeTakeover(panel);
    });
  });

  function closeTakeover(panel) {
    // If drawer is open, close drawer first
    if (panel.classList.contains('has-drawer')) {
      closeDrawer(panel);
      return;
    }

    panel.classList.remove('is-active');

    landing.classList.remove('is-hovering');
    navItems.forEach((nav) => {
      landing.classList.remove('is-hovering-' + nav.dataset.section);
      nav.classList.remove('is-active');
    });

    setTimeout(() => {
      landing.classList.remove('has-takeover');
    }, 400);

    // Push history back to landing
    history.pushState({ view: 'landing' }, '', window.location.pathname);
  }


  // ==========================================================================
  // DRAWER — project detail inside takeover
  // ==========================================================================

  let projectData = {};
  let drawerCarouselCurrent = 0;
  let drawerCarouselSlides = [];
  let drawerCurrentSlug = null;

  // DOM references for the drawer
  const drawer = projectsPanel ? projectsPanel.querySelector('.takeover-drawer') : null;
  const drawerTitle = drawer?.querySelector('.takeover-drawer__title');
  const drawerDate = drawer?.querySelector('.takeover-drawer__date');
  const drawerTrack = drawer?.querySelector('.takeover-drawer__track');
  const drawerImgLabel = drawer?.querySelector('.takeover-drawer__img-label');
  const drawerCounter = drawer?.querySelector('.takeover-drawer__counter');
  const drawerDescription = drawer?.querySelector('.takeover-drawer__description');
  const drawerLinks = drawer?.querySelector('.takeover-drawer__links');
  const drawerBack = drawer?.querySelector('.takeover-drawer__back');

  function populateDrawer(slug) {
    const data = projectData[slug];
    if (!data || !drawer) return;

    drawerCurrentSlug = slug;
    drawerCarouselCurrent = 0;

    // Title + date
    drawerTitle.textContent = data.title;
    drawerDate.textContent = data.date || '';

    // Build slides
    drawerTrack.innerHTML = '';
    (data.images || []).forEach((img, i) => {
      const slide = document.createElement('div');
      slide.className = 'takeover-drawer__slide' + (i === 0 ? ' is-active' : '');
      if (img.src) {
        const imgEl = document.createElement('img');
        imgEl.src = img.src;
        imgEl.alt = img.label || '';
        slide.appendChild(imgEl);
      } else {
        const ph = document.createElement('div');
        ph.className = 'takeover-drawer__slide-placeholder';
        ph.textContent = img.placeholder || 'Image';
        slide.appendChild(ph);
      }
      drawerTrack.appendChild(slide);
    });

    drawerCarouselSlides = drawerTrack.querySelectorAll('.takeover-drawer__slide');

    // Label + counter
    drawerImgLabel.textContent = data.images?.[0]?.label || '';
    drawerCounter.textContent = data.images?.length ? '1/' + data.images.length : '';

    // Description
    drawerDescription.textContent = data.description || '';

    // Links
    drawerLinks.innerHTML = '';
    (data.links || []).forEach((link) => {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.text;
      if (/^https?:/i.test(link.href)) {
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
      drawerLinks.appendChild(a);
    });
  }

  function goToDrawerSlide(index) {
    if (index === drawerCarouselCurrent || !drawerCarouselSlides.length) return;

    drawerCarouselSlides[drawerCarouselCurrent].classList.remove('is-active');
    drawerCarouselCurrent = index;
    drawerCarouselSlides[drawerCarouselCurrent].classList.add('is-active');

    const data = projectData[drawerCurrentSlug];
    if (data) {
      drawerImgLabel.textContent = data.images[drawerCarouselCurrent]?.label || '';
      drawerCounter.textContent = (drawerCarouselCurrent + 1) + '/' + data.images.length;
    }
  }

  // Click track to advance
  if (drawerTrack) {
    drawerTrack.addEventListener('click', () => {
      if (!drawerCarouselSlides.length) return;
      goToDrawerSlide((drawerCarouselCurrent + 1) % drawerCarouselSlides.length);
    });

    // Touch/swipe on drawer carousel
    let touchStartX = 0;
    drawerTrack.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    drawerTrack.addEventListener('touchend', (e) => {
      const diff = touchStartX - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50 && drawerCarouselSlides.length) {
        if (diff > 0) goToDrawerSlide((drawerCarouselCurrent + 1) % drawerCarouselSlides.length);
        else goToDrawerSlide((drawerCarouselCurrent - 1 + drawerCarouselSlides.length) % drawerCarouselSlides.length);
      }
    }, { passive: true });
  }

  function openDrawer(slug) {
    if (!projectsPanel || !projectData[slug]) return;

    populateDrawer(slug);
    projectsPanel.classList.add('has-drawer');

    // Push history
    history.pushState({ view: 'drawer', slug: slug }, '', '#projects/' + slug);
  }

  function closeDrawer(panel) {
    if (!panel) panel = projectsPanel;
    panel.classList.remove('has-drawer');
    drawerCurrentSlug = null;

    // Go back to projects list in history
    history.pushState({ view: 'projects' }, '', '#projects');
  }

  // Back button in drawer
  if (drawerBack) {
    drawerBack.addEventListener('click', (e) => {
      e.stopPropagation();
      closeDrawer(projectsPanel);
    });
  }


  // ==========================================================================
  // WRITING DRAWER — essay detail inside takeover
  // ==========================================================================

  let writingData = {};
  let writingCurrentSlug = null;

  const wDrawer = writingPanel ? writingPanel.querySelector('.takeover-drawer') : null;
  const wTitle = wDrawer?.querySelector('.takeover-drawer__title');
  const wDate = wDrawer?.querySelector('.takeover-drawer__date');
  const wBody = wDrawer?.querySelector('.takeover-drawer__body');
  const wBack = wDrawer?.querySelector('.takeover-drawer__back');

  function populateWritingDrawer(slug) {
    const data = writingData[slug];
    if (!data || !wDrawer) return;

    writingCurrentSlug = slug;
    wTitle.textContent = data.title;
    wDate.textContent = data.date || '';

    wBody.innerHTML = '';
    (data.body || []).forEach((block) => {
      if (block.type === 'image') {
        const figure = document.createElement('figure');
        figure.className = 'takeover-drawer__figure';
        const img = document.createElement('img');
        img.src = block.src;
        img.alt = block.caption || '';
        figure.appendChild(img);
        if (block.caption) {
          const cap = document.createElement('figcaption');
          cap.textContent = block.caption;
          figure.appendChild(cap);
        }
        wBody.appendChild(figure);
      } else {
        const p = document.createElement('p');
        p.innerHTML = block.content || block;
        p.querySelectorAll('a[href^="http"]').forEach((a) => {
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
        });
        wBody.appendChild(p);
      }
    });
  }

  function openWritingDrawer(slug) {
    if (!writingPanel || !writingData[slug]) return;
    populateWritingDrawer(slug);
    // Show drawer structure first, then trigger content transitions next frame
    writingPanel.classList.add('has-drawer');
    requestAnimationFrame(() => {
      writingPanel.classList.add('writing-body-in');
    });
    history.pushState({ view: 'writing-drawer', slug: slug }, '', '#writing/' + slug);
  }

  function closeWritingDrawer() {
    if (!writingPanel) return;
    writingPanel.classList.remove('has-drawer', 'writing-body-in');
    writingCurrentSlug = null;
    history.pushState({ view: 'writing' }, '', '#writing');
  }

  if (wBack) {
    wBack.addEventListener('click', (e) => {
      e.stopPropagation();
      closeWritingDrawer();
    });
  }


  // ==========================================================================
  // WIRE UP LIST LINKS — called after content is fetched
  // ==========================================================================

  function wireProjectLinks() {
    if (!projectsPanel) return;
    const projectLinks = projectsPanel.querySelectorAll('[data-project]');
    projectLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const slug = link.dataset.project;
        if (projectData[slug]) {
          openDrawer(slug);
        }
      });
    });
  }

  function wireWritingLinks() {
    if (!writingPanel) return;
    const writingLinks = writingPanel.querySelectorAll('[data-writing]');
    writingLinks.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const slug = link.dataset.writing;
        if (writingData[slug]) {
          openWritingDrawer(slug);
        }
      });
    });
  }


  // ==========================================================================
  // KEYBOARD — Escape closes innermost layer, arrows for carousel
  // ==========================================================================

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Check drawers first
      if (writingPanel && writingPanel.classList.contains('has-drawer')) {
        closeWritingDrawer();
        return;
      }
      if (projectsPanel && projectsPanel.classList.contains('has-drawer')) {
        closeDrawer(projectsPanel);
        return;
      }
      // Then check takeover
      takeovers.forEach((panel) => {
        if (panel.classList.contains('is-active')) {
          closeTakeover(panel);
        }
      });
      return;
    }

    // Arrow keys for drawer carousel (only when drawer is open)
    if (projectsPanel && projectsPanel.classList.contains('has-drawer') && drawerCarouselSlides.length) {
      if (e.key === 'ArrowRight') {
        goToDrawerSlide((drawerCarouselCurrent + 1) % drawerCarouselSlides.length);
      }
      if (e.key === 'ArrowLeft') {
        goToDrawerSlide((drawerCarouselCurrent - 1 + drawerCarouselSlides.length) % drawerCarouselSlides.length);
      }
    }
  });


  // ==========================================================================
  // HISTORY — back/forward browser navigation
  // ==========================================================================

  window.addEventListener('popstate', (e) => {
    const state = e.state;

    if (!state || state.view === 'landing') {
      // Close everything
      if (projectsPanel && projectsPanel.classList.contains('has-drawer')) {
        projectsPanel.classList.remove('has-drawer');
        drawerCurrentSlug = null;
      }
      if (writingPanel && writingPanel.classList.contains('has-drawer')) {
        writingPanel.classList.remove('has-drawer');
        writingCurrentSlug = null;
      }
      takeovers.forEach((panel) => {
        if (panel.classList.contains('is-active')) {
          panel.classList.remove('is-active');
          landing.classList.remove('is-hovering');
          navItems.forEach((nav) => {
            landing.classList.remove('is-hovering-' + nav.dataset.section);
            nav.classList.remove('is-active');
          });
          setTimeout(() => {
            landing.classList.remove('has-takeover');
          }, 400);
        }
      });
      return;
    }

    if (state.view === 'projects') {
      // Show projects list, close drawer if open
      if (projectsPanel && projectsPanel.classList.contains('has-drawer')) {
        projectsPanel.classList.remove('has-drawer');
        drawerCurrentSlug = null;
      }
      // Make sure takeover is open
      if (!projectsPanel.classList.contains('is-active')) {
        landing.classList.add('has-takeover');
        projectsPanel.classList.add('is-active');
      }
      return;
    }

    if (state.view === 'drawer' && state.slug) {
      // Open project drawer directly
      if (!projectsPanel.classList.contains('is-active')) {
        landing.classList.add('has-takeover');
        projectsPanel.classList.add('is-active');
      }
      populateDrawer(state.slug);
      projectsPanel.classList.add('has-drawer');
      return;
    }

    if (state.view === 'writing') {
      if (writingPanel && writingPanel.classList.contains('has-drawer')) {
        writingPanel.classList.remove('has-drawer');
        writingCurrentSlug = null;
      }
      if (!writingPanel.classList.contains('is-active')) {
        landing.classList.add('has-takeover');
        writingPanel.classList.add('is-active');
      }
      return;
    }

    if (state.view === 'writing-drawer' && state.slug) {
      if (!writingPanel.classList.contains('is-active')) {
        landing.classList.add('has-takeover');
        writingPanel.classList.add('is-active');
      }
      populateWritingDrawer(state.slug);
      writingPanel.classList.add('has-drawer', 'writing-body-in');
      return;
    }
  });


  // ==========================================================================
  // OPEN FROM HASH — initial page load
  // ==========================================================================

  function openFromHash() {
    const hash = location.hash.replace('#', '');
    if (!hash) return;

    const parts = hash.split('/');
    const section = parts[0];
    const slug = parts[1] || null;

    // Remove pre-paint attributes
    const hasPrepaint = document.documentElement.hasAttribute('data-takeover-target');

    if (section === 'projects') {
      // Skip swell entrance
      landing.removeAttribute('data-entrance');
      landing.classList.add('has-takeover');
      projectsPanel.classList.add('is-active');

      // Replace initial history entry
      if (slug && projectData[slug]) {
        populateDrawer(slug);
        projectsPanel.classList.add('has-drawer');
        history.replaceState({ view: 'drawer', slug: slug }, '', '#projects/' + slug);
      } else {
        history.replaceState({ view: 'projects' }, '', '#projects');
      }

      // Remove pre-paint overrides after a frame
      if (hasPrepaint) {
        requestAnimationFrame(() => {
          document.documentElement.removeAttribute('data-takeover-target');
          document.documentElement.removeAttribute('data-drawer-target');
        });
      }
      return;
    }

    if (section === 'writing') {
      landing.removeAttribute('data-entrance');
      landing.classList.add('has-takeover');
      writingPanel.classList.add('is-active');

      if (slug && writingData[slug]) {
        populateWritingDrawer(slug);
        writingPanel.classList.add('has-drawer', 'writing-body-in');
        history.replaceState({ view: 'writing-drawer', slug: slug }, '', '#writing/' + slug);
      } else {
        history.replaceState({ view: 'writing' }, '', '#writing');
      }

      if (hasPrepaint) {
        requestAnimationFrame(() => {
          document.documentElement.removeAttribute('data-takeover-target');
          document.documentElement.removeAttribute('data-drawer-target');
        });
      }
      return;
    }
  }


  // ==========================================================================
  // FETCH CONTENT — load projects + writing, build lists, then open from hash
  // ==========================================================================

  function buildProjectList(projects) {
    const list = projectsPanel?.querySelector('.landing-takeover__list');
    if (!list) return;
    projects.forEach((p) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.dataset.project = p.slug;
      a.textContent = p.title;
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  function buildWritingList(articles) {
    const list = writingPanel?.querySelector('.landing-takeover__list');
    if (!list) return;
    articles.forEach((w) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = '#';
      a.dataset.writing = w.slug;
      a.textContent = w.title;
      li.appendChild(a);
      list.appendChild(li);
    });
  }

  Promise.all([
    fetch('content/projects.json').then((r) => r.json()),
    fetch('content/writing.json').then((r) => r.json())
  ])
    .then(([projects, writing]) => {
      // Build slug-keyed lookup objects
      projects.forEach((p) => { projectData[p.slug] = p; });
      writing.forEach((w) => { writingData[w.slug] = w; });

      // Build list DOM
      buildProjectList(projects);
      buildWritingList(writing);

      // Wire up click handlers on the new list items
      wireProjectLinks();
      wireWritingLinks();

      // Now safe to open from hash
      openFromHash();
    })
    .catch((err) => console.error('Failed to load content:', err));

});
