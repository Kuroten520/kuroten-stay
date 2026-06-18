/* ============================================================
   Kuroten Stay Sapporo — i18n.js
   多言語切り替え (ja / en / zh)
   ============================================================ */

(function () {
  'use strict';

  const TRANSLATIONS = {
    ja: {
      /* === ナビ === */
      'nav.properties': '物件',
      'nav.access': 'アクセス',

      /* === ヒーロー === */
      'hero.eyebrow': '北海道 札幌 ／ 貸切ゲストハウス',
      'hero.subtitle': '札幌で暮らすように、家族でくつろぐ',
      'hero.cta': '予約・空き確認',

      /* === プロパティ紹介 === */
      'properties.eyebrow': 'Our Properties',
      'properties.title': '施設のご案内',
      'properties.desc': 'HOKKAIDO EARTHは、札幌市内に4つの貸切ゲストハウスをご用意しています。\nグループ旅行・ファミリー・カップルまで、さまざまなニーズにお応えします。',
      'card.guests': '最大',
      'card.rooms': '部屋',

      /* === スペック === */
      'spec.capacity': '定員',
      'spec.persons': '名',
      'spec.beds': 'ベッド数',
      'spec.beds.unit': '台',
      'spec.bedrooms': '寝室',
      'spec.rooms.unit': '部屋',
      'spec.bathrooms': 'バスルーム',
      'spec.address': '住所',

      /* === チェックイン === */
      'checkin.label': 'チェックイン',
      'checkin.selfcheck': '（キーボックスによるセルフチェックイン）',
      'checkout.label': 'チェックアウト',
      'parking.label': '駐車場',

      /* === アメニティ === */
      'amenities.title': 'アメニティ',
      'amenity.ac': 'エアコン',
      'amenity.heat': '暖房',
      'amenity.wifi': 'Wi-Fi',
      'amenity.washer': '洗濯乾燥機',
      'amenity.fridge': '冷蔵庫',
      'amenity.microwave': '電子レンジ',
      'amenity.kettle': 'ケトル',
      'amenity.kitchen': 'キッチン',
      'amenity.coffee': 'コーヒーメーカー',
      'amenity.shampoo': 'シャンプー・コンディショナー',
      'amenity.towel': 'バスタオル・フェイスタオル',
      'amenity.dryer': 'ヘアドライヤー',
      'amenity.toothbrush': '歯ブラシ',

      /* === 清掃 === */
      'cleaning.desc': '全てのお部屋で徹底した清掃・消毒を行っています。チェックアウト後、プロによる清掃・消毒が行われます。ベッドシーツやタオルなどは全て綺麗なものと毎回交換。',

      /* === 物件説明 === */
      'sun.desc': '新築で綺麗な、広々とした1軒家です。トイレは2つ、バスタブ付きお風呂1つ、シャワールーム1つがあります。1階から3階まである、147平米の広々空間のうち2階にはキッチン、ダイニング、リビングがあり、駐車場は車庫で、1階部分に1台分ご用意しております（車の高さ制限2550mm以下）。全部屋にエアコン、ヒーター共に設置しており、安心安全快適なご宿泊をお約束致します。ベビーベッドも1台設置しております。',
      'sun.parking': '車庫付き1台（車高制限2550mm以下）',
      'moon.desc': '新築・広々とした3階建て一軒家。最大12名まで宿泊可能で、豊平区美園の閑静な住宅街に位置しています。広いリビングダイニング、完備されたキッチン、2つのバスルームを備え、大人数でのご旅行に最適です。',
      'moon.parking': '駐車場1台あり',
      'smile.desc': '東区北8条東に位置する広々とした一軒家。最大10名が宿泊できる4部屋を備えています。明るく開放的なリビングと充実したキッチン設備で、グループ旅行やファミリー旅行に最適です。',
      'smile.parking': '駐車場1台あり',
      'sky.desc': '東区北9条東11丁目の静かな住宅街にある2階建て一軒家。最大10名まで宿泊でき、2つのゆったりとした寝室を備えています。シンプルで清潔感のある内装で、くつろぎのひとときをお過ごしいただけます。',
      'sky.parking': '駐車場あり',

      /* === CTA === */
      'cta.book': 'この施設を予約する',

      /* === アクセス === */
      'access.eyebrow': 'Access',
      'access.title': 'アクセス',
      'access.airport': '新千歳空港から',
      'access.airport.time': '車で約50分 / 電車＋地下鉄で約70分',
      'access.station': '最寄り駅',
      'access.note': '各施設へのルートはGoogleマップをご参照ください。',

      /* === フッター === */
      'footer.about': 'Kuroten Stay Sapporoは、札幌市内に4つの貸切ゲストハウスを展開しています。',
      'footer.links': 'クイックリンク',
      'footer.contact': 'お問い合わせ',
      'footer.copyright': '© 2025 Kuroten Stay Sapporo. All rights reserved.',
    },

    en: {
      /* === Nav === */
      'nav.properties': 'Properties',
      'nav.access': 'Access',

      /* === Hero === */
      'hero.eyebrow': 'Hokkaido, Sapporo / Exclusive Guesthouses',
      'hero.subtitle': 'Live like a local, relax like a family',
      'hero.cta': 'Check Availability',

      /* === Properties === */
      'properties.eyebrow': 'Our Properties',
      'properties.title': 'Our Facilities',
      'properties.desc': 'HOKKAIDO EARTH offers four exclusive guesthouses in Sapporo.\nPerfect for group trips, families, and couples.',
      'card.guests': 'Up to',
      'card.rooms': 'rooms',

      /* === Specs === */
      'spec.capacity': 'Capacity',
      'spec.persons': ' guests',
      'spec.beds': 'Beds',
      'spec.beds.unit': '',
      'spec.bedrooms': 'Bedrooms',
      'spec.rooms.unit': '',
      'spec.bathrooms': 'Bathrooms',
      'spec.address': 'Address',

      /* === Check-in === */
      'checkin.label': 'Check-in',
      'checkin.selfcheck': '(Self check-in with key box)',
      'checkout.label': 'Check-out',
      'parking.label': 'Parking',

      /* === Amenities === */
      'amenities.title': 'Amenities',
      'amenity.ac': 'Air Conditioning',
      'amenity.heat': 'Heating',
      'amenity.wifi': 'Wi-Fi',
      'amenity.washer': 'Washer/Dryer',
      'amenity.fridge': 'Refrigerator',
      'amenity.microwave': 'Microwave',
      'amenity.kettle': 'Electric Kettle',
      'amenity.kitchen': 'Full Kitchen',
      'amenity.coffee': 'Coffee Maker',
      'amenity.shampoo': 'Shampoo & Conditioner',
      'amenity.towel': 'Bath & Face Towels',
      'amenity.dryer': 'Hair Dryer',
      'amenity.toothbrush': 'Toothbrush',

      /* === Cleaning === */
      'cleaning.desc': 'Thorough cleaning and disinfection in all rooms. After each checkout, professional cleaning and disinfection is performed. All bedsheets and towels are replaced fresh every time.',

      /* === Property Descriptions === */
      'sun.desc': 'A spacious, brand-new house. Features 2 toilets, 1 bathtub bathroom, and 1 shower room across 3 floors (147 sqm). The 2nd floor has a kitchen, dining, and living room. Garage parking for 1 car (height limit 2550mm). All rooms have air conditioning and heating. Baby cot available.',
      'sun.parking': 'Garage parking for 1 car (height limit 2550mm)',
      'moon.desc': 'A brand-new, spacious 3-story house accommodating up to 12 guests, located in the quiet residential Misono neighborhood. Features a large living/dining area, full kitchen, and 2 bathrooms. Perfect for large groups.',
      'moon.parking': 'Parking for 1 car',
      'smile.desc': 'A spacious house in Higashi Ward, accommodating up to 10 guests in 4 bedrooms. Bright open living room and fully equipped kitchen make it perfect for group and family trips.',
      'smile.parking': 'Parking for 1 car',
      'sky.desc': 'A 2-story house in the quiet Higashi Ward, accommodating up to 10 guests in 2 spacious bedrooms. Simple, clean interior for a relaxing stay.',
      'sky.parking': 'Parking available',

      /* === CTA === */
      'cta.book': 'Book This Property',

      /* === Access === */
      'access.eyebrow': 'Access',
      'access.title': 'Getting Here',
      'access.airport': 'From New Chitose Airport',
      'access.airport.time': 'Approx. 50 min by car / 70 min by train + subway',
      'access.station': 'Nearest Station',
      'access.note': 'Please refer to Google Maps for directions to each property.',

      /* === Footer === */
      'footer.about': 'Kuroten Stay Sapporo operates four exclusive guesthouses in Sapporo.',
      'footer.links': 'Quick Links',
      'footer.contact': 'Contact',
      'footer.copyright': '© 2025 Kuroten Stay Sapporo. All rights reserved.',
    },

    zh: {
      /* === 导航 === */
      'nav.properties': '房源',
      'nav.access': '交通',

      /* === 英雄区域 === */
      'hero.eyebrow': '北海道 札幌 / 整栋民宿',
      'hero.subtitle': '像当地人一样生活，像家人一样放松',
      'hero.cta': '查看空房',

      /* === 房源介绍 === */
      'properties.eyebrow': 'Our Properties',
      'properties.title': '房源介绍',
      'properties.desc': 'HOKKAIDO EARTH在札幌市内提供四栋独立民宿。\n适合团体旅行、家庭出游和情侣旅行。',
      'card.guests': '最多',
      'card.rooms': '间房',

      /* === 规格 === */
      'spec.capacity': '定员',
      'spec.persons': '人',
      'spec.beds': '床位',
      'spec.beds.unit': '张',
      'spec.bedrooms': '卧室',
      'spec.rooms.unit': '间',
      'spec.bathrooms': '浴室',
      'spec.address': '地址',

      /* === 入住/退房 === */
      'checkin.label': '入住时间',
      'checkin.selfcheck': '（密码箱自助入住）',
      'checkout.label': '退房时间',
      'parking.label': '停车场',

      /* === 设施 === */
      'amenities.title': '设施',
      'amenity.ac': '空调',
      'amenity.heat': '暖气',
      'amenity.wifi': 'Wi-Fi',
      'amenity.washer': '洗衣烘干机',
      'amenity.fridge': '冰箱',
      'amenity.microwave': '微波炉',
      'amenity.kettle': '电热水壶',
      'amenity.kitchen': '厨房',
      'amenity.coffee': '咖啡机',
      'amenity.shampoo': '洗发水・护发素',
      'amenity.towel': '浴巾・毛巾',
      'amenity.dryer': '吹风机',
      'amenity.toothbrush': '牙刷',

      /* === 清洁 === */
      'cleaning.desc': '所有房间均进行彻底清洁和消毒。每次退房后，由专业人员进行清洁和消毒。床单、毛巾等每次均更换全新的。',

      /* === 房源描述 === */
      'sun.desc': '全新宽敞的独栋住宅，拥有2个厕所、1个带浴缸的浴室和1个淋浴间，共3层（147平方米）。2楼设有厨房、餐厅和客厅。车库可停1辆车（高度限制2550mm）。所有房间配备空调和暖气。提供婴儿床。',
      'sun.parking': '车库停车位1个（高度限制2550mm）',
      'moon.desc': '全新宽敞的3层独栋住宅，最多可容纳12人，位于丰平区美园的安静住宅区。宽敞的客餐厅、完整厨房设备及2个浴室，非常适合大团体旅行。',
      'moon.parking': '停车位1个',
      'smile.desc': '位于东区北8条东的宽敞独栋，4间卧室最多可容纳10人。明亮开放的客厅和齐全的厨房设施，非常适合团体和家庭旅行。',
      'smile.parking': '停车位1个',
      'sky.desc': '位于东区北9条东11丁目安静住宅区的2层独栋，2间宽敞卧室最多可容纳10人。简洁清爽的室内装潢，让您尽情放松。',
      'sky.parking': '提供停车位',

      /* === CTA === */
      'cta.book': '预订此房源',

      /* === 交通 === */
      'access.eyebrow': 'Access',
      'access.title': '交通方式',
      'access.airport': '从新千岁机场',
      'access.airport.time': '开车约50分钟 / 火车+地铁约70分钟',
      'access.station': '最近车站',
      'access.note': '请参考谷歌地图查看各房源的路线。',

      /* === 页脚 === */
      'footer.about': 'Kuroten Stay Sapporo 在札幌市内运营四栋独立民宿。',
      'footer.links': '快速链接',
      'footer.contact': '联系方式',
      'footer.copyright': '© 2025 Kuroten Stay Sapporo. 版权所有。',
    }
  };

  let currentLang = 'ja';

  function applyTranslations(lang) {
    const t = TRANSLATIONS[lang];
    if (!t) return;
    currentLang = lang;

    document.documentElement.lang = lang;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) {
        el.textContent = t[key];
      }
    });

    // Update lang buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      const active = btn.dataset.lang === lang;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-pressed', String(active));
    });

    // Save preference
    try {
      localStorage.setItem('kuroten-lang', lang);
    } catch (e) {}
  }

  function getStoredLang() {
    try {
      return localStorage.getItem('kuroten-lang');
    } catch (e) {
      return null;
    }
  }

  function getBrowserLang() {
    const nav = navigator.language || navigator.userLanguage || 'ja';
    if (nav.startsWith('zh')) return 'zh';
    if (nav.startsWith('en')) return 'en';
    return 'ja';
  }

  function initI18n() {
    const stored = getStoredLang();
    const initial = stored || getBrowserLang();

    // Bind lang buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        if (lang && TRANSLATIONS[lang]) {
          applyTranslations(lang);
        }
      });
    });

    // Apply initial language
    applyTranslations(initial);
  }

  // Expose API
  window.KurotenI18n = {
    setLang: applyTranslations,
    getLang: () => currentLang,
    t: (key) => (TRANSLATIONS[currentLang] || {})[key] || key,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
  } else {
    initI18n();
  }
})();
