import {messages} from './locales.js';

export const RESTAURANTS = [
  {id: 'fclt', name: '카이마루', detail: '북측 카페테리아'},
  {id: 'west', name: '서맛골', detail: '서측 식당'},
  {id: 'east1', name: '동맛골', detail: '동측 학생식당'},
  {id: 'east2', name: '동맛골', detail: '동측 교직원식당'},
  {id: 'emp', name: '교수회관', detail: 'N6'},
  {id: 'icc', name: '문지캠퍼스', detail: '구내식당'},
  {id: 'hawam', name: '화암 기숙사식당', detail: ''},
  {id: 'seoul', name: '서울캠퍼스', detail: '구내식당'},
  {id: 'fclt_cafe', name: '카이마루', detail: '푸드코트', guide: true},
  {id: 'east2_cafe', name: '패컬티 클럽', detail: '', guide: true},
  {id: 'big_cafe', name: '더큰 도시락', detail: '', guide: true},
  {id: 'taeul_cafe', name: '태울관 식당', detail: '', guide: true},
];
export const MEALS = ['아침', '점심', '저녁'];
export const BASE_URL = 'https://www.kaist.ac.kr/kr/html/campus/053001.html';

export function seoulDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'}).formatToParts(now);
  const value = type => parts.find(part => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}
export function currentMeal(now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Seoul', hour: '2-digit', hourCycle: 'h23'}).format(now));
  return hour < 10 ? 0 : hour < 15 ? 1 : 2;
}
export function shiftDate(date, days) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function formatDate(date, language = 'ko') {
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'ko-KR', {timeZone: 'UTC', month: language === 'en' ? 'short' : 'long', day: 'numeric', weekday: 'short'}).format(new Date(`${date}T12:00:00Z`));
}
export function sourceURL(restaurant, date, language = 'ko') {
  const url = new URL(BASE_URL);
  if (language === 'en') url.pathname = url.pathname.replace('/kr/', '/en/');
  url.searchParams.set('dvs_cd', restaurant.id);
  if (!restaurant.guide) url.searchParams.set('stt_dt', date);
  return url.href;
}

// Read text only; no source HTML, images, scripts, or event handlers enter the popup.
export function readText(node) {
  function visit(item) {
    if (item.nodeType === 3) return item.textContent.replace(/[\r\n\t]+/g, ' ');
    if (item.nodeType !== 1) return '';
    if (['SCRIPT', 'STYLE', 'IFRAME', 'NOSCRIPT'].includes(item.tagName)) return '';
    if (item.tagName === 'BR') return '\n';
    if (item.tagName === 'TR') return [...item.children].map(visit).map(s => s.trim()).filter(Boolean).join(' · ') + '\n';
    const text = [...item.childNodes].map(visit).join('');
    return /^(P|DIV|LI|UL|H[1-6]|TABLE|TR)$/.test(item.tagName) ? `${text}\n` : text;
  }
  return visit(node).replace(/\u00a0/g, ' ').split('\n').map(s => s.replace(/[ \t]+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

export function parseMenu(html, restaurant, date, language = 'ko') {
  const m = messages(language);
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const root = doc.querySelector('#txt');
  if (!root) throw new Error(m.invalidPage);
  const selected = root.querySelector('.s0503 .col6 li.on a');
  if (!selected || new URL(selected.getAttribute('href'), BASE_URL).searchParams.get('dvs_cd') !== restaurant.id) {
    throw new Error(m.wrongRestaurant);
  }
  if (restaurant.guide) {
    const copy = root.cloneNode(true);
    copy.querySelectorAll('.s0503, form, script, style, h3').forEach(node => node.remove());
    const sections = [];
    let section = {title: m.guideTitle, text: ''};
    function walk(node) {
      if (node.nodeType !== 1) return;
      if (node.tagName === 'H4') {
        if (section.text.trim()) sections.push(section);
        section = {title: readText(node), text: ''};
      } else if (['TABLE', 'UL', 'P'].includes(node.tagName) || node.classList.contains('tip')) {
        section.text += readText(node) + '\n\n';
      } else {
        [...node.children].forEach(walk);
      }
    }
    walk(copy);
    if (section.text.trim()) sections.push(section);
    if (!sections.length) {
      const text = readText(copy);
      if (text) sections.push({title: m.guideTitle, text});
    }
    if (!sections.length) throw new Error(m.noGuide);
    return {type: 'guide', sections};
  }
  const item = root.querySelector('#tab_item_1');
  // The site's weekday links always point to the current week, even for a
  // requested date in another week. Its menu heading reflects the actual date.
  const datePattern = language === 'en' ? /(\d{1,2})\/(\d{1,2})\s*\((Sun|Mon|Tue|Wed|Thu|Fri|Sat)\)/ : /메뉴 안내\s*-\s*(\d{1,2})\/(\d{1,2})\s*\(([일월화수목금토])\)/;
  const headingDate = item?.querySelector('h3')?.textContent.match(datePattern);
  const weekdays = language === 'en' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : [...'일월화수목금토'];
  const requested = new Date(`${date}T12:00:00Z`);
  if (!headingDate || Number(headingDate[1]) !== requested.getUTCMonth() + 1 || Number(headingDate[2]) !== requested.getUTCDate() || headingDate[3] !== weekdays[requested.getUTCDay()]) {
    throw new Error(m.wrongDate);
  }
  const headers = [...(item?.querySelectorAll('table thead th') || [])];
  const cells = [...(item?.querySelectorAll('table tbody tr:first-child > td') || [])];
  const mealLabels = language === 'en' ? ['Breakfast', 'Lunch', 'Dinner'] : ['조식', '중식', '석식'];
  if (headers.length !== 3 || cells.length !== 3 || !headers.every((th, i) => readText(th).startsWith(mealLabels[i]))) {
    throw new Error(m.invalidTable);
  }
  return {
    type: 'daily',
    notice: [...item.querySelectorAll(':scope > p')].map(readText).join('\n\n'),
    meals: headers.map((header, index) => ({
      time: readText(header).slice(mealLabels[index].length).trim().replace(/^[-–—]$/, '').trim(),
      text: readText(cells[index]),
    })),
  };
}
