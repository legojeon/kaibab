const LABELS = {
  fclt: ['카이마루 · 북측', 'Kaimaru · North'],
  west: ['서맛골 · 서측', 'West · Student'],
  east1: ['동맛골 · 학생', 'East · Graduate'],
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
    menuTitle: meal => `${meal} 메뉴`, guide: '메뉴 · 이용 안내', guideTitle: '이용 안내',
    notice: '식당 공지', disclaimer: '메뉴·운영시간·가격은 식당 사정에 따라 달라질 수 있어요.',
    retry: '다시 불러오기', noMenu: '표시할 식단이 없어요',
    noMenuDetail: (date, meal) => `${date} ${meal} 식단을 찾지 못했어요.\n다른 시간대나 날짜를 선택해 주세요.`,
    noHours: '운영시간 정보 없음', loading: '식단을 불러오는 중이에요…', checking: '저장된 식단이에요. 원문을 다시 확인하고 있어요…',
    cached: '새 내용을 불러오지 못해 저장된 내용을 보여드려요. 최신 정보와 다를 수 있어요.',
    loadFailed: '식단을 불러오지 못했어요', timeout: '사이트의 응답이 늦어지고 있어요.\n잠시 후 다시 시도해 주세요.',
    network: '요청을 완료하지 못했어요. 인터넷 연결을 확인하거나 잠시 후 다시 시도해 주세요.', http: status => `식단 사이트 응답 오류 (${status}). 잠시 후 다시 시도해 주세요.`,
    invalidPage: '식단 페이지의 형식을 확인할 수 없어요. 잠시 후 다시 시도해 주세요.',
    wrongRestaurant: '선택한 식당의 정보를 확인할 수 없어요. 잠시 후 다시 시도해 주세요.',
    noGuide: '이용 안내를 찾을 수 없어요. 잠시 후 다시 시도해 주세요.',
    wrongDate: '선택한 날짜의 식단을 확인할 수 없어요. 다른 날짜를 선택해 주세요.',
    invalidTable: '식단 표를 읽을 수 없어요. 잠시 후 다시 시도해 주세요.',
  },
  en: {
    title: 'KaiBab · KAIST Menu', selectMenu: 'Menu selection', restaurant: 'Select cafeteria', refresh: 'Refresh menu',
    previous: 'Previous day', next: 'Next day', date: 'Choose date', today: 'Today', goToday: 'Go to today',
    mealTime: 'Meal time', menu: 'Menu', meals: ['Breakfast', 'Lunch', 'Dinner'],
    menuTitle: meal => meal, guide: 'Menus & dining information', guideTitle: 'Dining information',
    notice: 'Cafeteria notices', disclaimer: 'Menus, hours and prices may change.',
    retry: 'Try again', noMenu: 'No menu to display',
    noMenuDetail: (date, meal) => `No ${meal.toLowerCase()} menu was found for ${date}.\nTry another meal or date.`,
    noHours: 'Hours unavailable', loading: 'Loading menu…', checking: 'Showing a saved menu. Checking for updates…',
    cached: 'Could not load an update. Showing a saved menu that may be out of date.',
    loadFailed: 'Unable to load menu', timeout: 'The cafeteria website is taking too long to respond.\nPlease try again shortly.',
    network: 'The request could not be completed. Check your connection or try again later.', http: status => `The cafeteria website returned an error (${status}). Please try again.`,
    invalidPage: 'The menu page could not be read. Please try again shortly.',
    wrongRestaurant: 'The selected cafeteria could not be confirmed. Please try again.',
    noGuide: 'No dining information could be found. Please try again shortly.',
    wrongDate: 'The menu date could not be confirmed. Please choose another date.',
    invalidTable: 'The menu table could not be read. Please try again shortly.',
  },
};

export function messages(language) {
  return MESSAGES[language === 'en' ? 'en' : 'ko'];
}
