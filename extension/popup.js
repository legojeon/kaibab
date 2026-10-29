import {RESTAURANTS, seoulDate, currentMeal, shiftDate, formatDate, sourceURL, parseMenu} from './data.js';
import {messages, restaurantLabel} from './locales.js';
import {fetchMenuPage} from './network.js';

const $ = id => document.getElementById(id);
const CACHE_PREFIX = 'menu-v2:';
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_KEEP = 7 * 24 * 60 * 60 * 1000;
const state = {restaurant: RESTAURANTS.find(r => r.id === 'emp'), date: seoulDate(), meal: currentMeal(), language: 'ko', data: null};
let controller;
let requestVersion = 0;

const storage = {
  async get(key) {try { return (await chrome.storage.local.get(key))[key]; } catch { return undefined; }},
  async set(value) {try { await chrome.storage.local.set(value); } catch { /* The popup still works without a cache. */ }},
};
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function setStatus(text = '', warning = false) {
  $('status').textContent = text;
  $('status').classList.toggle('warning', warning);
}
function applyLanguage() {
  const m = messages(state.language);
  document.documentElement.lang = state.language;
  document.title = m.title;
  document.querySelector('.controls').setAttribute('aria-label', m.selectMenu);
  for (const [id, label] of Object.entries({restaurant: m.restaurant, refresh: m.refresh, previous: m.previous, next: m.next, 'date-picker': m.date, 'meal-tabs': m.mealTime, menu: m.menu})) {
    $(id).setAttribute('aria-label', label);
    $(id).title = label;
  }
  $('today').textContent = m.today;
  $('today').title = m.goToday;
  $('today-badge').textContent = m.today;
  $('guide-label').textContent = m.guide;
  $('notice-label').textContent = m.notice;
  $('disclaimer').textContent = m.disclaimer;
  for (const option of $('restaurant').options) option.textContent = restaurantLabel(option.value, state.language);
  document.querySelectorAll('[data-language]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.language === state.language));
  });
  document.querySelectorAll('[data-meal]').forEach(button => {
    const index = Number(button.dataset.meal);
    const symbol = element('span', '', ['◔', '☀', '☾'][index]);
    symbol.setAttribute('aria-hidden', 'true');
    button.replaceChildren(symbol, document.createTextNode(` ${m.meals[index]}`));
  });
}
function updateControls() {
  $('restaurant').value = state.restaurant.id;
  $('restaurant').title = state.language === 'ko' ? state.restaurant.name + (state.restaurant.detail ? ` · ${state.restaurant.detail}` : '') : restaurantLabel(state.restaurant.id, 'en');
  $('date-controls').hidden = !!state.restaurant.guide;
  $('guide-label').hidden = !state.restaurant.guide;
  $('date-label').textContent = formatDate(state.date, state.language);
  $('today-badge').hidden = state.date !== seoulDate();
  $('today').disabled = state.date === seoulDate();
  $('date-picker').value = state.date;
  document.querySelectorAll('[data-meal]').forEach(button => {
    const selected = Number(button.dataset.meal) === state.meal;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  if (state.restaurant.guide) $('menu').removeAttribute('aria-labelledby');
  else $('menu').setAttribute('aria-labelledby', `tab-${state.meal}`);
}
function emptyState(title, message, retry = false) {
  const card = element('div', 'empty-state');
  const icon = element('span', 'empty-icon', retry ? '↻' : '◷');
  icon.setAttribute('aria-hidden', 'true');
  card.append(icon, element('h2', '', title), element('p', '', message));
  if (retry) {
    const button = element('button', 'retry-button', messages(state.language).retry);
    button.addEventListener('click', () => load(true));
    card.append(button);
  }
  $('menu').replaceChildren(card);
}
function render() {
  const m = messages(state.language);
  $('menu').replaceChildren();
  const data = state.data;
  if (!data) return;
  $('notice').hidden = !data.notice;
  $('notice-text').textContent = data.notice || '';
  $('disclaimer').hidden = false;
  if (data.type === 'guide') {
    for (const section of data.sections) {
      const card = element('article', 'guide-card');
      card.append(element('h2', '', section.title), element('p', '', section.text.trim()));
      $('menu').append(card);
    }
    return;
  }
  const meal = data.meals[state.meal];
  if (!meal.text || /^[-–—\s]+$/.test(meal.text)) {
    emptyState(m.noMenu, m.noMenuDetail(formatDate(state.date, state.language), m.meals[state.meal]));
    return;
  }
  const card = element('article', 'meal-card');
  const header = element('div', 'card-header');
  header.append(element('h2', '', m.menuTitle(m.meals[state.meal])), element('span', 'time', meal.time || m.noHours));
  const body = element('div', 'menu-body');
  for (const group of meal.text.split(/\n\s*\n/)) {
    const groupNode = element('div', 'menu-group');
    const lines = group.split('\n').filter(Boolean);
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      // Keep a price next to its corner name, whether the source places it
      // on the following line or inside parentheses/brackets on the same line.
      const pricePattern = '(?:₩\\s*\\d[\\d,]*|\\d[\\d,]*\\s*(?:원|KRW|won))';
      const standalonePrice = new RegExp(`^[([]?\\s*(${pricePattern})\\s*[)\\]]?$`, 'i');
      const followingPrice = lines[index + 1]?.match(standalonePrice);
      const inlinePrice = line.length < 100 && line.match(new RegExp(`^(.*?)\\s*[([]\\s*(${pricePattern})\\s*[)\\]]$`, 'i'));
      const onlyPrice = line.match(standalonePrice);
      if (followingPrice || inlinePrice || onlyPrice) {
        const title = followingPrice ? line : inlinePrice ? inlinePrice[1] : '';
        const price = followingPrice ? followingPrice[1] : inlinePrice ? inlinePrice[2] : onlyPrice[1];
        const row = element('div', 'corner-row');
        row.append(element('span', 'corner-title', title), element('span', 'price', price));
        groupNode.append(row);
        if (followingPrice) index++;
        continue;
      }
      let className = 'menu-line';
      if (line.length > 65) className += ' long';
      else if (/kcal/i.test(line)) className += ' calorie';
      else if (/(코너|자율배식|일품|^[([]?[\d,]+원)/.test(line)) className += ' corner';
      groupNode.append(element('p', className, line));
    }
    body.append(groupNode);
  }
  card.append(header, body);
  $('menu').append(card);
}
function usableCache(cached) {
  const text = value => typeof value === 'string' && value.length <= 100000;
  return cached && Number.isFinite(cached.at) && cached.at <= Date.now() && Date.now() - cached.at < CACHE_KEEP &&
    (state.restaurant.guide
      ? cached.data?.type === 'guide' && Array.isArray(cached.data.sections) && cached.data.sections.length <= 50 && cached.data.sections.every(section => section && text(section.title) && text(section.text))
      : cached.data?.type === 'daily' && text(cached.data.notice) && Array.isArray(cached.data.meals) && cached.data.meals.length === 3 && cached.data.meals.every(meal => meal && text(meal.time) && text(meal.text)));
}
async function pruneCache() {
  try {
    const all = await chrome.storage.local.get(null);
    const legacyKeys = Object.keys(all).filter(key => key.startsWith('menu-v1:'));
    const entries = Object.entries(all).filter(([key]) => key.startsWith(CACHE_PREFIX)).sort((a,b) => (b[1]?.at || 0) - (a[1]?.at || 0));
    const expired = entries.filter(([, value], index) => index >= 60 || !value?.at || Date.now() - value.at > CACHE_KEEP).map(([key]) => key);
    if (expired.length || legacyKeys.length) await chrome.storage.local.remove([...expired, ...legacyKeys]);
  } catch { /* Cache cleanup is best effort. */ }
}
async function load(force = false) {
  const version = ++requestVersion;
  controller?.abort();
  const localController = new AbortController();
  controller = localController;
  const restaurant = state.restaurant;
  const date = state.date;
  const language = state.language;
  const m = messages(language);
  const key = `${CACHE_PREFIX}${language}:${restaurant.id}:${restaurant.guide ? 'guide' : date}`;
  state.data = null;
  updateControls();
  $('notice').hidden = true;
  $('notice').open = false;
  $('disclaimer').hidden = true;
  $('scroll-area').scrollTop = 0;
  $('menu').setAttribute('aria-busy', 'true');
  setStatus(m.loading);
  const skeleton = element('div', 'meal-card loading');
  skeleton.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < 7; i++) skeleton.append(element('div', 'skeleton'));
  $('menu').replaceChildren(skeleton);
  const cached = await storage.get(key);
  if (version !== requestVersion) return;
  const hasCache = usableCache(cached);
  if (hasCache) {
    state.data = cached.data;
    render();
    if (!force && Date.now() - cached.at < CACHE_TTL) {
      setStatus();
      $('menu').setAttribute('aria-busy', 'false');
      return;
    }
    setStatus(m.checking);
  }
  const timeout = setTimeout(() => localController.abort(), 12000);
  try {
    const html = await fetchMenuPage(sourceURL(restaurant, date, language), localController.signal, language);
    const data = parseMenu(html, restaurant, date, language);
    if (version !== requestVersion) return;
    const at = Date.now();
    state.data = data;
    render();
    setStatus();
    await storage.set({[key]: {at, data}});
    await pruneCache();
  } catch (error) {
    if (version !== requestVersion) return;
    if (hasCache) {
      setStatus(m.cached, true);
    } else {
      setStatus();
      state.data = null;
      emptyState(m.loadFailed, error.name === 'AbortError' ? m.timeout : error instanceof TypeError ? m.network : error.message, true);
    }
  } finally {
    clearTimeout(timeout);
    if (version === requestVersion) $('menu').setAttribute('aria-busy', 'false');
  }
}
function chooseMeal(index, focus = false) {
  state.meal = index;
  updateControls();
  if (state.data) render();
  $('scroll-area').scrollTop = 0;
  if (focus) $(`tab-${index}`).focus();
}
function changeDate(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(`${date}T12:00:00Z`))) return;
  state.date = date;
  load();
}
async function init() {
  try { await chrome.storage.local.setAccessLevel({accessLevel: 'TRUSTED_CONTEXTS'}); } catch { /* The extension has no content scripts. */ }
  for (const restaurant of RESTAURANTS) {
    const option = element('option', '', restaurantLabel(restaurant.id, state.language));
    option.value = restaurant.id;
    $('restaurant').append(option);
  }
  const [saved, savedLanguage] = await Promise.all([storage.get('restaurant'), storage.get('language')]);
  state.restaurant = RESTAURANTS.find(r => r.id === saved) || state.restaurant;
  state.language = savedLanguage === 'en' ? 'en' : 'ko';
  applyLanguage();
  document.querySelectorAll('[data-language]').forEach(button => {
    button.addEventListener('click', () => {
      if (button.dataset.language === state.language) return;
      state.language = button.dataset.language;
      storage.set({language: state.language});
      applyLanguage();
      load();
    });
  });
  $('restaurant').addEventListener('change', () => {
    state.restaurant = RESTAURANTS.find(r => r.id === $('restaurant').value);
    storage.set({restaurant: state.restaurant.id});
    load();
  });
  $('previous').addEventListener('click', () => changeDate(shiftDate(state.date, -1)));
  $('next').addEventListener('click', () => changeDate(shiftDate(state.date, 1)));
  $('today').addEventListener('click', () => changeDate(seoulDate()));
  $('date-picker').addEventListener('change', event => changeDate(event.target.value));
  $('refresh').addEventListener('click', () => load(true));
  document.querySelectorAll('[data-meal]').forEach(button => {
    button.addEventListener('click', () => chooseMeal(Number(button.dataset.meal)));
    button.addEventListener('keydown', event => {
      const index = state.meal;
      const target = {ArrowRight: (index + 1) % 3, ArrowLeft: (index + 2) % 3, Home: 0, End: 2}[event.key];
      if (target !== undefined) {event.preventDefault(); chooseMeal(target, true);}
    });
  });
  load();
  await pruneCache();
}
init();
