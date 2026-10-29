const LABELS = {
  fclt: ['카이마루 · 북측', 'Kaimaru · North'],
  west: ['서맛골 · 서측', 'West · Student'],
  east1: ['동맛골 · 학생', 'East · Student'],
  east2: ['동맛골 · 교직원', 'East · Faculty'],
  emp: ['교수회관 · N6', 'Faculty · N6'],
  icc: ['문지캠퍼스', 'Munji Campus'],
  hawam: ['화암 기숙사식당', 'Hwa-am Dormitory'],
  seoul: ['서울캠퍼스', 'Seoul Campus'],
  fclt_cafe: ['카이마루 · 푸드코트', 'Kaimaru · Food Court'],
  east2_cafe: ['패컬티 클럽', 'Faculty Club'],
  big_cafe: ['더큰 도시락', 'Durken Dosirak'],
  taeul_cafe: ['태울관 식당', 'Taeulgwan'],
};

export function restaurantLabel(id, language) {
  return LABELS[id][language === 'en' ? 1 : 0];
}

const MESSAGES = {
  ko: {
    title: 'KaiBab · KAIST 식단', selectMenu: '식단 선택', restaurant: '식당 선택', refresh: '식단 새로고침',
    previous: '이전 날짜', next: '다음 날짜', date: '날짜 선택', today: '오늘', goToday: '오늘 날짜로 이동',
    mealTime: '식사 시간', menu: '식단', meals: ['아침', '점심', '저녁'],
    menuTitle: meal => `${meal} 메뉴`, guide: '고정 메뉴 · 운영 안내', guideTitle: '이용 안내',
    notice: '운영시간 · 가격 · 알레르기 안내', disclaimer: '식당 사정에 따라 메뉴가 변경될 수 있어요.',
    retry: '다시 불러오기', noMenu: '등록된 식단이 없어요',
    noMenuDetail: (date, meal) => `${date} ${meal} 식단이 비어 있어요.\n다른 시간대나 날짜를 선택해 주세요.`,
    noHours: '운영시간 미등록', loading: '식단을 불러오는 중이에요…', checking: '저장된 식단이에요. 최신 내용을 확인하고 있어요…',
    cached: '연결하지 못해 마지막으로 저장된 내용을 보여드려요. 최신 식단과 다를 수 있어요.',
    loadFailed: '식단을 불러오지 못했어요', timeout: '사이트의 응답이 늦어지고 있어요.\n잠시 후 다시 시도해 주세요.',
    network: '인터넷 연결을 확인한 뒤 다시 시도해 주세요.', http: status => `식단 사이트 응답 오류 (${status}). 잠시 후 다시 시도해 주세요.`,
    invalidPage: '식단 페이지의 형식을 확인할 수 없어요. 잠시 후 다시 시도해 주세요.',
    wrongRestaurant: '요청한 식당과 응답이 달라요. 잠시 후 다시 시도해 주세요.',
    noGuide: '등록된 이용 안내를 찾을 수 없어요. 잠시 후 다시 시도해 주세요.',
    wrongDate: '선택한 날짜의 식단을 확인할 수 없어요. 다른 날짜를 선택해 주세요.',
    invalidTable: '식단 표의 형식이 변경되었어요. 잠시 후 다시 시도해 주세요.',
  },
  en: {
    title: 'KaiBab · KAIST Menu', selectMenu: 'Menu selection', restaurant: 'Select cafeteria', refresh: 'Refresh menu',
    previous: 'Previous day', next: 'Next day', date: 'Choose date', today: 'Today', goToday: 'Go to today',
    mealTime: 'Meal time', menu: 'Menu', meals: ['Breakfast', 'Lunch', 'Dinner'],
    menuTitle: meal => meal, guide: 'Regular menus & dining information', guideTitle: 'Dining information',
    notice: 'Hours, prices & allergens', disclaimer: 'Menus may change depending on cafeteria circumstances.',
    retry: 'Try again', noMenu: 'No menu posted',
    noMenuDetail: (date, meal) => `No ${meal.toLowerCase()} menu is posted for ${date}.\nTry another meal or date.`,
    noHours: 'Hours not listed', loading: 'Loading menu…', checking: 'Showing a saved menu. Checking for updates…',
    cached: 'Unable to connect. Showing a saved menu that may be out of date.',
    loadFailed: 'Unable to load menu', timeout: 'The cafeteria website is taking too long to respond.\nPlease try again shortly.',
    network: 'Please check your internet connection and try again.', http: status => `The cafeteria website returned an error (${status}). Please try again.`,
    invalidPage: 'The menu page could not be read. Please try again shortly.',
    wrongRestaurant: 'The website returned a different cafeteria. Please try again.',
    noGuide: 'No dining information could be found. Please try again shortly.',
    wrongDate: 'The menu does not match the selected date. Please choose another date.',
    invalidTable: 'The menu format has changed. Please try again shortly.',
  },
};

export function messages(language) {
  return MESSAGES[language === 'en' ? 'en' : 'ko'];
}
