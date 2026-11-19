(function (globalScope) {
  'use strict';

  const DEFAULT_SHEET_ID = '1Fi_2OYvhbuii5sqEGOT5n5EWnjiYqSi-6nlnPFzBp7g';
  const DEFAULT_SHEET_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SHEET_ID}/edit`;
  const DEFAULT_SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SHEET_ID}/export?format=csv`;

  const DEFAULT_CENTER = { lat: 24.1558, lng: 120.6822 };
  const CATEGORIES = ['全部', '健康餐', '早午餐', '便當飯類', '麵食小吃', '鍋物熱炒'];
  const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const CLOSING_SOON_MINS = 30;
  const FETCH_TIMEOUT_MS = 6000;

  const STORAGE_KEYS = {
    placesCache: 'meal_picker_places_cache_v1',
    history: 'meal_picker_history_v1',
    prefs: 'meal_picker_minimal_prefs_v1'
  };

  // 內建完整 49 間正規化種子資料（離線秒開保證）
  const DEFAULT_PLACES = [
    { id: 'p01', name: '木舍沙拉專業店', category: '健康餐', rating: 4.2, reviews: 2442, lat: 24.1662468, lng: 120.6848374, hours: { mon: '09:00-23:00', tue: '09:00-23:00', wed: '09:00-23:00', thu: '09:00-23:00', fri: '09:00-23:00', sat: '09:00-23:00', sun: '休' }, maps_url: 'https://maps.google.com/?cid=12957519341579987080', note: '平價沙拉、日本balmuda厚片、熱壓吐司、莊園級咖啡', enabled: true },
    { id: 'p02', name: 'Mr.body健身舒肥水煮餐盒 中友店', category: '健康餐', rating: 4.1, reviews: 331, lat: 24.1521856, lng: 120.6827522, hours: { mon: '11:00-14:00,16:30-19:30', tue: '11:00-14:00,16:30-19:30', wed: '11:00-14:00,16:30-19:30', thu: '11:00-14:00,16:30-19:30', fri: '11:00-14:00,16:30-19:30', sat: '11:00-14:00,16:30-19:30', sun: '休' }, maps_url: 'https://maps.google.com/?cid=2149171105487038388', note: '舒肥水煮餐盒', enabled: true },
    { id: 'p03', name: '糧倉 纖健水煮 台中柳川總店', category: '健康餐', rating: 4.2, reviews: 445, lat: 24.1515418, lng: 120.6794845, hours: { mon: '11:00-14:00,17:00-20:00', tue: '11:00-14:00,17:00-20:00', wed: '11:00-14:00,17:00-20:00', thu: '11:00-14:00,17:00-20:00', fri: '11:00-14:00,17:00-20:00', sat: '11:00-14:00,17:00-20:00', sun: '11:00-14:00,17:00-20:00' }, maps_url: 'https://maps.google.com/?cid=9772306123711730771', note: '水煮健康餐盒', enabled: true },
    { id: 'p04', name: 'G本煮藝手作餐盒專賣店', category: '健康餐', rating: 4.5, reviews: 35, lat: 24.1604661, lng: 120.6824335, hours: { mon: '10:30-13:30,16:30-20:30', tue: '10:30-13:30,16:30-20:30', wed: '10:30-13:30,16:30-20:30', thu: '10:30-13:30,16:30-20:30', fri: '10:30-13:30', sat: '休', sun: '10:30-13:30,16:30-20:30' }, maps_url: 'https://maps.google.com/?cid=11798317198461245568', note: '手作健康餐盒', enabled: true },
    { id: 'p05', name: '里奇 健康餐盒 五義店', category: '健康餐', rating: 3.9, reviews: 541, lat: 24.153984, lng: 120.681047, hours: { mon: '11:30-14:00,16:30-20:30', tue: '11:30-14:00,16:30-20:30', wed: '11:30-14:00,16:30-20:30', thu: '11:30-14:00,16:30-20:30', fri: '11:30-14:00,16:30-20:30', sat: '休', sun: '休' }, maps_url: 'https://maps.google.com/?cid=11891391584732575684', note: '健康餐盒、舒肥雞胸', enabled: true },
    { id: 'p06', name: '順帶好食', category: '早午餐', rating: 4.5, reviews: 140, lat: 24.1586766, lng: 120.6797861, hours: { mon: '06:30-13:30', tue: '06:30-13:30', wed: '06:30-13:30', thu: '06:30-13:30', fri: '06:30-01:30', sat: '休', sun: '休' }, maps_url: 'https://maps.google.com/?cid=12479460233963182454', note: '健康早餐、三明治專賣', enabled: true },
    { id: 'p07', name: '約翰煮的 學士店', category: '健康餐', rating: 4.4, reviews: 200, lat: 24.1586583, lng: 120.6810963, hours: { mon: '11:00-19:30', tue: '11:00-19:30', wed: '11:00-19:30', thu: '11:00-19:30', fri: '11:00-19:30', sat: '10:30-13:30', sun: '休' }, maps_url: 'https://maps.google.com/?cid=3916462128147886661', note: '紫米飯、舒肥健康餐盒', enabled: true },
    { id: 'p08', name: '漸健健康餐', category: '健康餐', rating: 4.7, reviews: 1047, lat: 24.1630386, lng: 120.6800448, hours: { mon: '11:00-13:30,17:00-19:30', tue: '11:00-13:30,17:00-19:30', wed: '11:00-13:30,17:00-19:30', thu: '11:00-13:30,17:00-19:30', fri: '11:00-13:30,17:00-19:30', sat: '休', sun: '11:00-13:30,17:00-19:30' }, maps_url: 'https://maps.google.com/?cid=11161578192712735232', note: '健康餐盒、打拋豬、泰式咖哩雞', enabled: true },
    { id: 'p09', name: '镹悅古早味蛋餅', category: '早午餐', rating: 4.6, reviews: 114, lat: 24.1582796, lng: 120.6812843, hours: { mon: '06:30-12:30', tue: '06:30-12:30', wed: '06:30-12:30', thu: '06:30-12:30', fri: '06:30-12:30', sat: '06:30-11:30', sun: '休' }, maps_url: 'https://maps.google.com/?cid=17480595910617764491', note: '粉漿古早味蛋餅（售完為止）', enabled: true },
    { id: 'p10', name: 'Q飯糰', category: '早午餐', rating: 4.9, reviews: 185, lat: 24.1582103, lng: 120.6812337, hours: { mon: '06:30-10:00', tue: '06:30-10:00', wed: '休', thu: '06:30-10:00', fri: '06:30-10:00', sat: '06:30-11:00', sun: '06:30-11:00' }, maps_url: 'https://maps.google.com/?cid=9652915579746016614', note: '傳統飯糰、紫米飯糰', enabled: true },
    { id: 'p11', name: '早到晚到 台中梅亭店', category: '早午餐', rating: 3.5, reviews: 39, lat: 24.1602267, lng: 120.6817508, hours: { mon: '17:00-01:00', tue: '17:00-01:00', wed: '17:00-01:00', thu: '17:00-01:00', fri: '17:00-01:00', sat: '17:00-01:00', sun: '17:00-01:00' }, maps_url: 'https://maps.google.com/?cid=14096343981116919111', note: '晚餐宵夜早午餐、吐司蛋餅炒泡麵', enabled: true },
    { id: 'p12', name: '天津小狗子湯包豆漿店', category: '早午餐', rating: 3.9, reviews: 916, lat: 24.1648594, lng: 120.6825434, hours: { mon: '03:30-11:00', tue: '03:30-11:00', wed: '休', thu: '休', fri: '03:30-11:00', sat: '03:30-11:00', sun: '03:30-11:00' }, maps_url: 'https://maps.google.com/?cid=6420032158300373428', note: '手工湯包、豆漿、中式早點', enabled: true },
    { id: 'p13', name: '崇德來來羊肉爐', category: '鍋物熱炒', rating: 4.4, reviews: 231, lat: 24.1608196, lng: 120.6847019, hours: { mon: '16:00-23:00', tue: '16:00-23:00', wed: '16:00-23:00', thu: '16:00-23:00', fri: '16:00-23:00', sat: '16:00-23:00', sun: '16:00-23:00' }, maps_url: 'https://maps.google.com/?cid=12688203321266248805', note: '蔬果湯頭羊肉爐、熱炒', enabled: true },
    { id: 'p14', name: '育中新村 一中總本舖', category: '麵食小吃', rating: 4.4, reviews: 430, lat: 24.1616494, lng: 120.685488, hours: { mon: '11:00-03:00', tue: '11:00-03:00', wed: '11:00-21:00', thu: '11:00-03:00', fri: '11:00-03:00', sat: '11:00-21:00', sun: '11:00-03:00' }, maps_url: 'https://maps.google.com/?cid=3228030812749710914', note: '牛肉麵、蓋飯、鍋燒麵', enabled: true },
    { id: 'p15', name: '黑皮麻辣乾麵', category: '麵食小吃', rating: 4.5, reviews: 714, lat: 24.1644425, lng: 120.6824971, hours: { mon: '11:00-14:00,17:00-20:00', tue: '11:00-14:00,17:00-20:00', wed: '休', thu: '11:00-14:00,17:00-20:00', fri: '11:00-14:00,17:00-20:00', sat: '11:00-14:00,17:00-20:00', sun: '11:00-14:00,17:00-20:00' }, maps_url: 'https://maps.google.com/?cid=13120036728209737303', note: '麻辣乾麵、麻醬麵、麻辣臭豆腐', enabled: true },
    { id: 'p16', name: '龍廚素食', category: '麵食小吃', rating: 4.7, reviews: 665, lat: 24.1643158, lng: 120.6824586, hours: { mon: '11:00-13:30,17:00-19:30', tue: '休', wed: '11:00-13:30,17:00-19:30', thu: '11:00-13:30,17:00-19:30', fri: '11:00-13:30,17:00-19:30', sat: '11:00-13:30,17:00-19:30', sun: '11:00-13:30,17:00-19:30' }, maps_url: 'https://maps.google.com/?cid=15235337823045913027', note: '純素無蛋無奶無五辛・台式拉麵、拌飯', enabled: true },
    { id: 'p17', name: '菁姐爆蛋蔥油餅&海苔飯捲', category: '麵食小吃', rating: 4.8, reviews: 1058, lat: 24.164122, lng: 120.6825084, hours: { mon: '11:30-20:30', tue: '11:30-20:30', wed: '11:30-20:30', thu: '11:30-20:30', fri: '11:30-20:30', sat: '11:30-20:30', sun: '休' }, maps_url: 'https://maps.google.com/?cid=15196820665582095366', note: '爆蛋蔥油餅、海苔飯捲（每週日休）', enabled: true },
    { id: 'p18', name: '詹擔擔麵', category: '麵食小吃', rating: 4.2, reviews: 1018, lat: 24.1618869, lng: 120.6824342, hours: { mon: '16:30-24:00', tue: '16:30-24:00', wed: '16:30-24:00', thu: '16:30-24:00', fri: '休', sat: '休', sun: '休' }, maps_url: 'https://maps.google.com/?cid=12356574492644345065', note: '擔擔麵、麻醬麵、滷味小菜（五六日店休）', enabled: true },
    { id: 'p19', name: '陽光現炒館', category: '鍋物熱炒', rating: 4.0, reviews: 989, lat: 24.162267, lng: 120.6822987, hours: { mon: '11:00-13:30,17:00-20:30', tue: '11:00-13:30,17:00-20:30', wed: '11:00-13:30,17:00-20:30', thu: '11:00-13:30,17:00-20:30', fri: '11:00-13:30,17:00-20:30', sat: '11:00-14:00,17:00-20:30', sun: '11:00-14:00,17:00-20:30' }, maps_url: 'https://maps.google.com/?cid=8749586575255095875', note: '平價現炒、炒飯、熱炒合菜', enabled: true },
    { id: 'p20', name: '飯合燒（燒肉飯專賣）', category: '便當飯類', rating: 4.8, reviews: 63, lat: 24.1592191, lng: 120.6812116, hours: { mon: '11:00-19:30', tue: '11:00-19:30', wed: '11:00-19:30', thu: '11:00-19:30', fri: '11:00-19:30', sat: '11:00-19:30', sun: '11:00-19:30' }, maps_url: 'https://maps.google.com/?cid=15657521896272236534', note: '現烤炭香燒肉飯', enabled: true },
    { id: 'p21', name: '吃得巧海苔飯卷 美德店', category: '便當飯類', rating: 3.9, reviews: 129, lat: 24.1580047, lng: 120.6788901, hours: { mon: '10:00-20:00', tue: '10:00-20:00', wed: '10:00-20:00', thu: '10:00-20:00', fri: '10:00-20:00', sat: '10:00-17:00', sun: '休' }, maps_url: 'https://maps.google.com/?cid=6098472380479676575', note: '海苔飯卷、外帶輕食', enabled: true },
    { id: 'p22', name: '龍品魚丸永興店', category: '便當飯類', rating: 3.9, reviews: 369, lat: 24.16175, lng: 120.6838083, hours: { mon: '10:15-13:45,16:15-19:45', tue: '10:15-13:45,16:15-19:45', wed: '10:15-13:45,16:15-19:45', thu: '10:15-13:45,16:15-19:45', fri: '10:15-13:45,16:15-19:45', sat: '休', sun: '10:15-13:45,16:15-19:45' }, maps_url: 'https://maps.google.com/?cid=3416908724599027371', note: '排骨飯、雞腿飯、魚丸湯', enabled: true },
    { id: 'p23', name: '一珍軒古早味蛋餅 大德店', category: '早午餐', rating: 4.9, reviews: 533, lat: 24.156208, lng: 120.6790714, hours: { mon: '休', tue: '休', wed: '07:00-12:00', thu: '07:00-12:00', fri: '休', sat: '07:00-12:00', sun: '07:00-12:00' }, maps_url: 'https://maps.google.com/?cid=9762947096531153894', note: '手工粉漿古早味蛋餅', enabled: true },
    { id: 'p24', name: '永盛雞肉飯', category: '便當飯類', rating: 3.0, reviews: 597, lat: 24.1618352, lng: 120.6822336, hours: { mon: '11:30-23:30', tue: '11:30-23:30', wed: '11:30-23:30', thu: '11:30-23:30', fri: '11:30-23:30', sat: '11:30-23:30', sun: '11:30-23:30' }, maps_url: 'https://maps.google.com/?cid=8340168222246667433', note: '雞肉飯、滷肉飯、乾麵湯品', enabled: true },
    { id: 'p25', name: '米撰雞腿壩王便當 中國醫店', category: '便當飯類', rating: 4.7, reviews: 68, lat: 24.1539389, lng: 120.6818927, hours: { mon: '09:30-20:00', tue: '09:30-20:00', wed: '09:30-20:00', thu: '09:30-20:00', fri: '09:30-20:00', sat: '09:30-20:00', sun: '09:30-20:00' }, maps_url: 'https://maps.google.com/?cid=7317347437991471483', note: '滷雞腿、炸雞腿、蒸鱸魚便當', enabled: true },
    { id: 'p26', name: '柯宅食事', category: '便當飯類', rating: 4.6, reviews: 251, lat: 24.1548403, lng: 120.6810629, hours: { mon: '11:00-13:30,17:00-19:00', tue: '11:00-13:30,17:00-19:00', wed: '11:00-13:30,17:00-19:00', thu: '11:00-13:30,17:00-19:00', fri: '11:00-13:30,17:00-19:00', sat: '休', sun: '休' }, maps_url: 'https://maps.google.com/?cid=9606530209719418487', note: '平價咖哩、蒸烤餐盒、濃湯貝果（可Line預約）', enabled: true },
    { id: 'p27', name: '肉谷蠻飯売部', category: '便當飯類', rating: 4.6, reviews: 717, lat: 24.158429, lng: 120.6797942, hours: { mon: '11:00-14:00,16:00-21:00', tue: '11:00-14:00,16:00-21:00', wed: '11:00-14:00,16:00-21:00', thu: '11:00-14:00,16:00-21:00', fri: '11:00-14:00,16:00-21:00', sat: '11:00-14:00,16:00-21:00', sun: '11:00-14:00,16:00-21:00' }, maps_url: 'https://maps.google.com/?cid=9884758748087496718', note: '粒粒分明炒飯、家常台式料理', enabled: true },
    { id: 'p28', name: '郎港式鮮肉包 永興店', category: '早午餐', rating: 4.0, reviews: 74, lat: 24.1608508, lng: 120.6824205, hours: { mon: '11:00-20:30', tue: '11:00-20:30', wed: '11:00-20:30', thu: '11:00-20:30', fri: '11:00-20:30', sat: '11:00-20:30', sun: '11:00-20:30' }, maps_url: 'https://maps.google.com/?cid=5750253742565058114', note: '港式鮮肉包、平價銅板點心', enabled: true },
    { id: 'p29', name: '新豐源排骨麵店', category: '麵食小吃', rating: 4.0, reviews: 2241, lat: 24.1590321, lng: 120.6785965, hours: { mon: '11:20-20:00', tue: '11:20-20:00', wed: '11:20-20:00', thu: '11:20-20:00', fri: '11:20-20:00', sat: '11:20-15:30', sun: '11:20-20:00' }, maps_url: 'https://maps.google.com/?cid=12534791567179848401', note: '排骨麵、排骨飯、古早味麵食', enabled: true },
    { id: 'p30', name: '味鄉排骨', category: '便當飯類', rating: 4.2, reviews: 229, lat: 24.1597889, lng: 120.681137, hours: { mon: '10:30-14:00,16:30-20:00', tue: '10:30-14:00,16:30-20:00', wed: '10:30-14:00,16:30-20:00', thu: '10:30-14:00,16:30-20:00', fri: '10:30-14:00,16:30-20:00', sat: '10:30-14:00,16:30-20:00', sun: '休' }, maps_url: 'https://maps.google.com/?cid=10284771661506239974', note: '炸排骨、炸雞腿、四樣配菜便當', enabled: true },
    { id: 'p31', name: '蕃茄村 台中北區德化店', category: '早午餐', rating: 4.4, reviews: 28, lat: 24.1616296, lng: 120.6845831, hours: { mon: '06:00-14:30', tue: '06:00-14:30', wed: '06:00-14:30', thu: '06:00-14:30', fri: '06:00-14:30', sat: '06:00-14:30', sun: '06:00-14:30' }, maps_url: 'https://maps.google.com/?cid=11574636505400323574', note: '早餐、早午餐、漢堡蛋餅', enabled: true },
    { id: 'p32', name: '庄腳早午餐', category: '早午餐', rating: 4.8, reviews: 754, lat: 24.1611867, lng: 120.6837208, hours: { mon: '06:30-13:40', tue: '06:30-13:40', wed: '06:30-13:40', thu: '06:30-13:40', fri: '06:30-13:40', sat: '06:30-13:40', sun: '06:30-13:40' }, maps_url: 'https://maps.google.com/?cid=10913344496070832446', note: '酥脆蛋餅、吐司三明治、早午餐', enabled: true },
    { id: 'p33', name: '石蜜園', category: '便當飯類', rating: 4.0, reviews: 1427, lat: 24.1592136, lng: 120.6814272, hours: { mon: '11:00-13:30,17:00-19:30', tue: '11:00-13:30,17:00-19:30', wed: '11:00-13:30,17:00-19:30', thu: '11:00-13:30,17:00-19:30', fri: '11:00-13:30,17:00-19:30', sat: '休', sun: '休' }, maps_url: 'https://maps.google.com/?cid=1575338714875130796', note: '簡餐便當、烏梅汁', enabled: true },
    { id: 'p34', name: '楊記手工包子饅頭', category: '早午餐', rating: 4.2, reviews: 225, lat: 24.1634937, lng: 120.6824123, hours: { mon: '06:00-20:00', tue: '06:00-20:00', wed: '06:00-20:00', thu: '06:00-20:00', fri: '06:00-20:00', sat: '06:00-19:00', sun: '休' }, maps_url: 'https://maps.google.com/?cid=4601745859548478322', note: '手工包子饅頭、黑糖麻糬、蔓越莓乳酪', enabled: true },
    { id: 'p35', name: '川島家便當專賣 學士店', category: '便當飯類', rating: 4.4, reviews: 119, lat: 24.154427, lng: 120.6814798, hours: { mon: '11:00-13:30,17:00-19:30', tue: '11:00-13:30,17:00-19:30', wed: '11:00-13:30,17:00-19:30', thu: '11:00-13:30,17:00-19:30', fri: '11:00-13:30,17:00-19:30', sat: '休', sun: '休' }, maps_url: 'https://maps.google.com/?cid=2601409079505214031', note: '烤雞腿、烤豬排、清爽便當', enabled: true },
    { id: 'p36', name: '福米記 池上飯包', category: '便當飯類', rating: 3.7, reviews: 214, lat: 24.1589392, lng: 120.6816358, hours: { mon: '10:00-14:00,16:00-20:00', tue: '10:00-14:00,16:00-20:00', wed: '10:00-14:00,16:00-20:00', thu: '10:00-14:00,16:00-20:00', fri: '10:00-14:00,16:00-20:00', sat: '10:00-14:00,16:00-20:00', sun: '10:00-14:00,16:00-20:00' }, maps_url: 'https://maps.google.com/?cid=12649100481639658314', note: '池上飯包、招牌便當', enabled: true },
    { id: 'p37', name: '麥丼', category: '便當飯類', rating: 4.4, reviews: 96, lat: 24.160116, lng: 120.6824158, hours: { mon: '11:30-13:30,17:00-21:00', tue: '11:30-13:30,17:00-21:00', wed: '11:30-13:30,17:00-21:00', thu: '11:30-13:30,17:00-21:00', fri: '11:30-13:30,17:00-21:00', sat: '17:00-21:00', sun: '17:00-21:00' }, maps_url: 'https://maps.google.com/?cid=16639513299362730979', note: '丼飯、炒烏龍麵、蒸蛋（不固定店休建議先電洽）', enabled: true },
    { id: 'p38', name: '飯將排骨炒飯', category: '便當飯類', rating: 4.5, reviews: 179, lat: 24.15591, lng: 120.6789483, hours: { mon: '11:00-13:30,16:00-20:30', tue: '11:00-13:30,16:00-20:30', wed: '11:00-13:30,16:00-20:30', thu: '11:00-13:30,16:00-20:30', fri: '11:00-13:30,16:00-20:30', sat: '休', sun: '11:00-13:30,16:00-20:30' }, maps_url: 'https://maps.google.com/?cid=8337723409078961806', note: '排骨蛋炒飯、鮭魚炒飯', enabled: true },
    { id: 'p39', name: '蓋蓋屋', category: '便當飯類', rating: 4.3, reviews: 223, lat: 24.1583459, lng: 120.678668, hours: { mon: '11:00-13:30,16:30-19:30', tue: '11:00-13:30,16:30-19:30', wed: '11:00-13:30,16:30-19:30', thu: '11:00-13:30,16:30-19:30', fri: '11:00-13:30,16:30-19:30', sat: '休', sun: '11:00-13:30,16:30-19:30' }, maps_url: 'https://maps.google.com/?cid=10243243191283161361', note: '蓋飯、無骨雞腿飯、平價學生便當', enabled: true },
    { id: 'p40', name: '丼手丼腳', category: '便當飯類', rating: 4.8, reviews: 132, lat: 24.1580943, lng: 120.6787307, hours: { mon: '11:00-13:30,16:30-19:30', tue: '11:00-13:30,16:30-19:30', wed: '11:00-13:30,16:30-19:30', thu: '11:00-13:30,16:30-19:30', fri: '11:00-13:30', sat: '11:00-13:30', sun: '休' }, maps_url: 'https://maps.google.com/?cid=2483771896668233101', note: '平價丼飯餐盒、唐揚雞丼飯', enabled: true },
    { id: 'p41', name: '中年大叔美味料理', category: '便當飯類', rating: 4.9, reviews: 64, lat: 24.1604209, lng: 120.6826712, hours: { mon: '11:00-14:00,16:30-19:30', tue: '11:00-14:00,16:30-19:30', wed: '11:00-14:00,16:30-19:30', thu: '11:00-14:00,16:30-19:30', fri: '11:00-14:00,16:30-19:30', sat: '休', sun: '休' }, maps_url: 'https://maps.google.com/?cid=15491070997404143571', note: '原名：中年大叔 家常料理；家常便當、脆皮雞排飯、番茄湯麵', enabled: true },
    { id: 'p42', name: '熊霸便當製所', category: '便當飯類', rating: 4.4, reviews: 85, lat: 24.1621855, lng: 120.6822606, hours: { mon: '11:00-13:30,17:00-20:00', tue: '11:00-13:30,17:00-20:00', wed: '11:00-13:30,17:00-20:00', thu: '11:00-13:30,17:00-20:00', fri: '11:00-13:30,17:00-20:00', sat: '休', sun: '休' }, maps_url: 'https://maps.google.com/?cid=7281449326775989500', note: '五樣配菜便當、炸雞腿、炸排骨', enabled: true },
    { id: 'p43', name: '鴻興燒臘', category: '便當飯類', rating: 4.1, reviews: 793, lat: 24.1626257, lng: 120.6824127, hours: { mon: '11:15-14:00,17:00-20:00', tue: '11:15-14:00,17:00-20:00', wed: '11:15-14:00,17:00-20:00', thu: '11:15-14:00,17:00-20:00', fri: '11:15-14:00,17:00-20:00', sat: '11:15-14:00,17:00-20:00', sun: '11:15-14:00,17:00-20:00' }, maps_url: 'https://maps.google.com/?cid=17829999959642457924', note: '港式燒臘、烤鴨腿、油雞叉燒', enabled: true },
    { id: 'p44', name: '日日伴飯 咖哩專賣', category: '便當飯類', rating: 4.8, reviews: 717, lat: 24.159822, lng: 120.681464, hours: { mon: '11:00-14:30,17:00-21:00', tue: '11:00-14:30,17:00-21:00', wed: '休', thu: '11:00-14:30,17:00-21:00', fri: '11:00-14:30,17:00-21:00', sat: '11:00-14:30,17:00-21:00', sun: '休' }, maps_url: 'https://maps.google.com/?cid=13650270057205802543', note: '日式/歐式/印度咖哩、炸豬排（公休以IG為主）', enabled: true },
    { id: 'p45', name: '享初海南雞飯', category: '便當飯類', rating: 4.6, reviews: 245, lat: 24.1615112, lng: 120.6827543, hours: { mon: '11:00-14:00,17:00-20:00', tue: '休', wed: '11:00-14:00,17:00-20:00', thu: '11:00-14:00,17:00-20:00', fri: '11:00-14:00,17:00-20:00', sat: '11:00-14:00,17:00-20:00', sun: '11:00-14:00,17:00-20:00' }, maps_url: 'https://maps.google.com/?cid=8768309391426554', note: '海南雞飯、燒肉、打拋豬（附雞湯）', enabled: true },
    { id: 'p46', name: '小野人餐盒製造所', category: '健康餐', rating: 4.3, reviews: 439, lat: 24.158442, lng: 120.678664, hours: { mon: '11:00-13:00,16:00-20:00', tue: '11:00-13:00,16:00-20:00', wed: '11:00-13:00,16:00-20:00', thu: '11:00-13:00,16:00-20:00', fri: '11:00-13:00,16:00-20:00', sat: '09:00-13:00', sun: '11:00-13:00,16:00-19:00' }, maps_url: 'https://maps.google.com/?cid=6439333974000894937', note: '舒肥雞胸、鮭魚健康餐盒', enabled: true },
    { id: 'p47', name: '丼寶丼飯專賣店 樂花涼麵 永興店', category: '便當飯類', rating: 4.2, reviews: 327, lat: 24.1594757, lng: 120.6824165, hours: { mon: '11:00-14:00,16:30-20:00', tue: '11:00-14:00,16:30-20:00', wed: '11:00-14:00,16:30-20:00', thu: '11:00-14:00,16:30-20:00', fri: '11:00-14:00,16:30-20:00', sat: '11:00-14:00,16:30-20:00', sun: '11:00-14:00,16:30-20:00' }, maps_url: 'https://maps.google.com/?cid=14304522539820738753', note: '炙燒起司丼飯、涼麵', enabled: true },
    { id: 'p48', name: '日式大阪燒一ichi', category: '麵食小吃', rating: 4.4, reviews: 11, lat: 24.1756411, lng: 120.6668279, hours: { mon: '', tue: '', wed: '', thu: '', fri: '', sat: '', sun: '' }, maps_url: 'https://maps.google.com/?cid=156013075744315263', note: '水湳市場・日式大阪燒、關西炒麵', enabled: true },
    { id: 'p49', name: '健康那件小事 中醫店', category: '健康餐', rating: 4.5, reviews: 105, lat: 24.1542673, lng: 120.6814591, hours: { mon: '10:30-13:30,16:30-19:20', tue: '10:30-13:30,16:30-19:20', wed: '10:30-13:30,16:30-19:20', thu: '10:30-13:30,16:30-19:20', fri: '10:30-13:30,16:30-19:20', sat: '10:30-13:30', sun: '休' }, maps_url: 'https://maps.google.com/?cid=13976905307848667134', note: '舒肥低卡健康餐盒、蒜香雞、檸檬雞柳', enabled: true }
  ];

  // ==================== 純函式核心邏輯（Node.js 測試與瀏覽器共用） ====================

  function parseCSV(text) {
    if (!text) return [];
    const input = String(text).replace(/^\uFEFF/, '');
    const rows = [];
    let row = [];
    let field = '';
    let inQuotes = false;

    for (let i = 0; i < input.length; i += 1) {
      const ch = input[i];
      if (inQuotes) {
        if (ch === '"') {
          if (input[i + 1] === '"') {
            field += '"';
            i += 1;
          } else {
            inQuotes = false;
          }
        } else {
          field += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\r') {
        if (input[i + 1] === '\n') i += 1;
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else if (ch === '\n') {
        row.push(field);
        rows.push(row);
        row = [];
        field = '';
      } else {
        field += ch;
      }
    }

    if (field.length > 0 || row.length > 0) {
      row.push(field);
      rows.push(row);
    }

    return rows.filter(r => r.some(cell => cell.trim() !== ''));
  }

  function csvToPlaces(csvText) {
    const rows = parseCSV(csvText);
    if (rows.length < 2) return [];
    const headers = rows[0].map(h => h.trim().toLowerCase());
    const idx = name => headers.indexOf(name);

    const out = [];
    for (let i = 1; i < rows.length; i += 1) {
      const r = rows[i];
      const get = col => {
        const pos = idx(col);
        return pos >= 0 && pos < r.length ? r[pos].trim() : '';
      };

      const name = get('name');
      const mapsUrl = get('maps_url');
      if (!name || !mapsUrl) continue;

      const enabledRaw = get('enabled');
      if (enabledRaw && enabledRaw.toUpperCase() === 'FALSE') continue;

      const latNum = parseFloat(get('lat'));
      const lngNum = parseFloat(get('lng'));
      const ratingNum = parseFloat(get('rating'));
      const reviewsNum = parseInt(get('reviews'), 10);

      out.push({
        id: get('id') || name,
        name,
        category: get('category') || '便當飯類',
        rating: Number.isFinite(ratingNum) ? ratingNum : null,
        reviews: Number.isFinite(reviewsNum) ? reviewsNum : null,
        lat: Number.isFinite(latNum) ? latNum : null,
        lng: Number.isFinite(lngNum) ? lngNum : null,
        hours: {
          mon: get('mon'),
          tue: get('tue'),
          wed: get('wed'),
          thu: get('thu'),
          fri: get('fri'),
          sat: get('sat'),
          sun: get('sun')
        },
        maps_url: mapsUrl,
        note: get('note'),
        enabled: true
      });
    }
    return out;
  }

  function haversineMeters(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = d => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function formatDistance(meters) {
    if (!Number.isFinite(meters)) return '距離未知';
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  }

  function parseMinutes(hhmm) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(hhmm || '').trim());
    if (!m) return null;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h < 0 || h > 24 || min < 0 || min > 59) return null;
    return h * 60 + min;
  }

  function getOpenStatus(place, now, closingSoonMins = CLOSING_SOON_MINS) {
    const hours = (place && place.hours) || {};
    const dayIdx = now.getDay();
    const prevIdx = (dayIdx + 6) % 7;
    const todayStr = String(hours[DAY_KEYS[dayIdx]] || '').trim();
    const prevStr = String(hours[DAY_KEYS[prevIdx]] || '').trim();
    const curMins = now.getHours() * 60 + now.getMinutes();

    if (prevStr && prevStr !== '休') {
      for (const seg of prevStr.split(',')) {
        const parts = seg.trim().split('-');
        if (parts.length !== 2) continue;
        const sm = parseMinutes(parts[0]);
        const em = parseMinutes(parts[1]);
        if (sm === null || em === null) continue;
        if (em < sm && curMins < em) {
          const rem = em - curMins;
          if (rem <= closingSoonMins) {
            return {
              state: 'closing_soon',
              label: `剩 ${rem} 分打烊`,
              todayText: `營業至 ${parts[1]}`,
              activeEnd: parts[1],
              remainingMins: rem
            };
          }
          return {
            state: 'open',
            label: '營業中',
            todayText: `營業至凌晨 ${parts[1]}`,
            activeEnd: parts[1],
            remainingMins: rem
          };
        }
      }
    }

    if (!todayStr) {
      return { state: 'unknown', label: '未提供時間', todayText: '未提供時間', activeEnd: null, remainingMins: null };
    }
    if (todayStr === '休') {
      return { state: 'closed', label: '今日公休', todayText: '今日公休', activeEnd: null, remainingMins: null };
    }

    const displayText = todayStr.replace(/,/g, ' / ');
    for (const seg of todayStr.split(',')) {
      const parts = seg.trim().split('-');
      if (parts.length !== 2) continue;
      const sm = parseMinutes(parts[0]);
      let em = parseMinutes(parts[1]);
      if (sm === null || em === null) continue;
      if (em <= sm) em += 1440;

      if (curMins >= sm && curMins < em) {
        const rem = em - curMins;
        if (rem <= closingSoonMins && !(sm === 0 && em === 1440)) {
          return {
            state: 'closing_soon',
            label: `剩 ${rem} 分打烊`,
            todayText: `營業至 ${parts[1]}`,
            activeEnd: parts[1],
            remainingMins: rem
          };
        }
        return {
          state: 'open',
          label: '營業中',
          todayText: sm === 0 && em === 1440 ? '24 小時營業' : `營業至 ${parts[1]}`,
          activeEnd: parts[1],
          remainingMins: rem
        };
      }
    }

    return { state: 'closed', label: '休息中', todayText: displayText, activeEnd: null, remainingMins: null };
  }

  function placeKey(place) {
    return place.id || place.name;
  }

  function lookupHistory(historyMap, place) {
    if (!historyMap) return null;
    if (Array.isArray(historyMap)) {
      return historyMap.find(h => h.key === place.id || h.key === place.name || h.name === place.name) || null;
    }
    return historyMap[place.id] || historyMap[place.name] || null;
  }

  function computeWeightDetail(place, historyMap, passedSet, nowMs, weightedMode = true) {
    if (!weightedMode) {
      return { weight: 1.0, badgeText: '等機率隨機', badgeTone: 'blue', desc: '純隨機' };
    }

    let weight = 1.0;
    const tags = [];
    const rec = lookupHistory(historyMap, place);

    if (!rec) {
      weight *= 1.3;
      tags.push({ text: '尚未吃過', tone: 'purple', short: '新店 ×1.30' });
    } else {
      const deltaDays = Math.max(0, (nowMs - rec.lastAteAt) / 86400000);
      let factor = 1.0;
      let label = '';
      if (deltaDays < 1) {
        factor = 0.05;
        label = '今天剛吃';
      } else if (deltaDays < 2) {
        factor = 0.2;
        label = '1天前吃過';
      } else if (deltaDays < 3) {
        factor = 0.4;
        label = '2天前吃過';
      } else if (deltaDays < 5) {
        factor = 0.7;
        label = `${Math.floor(deltaDays)}天前吃過`;
      } else {
        factor = 1.0;
        label = `吃過 ${rec.count} 次`;
      }
      weight *= factor;
      tags.push({ text: label, tone: factor < 1 ? 'amber' : 'green', short: `歷史 ×${factor.toFixed(2)}` });
    }

    if (passedSet && passedSet.has(placeKey(place))) {
      weight *= 0.05;
      tags.push({ text: '剛略過', tone: 'muted', short: '略過 ×0.05' });
    }

    const primary = tags[0];
    return {
      weight,
      badgeText: primary.text,
      badgeTone: primary.tone,
      desc: tags.map(t => t.short).join(' · ')
    };
  }

  function pickWeightedCandidate(candidates, passedSet, currentKey = null, excludeCurrent = false, rng = Math.random) {
    if (!candidates || candidates.length === 0) {
      return { chosen: null, resetPassed: false };
    }

    let resetPassed = false;
    if (passedSet) {
      const unpassed = candidates.filter(c => !passedSet.has(placeKey(c)));
      if (unpassed.length === 0 && passedSet.size > 0) {
        passedSet.clear();
        resetPassed = true;
      }
    }

    let pool = candidates;
    if (excludeCurrent && candidates.length > 1 && currentKey) {
      const others = candidates.filter(c => placeKey(c) !== currentKey);
      if (others.length > 0) pool = others;
    }

    const totalWeight = pool.reduce((sum, item) => sum + (item.weightInfo ? item.weightInfo.weight : 1), 0);
    if (totalWeight <= 0) {
      return { chosen: pool[0], resetPassed };
    }

    let threshold = rng() * totalWeight;
    let chosen = pool[pool.length - 1];
    for (const item of pool) {
      threshold -= item.weightInfo ? item.weightInfo.weight : 1;
      if (threshold <= 0) {
        chosen = item;
        break;
      }
    }
    return { chosen, resetPassed };
  }

  function parseGoogleMapsInput(rawInput) {
    const raw = String(rawInput || '').trim();
    if (!raw) return { name: '', lat: null, lng: null, maps_url: '' };

    const urlMatch = raw.match(/https?:\/\/[^\s]+/i);
    const maps_url = urlMatch ? urlMatch[0].replace(/[),.;]+$/, '') : '';

    let lat = null;
    let lng = null;

    const atMatch = maps_url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const dataCoordMatch = maps_url.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
    const queryCoordMatch = maps_url.match(/[?&](?:q|ll|center)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    const pickedMatch = dataCoordMatch || atMatch || queryCoordMatch;
    if (pickedMatch) {
      lat = parseFloat(pickedMatch[1]);
      lng = parseFloat(pickedMatch[2]);
    }

    let name = '';
    const placeMatch = maps_url.match(/\/maps\/place\/([^/@?]+)/i);
    if (placeMatch) {
      try {
        name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim();
      } catch (_) {
        name = placeMatch[1].replace(/\+/g, ' ').trim();
      }
    }

    if (!name && maps_url) {
      const qMatch = maps_url.match(/[?&]q=([^&]+)/i);
      if (qMatch && !/^-?\d+\.\d+,-?\d+\.\d+$/.test(qMatch[1])) {
        try {
          name = decodeURIComponent(qMatch[1].replace(/\+/g, ' ')).trim();
        } catch (_) {
          name = qMatch[1].replace(/\+/g, ' ').trim();
        }
      }
    }

    if (!name) {
      const lines = raw
        .split(/\r?\n/)
        .map(l => l.trim())
        .filter(l => l && !/^https?:\/\//i.test(l));
      if (lines.length > 0) {
        name = lines[0].replace(/\s*[-–|｜].*$/, '').trim() || lines[0];
      }
    }

    return {
      name,
      lat: Number.isFinite(lat) ? lat : null,
      lng: Number.isFinite(lng) ? lng : null,
      maps_url
    };
  }

  function escapeCsvCell(val) {
    const str = val === null || val === undefined ? '' : String(val);
    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function placeToCsvRow(place) {
    const h = place.hours || {};
    const cols = [
      place.id || '',
      place.name || '',
      place.category || '便當飯類',
      place.rating ?? '',
      place.reviews ?? '',
      place.lat ?? '',
      place.lng ?? '',
      h.mon || '',
      h.tue || '',
      h.wed || '',
      h.thu || '',
      h.fri || '',
      h.sat || '',
      h.sun || '',
      place.maps_url || '',
      place.note || '',
      place.enabled === false ? 'FALSE' : 'TRUE'
    ];
    return cols.map(escapeCsvCell).join(',');
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ==================== 瀏覽器真實地圖俯視飛躍主程式 ====================
  function initBrowserApp() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const TILE_SIZE = 256;
    const MIN_ZOOM = 12.5;
    const MAX_ZOOM = 18.2;
    const CRUISE_ZOOM = 14.45;
    const HOP_FOCUS_ZOOM = 17.35;
    const LOCK_ZOOM = 17.6;

    const CATEGORY_COLORS = {
      全部: '#EA5828',
      健康餐: '#34D399',
      早午餐: '#FBBF24',
      便當飯類: '#38BDF8',
      麵食小吃: '#FB7185',
      鍋物熱炒: '#C084FC'
    };

    const CATEGORY_ICONS = {
      全部: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
      健康餐: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>',
      早午餐: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M16 12a4 4 0 0 0-8 0"/><path d="M3 16h18"/><path d="M6 20h12"/></svg>',
      便當飯類: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><line x1="12" y1="5" x2="12" y2="19"/><line x1="12" y1="12" x2="21" y2="12"/></svg>',
      麵食小吃: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11h16a8 8 0 0 1-16 0Z"/><path d="M8 11V4"/><path d="M12 11V3"/><path d="M16 11V5"/><path d="M7 19h10"/></svg>',
      鍋物熱炒: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>'
    };

    const MAP_LAYERS = {
      sat: {
        label: '衛星',
        attrib: '衛星圖資 © Esri · World Transportation',
        isDark: true,
        tileFilter: null,
        baseUrl: (z, x, y) =>
          `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`,
        overlayUrl: (z, x, y) =>
          `https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/${z}/${y}/${x}`
      },
      dark: {
        label: '暗黑',
        attrib: '暗黑街道 © OpenStreetMap contributors',
        isDark: true,
        tileFilter: 'invert(92%) hue-rotate(185deg) saturate(82%) brightness(92%) contrast(96%)',
        baseUrl: (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
        overlayUrl: null
      },
      street: {
        label: '街道',
        attrib: '街道圖資 © OpenStreetMap contributors',
        isDark: false,
        tileFilter: null,
        baseUrl: (z, x, y) => `https://tile.openstreetmap.org/${z}/${x}/${y}.png`,
        overlayUrl: null
      }
    };

    const LAYER_ORDER = ['sat', 'dark', 'street'];

    function loadJson(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (_) {
        return fallback;
      }
    }

    function saveJson(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch (_) {
        // ignore quota errors
      }
    }

    const THEME_ORDER = ['graphite', 'airbnb'];
    const THEME_LABELS = {
      graphite: '霧面黑（Linear 風）',
      airbnb: '溫潤米（Airbnb 風）'
    };
    const THEME_META_COLORS = {
      graphite: '#0F1115',
      airbnb: '#F7F5F0'
    };

    function applyThemeDom(theme) {
      document.body.setAttribute('data-theme', theme);
      const metaEl = document.getElementById('themeColorMeta') || document.querySelector('meta[name="theme-color"]');
      if (metaEl && THEME_META_COLORS[theme]) {
        metaEl.setAttribute('content', THEME_META_COLORS[theme]);
      }
    }

    const savedPrefs = Object.assign(
      { layer: 'sat', category: '全部', onlyOpen: true, theme: 'graphite' },
      loadJson(STORAGE_KEYS.prefs, {})
    );

    const CUSTOM_PLACES_KEY = 'meal_picker_custom_places_v1';
    const GAS_CONFIG_KEY = 'meal_picker_gas_config_v1';

    const searchParams = new URLSearchParams(window.location.search);
    const urlLayer = searchParams.get('layer');
    const urlScreen = searchParams.get('screen');
    const urlTheme = searchParams.get('theme');
    if (THEME_ORDER.includes(urlTheme)) {
      savedPrefs.theme = urlTheme;
    }
    if (!THEME_ORDER.includes(savedPrefs.theme)) {
      savedPrefs.theme = 'graphite';
    }
    applyThemeDom(savedPrefs.theme);
    if (MAP_LAYERS[urlLayer]) savedPrefs.layer = urlLayer;
    if (!MAP_LAYERS[savedPrefs.layer]) savedPrefs.layer = 'sat';
    if (!CATEGORIES.includes(savedPrefs.category)) savedPrefs.category = '全部';

    const customWrap = loadJson(CUSTOM_PLACES_KEY, null);
    const cachedWrap = loadJson(STORAGE_KEYS.placesCache, null);
    const gasConfig = Object.assign({ url: '', token: '' }, loadJson(GAS_CONFIG_KEY, {}));
    const hasCustomPlaces = Boolean(customWrap && Array.isArray(customWrap.places));

    const appState = {
      screen: ['map', 'manage'].includes(urlScreen) ? urlScreen : 'home',
      prefs: savedPrefs,
      selectedMatrixKey: null,
      homeSubTab: 'matrix',
      teaserKey: null,
      hasLocalEdits: hasCustomPlaces,
      gasConfig,
      manageFilter: '全部',
      manageSearch: '',
      editingPlaceId: null,
      editingCategory: '便當飯類',
      editingEnabled: true,
      editingRating: null,
      editingReviews: null,
      deleteArmed: false,
      resetArmed: false,
      toastTimer: null,
      places: hasCustomPlaces
        ? customWrap.places
        : ((cachedWrap && Array.isArray(cachedWrap.places) && cachedWrap.places.length > 0)
            ? cachedWrap.places
            : DEFAULT_PLACES.map(p => ({ ...p, hours: { ...(p.hours || {}) } }))),
      history: loadJson(STORAGE_KEYS.history, {}),
      userLoc: { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng, hasGps: false },
      passedIds: new Set(),
      currentPick: null,
      focusPlace: null,
      isAnimating: false,
      isFocusingStop: false,
      animRaf: null,
      animTimers: [],
      flightArc: null,
      hopTrail: [],
      camera: { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng, zoom: LOCK_ZOOM }
    };

    // ==================== Web Mercator 投影與圖磚金字塔 ====================
    function clampZoom(z) {
      return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z));
    }

    function clampLatLng(lat, lng) {
      return {
        lat: Math.max(23.85, Math.min(24.45, lat)),
        lng: Math.max(120.40, Math.min(120.95, lng))
      };
    }

    function lngToWorldX(lng, zoom) {
      return ((lng + 180) / 360) * TILE_SIZE * Math.pow(2, zoom);
    }

    function latToWorldY(lat, zoom) {
      const clamped = Math.max(-85.05112878, Math.min(85.05112878, lat));
      const rad = (clamped * Math.PI) / 180;
      const merc = Math.log(Math.tan(rad) + 1 / Math.cos(rad));
      return (0.5 - merc / (2 * Math.PI)) * TILE_SIZE * Math.pow(2, zoom);
    }

    function worldXToLng(wx, zoom) {
      return (wx / (TILE_SIZE * Math.pow(2, zoom))) * 360 - 180;
    }

    function worldYToLat(wy, zoom) {
      const worldPx = TILE_SIZE * Math.pow(2, zoom);
      const n = Math.PI - (2 * Math.PI * wy) / worldPx;
      return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
    }

    const canvas = document.getElementById('mapCanvas');
    const ctx = canvas.getContext('2d');
    const viewport = { width: 390, height: 844, dpr: 1 };

    function getAnchorPoint() {
      return {
        x: viewport.width * 0.5,
        y: viewport.height * 0.445
      };
    }

    function projectToScreen(lat, lng, cam = appState.camera) {
      const anchor = getAnchorPoint();
      const camX = lngToWorldX(cam.lng, cam.zoom);
      const camY = latToWorldY(cam.lat, cam.zoom);
      const px = lngToWorldX(lng, cam.zoom);
      const py = latToWorldY(lat, cam.zoom);
      return {
        x: anchor.x + (px - camX),
        y: anchor.y + (py - camY)
      };
    }

    function screenToLatLng(sx, sy, cam = appState.camera) {
      const anchor = getAnchorPoint();
      const camX = lngToWorldX(cam.lng, cam.zoom);
      const camY = latToWorldY(cam.lat, cam.zoom);
      const wx = camX + (sx - anchor.x);
      const wy = camY + (sy - anchor.y);
      return clampLatLng(worldYToLat(wy, cam.zoom), worldXToLng(wx, cam.zoom));
    }

    const tileCache = new Map();

    function evictTileCacheIfNeeded() {
      if (tileCache.size <= 360) return;
      const entries = Array.from(tileCache.entries()).sort((a, b) => a[1].lastUsed - b[1].lastUsed);
      const removeCount = tileCache.size - 280;
      for (let i = 0; i < removeCount; i += 1) {
        tileCache.delete(entries[i][0]);
      }
    }

    function getOrLoadTile(layerId, kind, z, x, y) {
      const maxIdx = Math.pow(2, z);
      if (y < 0 || y >= maxIdx) return null;
      const normX = ((x % maxIdx) + maxIdx) % maxIdx;
      const layerDef = MAP_LAYERS[layerId];
      if (!layerDef) return null;
      const urlFn = kind === 'overlay' ? layerDef.overlayUrl : layerDef.baseUrl;
      if (!urlFn) return null;

      const url = urlFn(z, normX, y);
      const existing = tileCache.get(url);
      if (existing) {
        existing.lastUsed = performance.now();
        return existing;
      }

      const entry = { status: 'loading', img: null, lastUsed: performance.now() };
      tileCache.set(url, entry);
      evictTileCacheIfNeeded();

      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        entry.status = 'ready';
        entry.img = img;
        entry.lastUsed = performance.now();
      };
      img.onerror = () => {
        entry.status = 'error';
      };
      img.src = url;
      return entry;
    }

    function preloadCoreTiles(layerId) {
      const minLat = 24.150;
      const maxLat = 24.178;
      const minLng = 120.664;
      const maxLng = 120.688;
      [14, 15].forEach(z => {
        const x1 = Math.floor(lngToWorldX(minLng, z) / TILE_SIZE);
        const x2 = Math.floor(lngToWorldX(maxLng, z) / TILE_SIZE);
        const y1 = Math.floor(latToWorldY(maxLat, z) / TILE_SIZE);
        const y2 = Math.floor(latToWorldY(minLat, z) / TILE_SIZE);
        for (let tx = x1; tx <= x2; tx += 1) {
          for (let ty = y1; ty <= y2; ty += 1) {
            getOrLoadTile(layerId, 'base', z, tx, ty);
            if (MAP_LAYERS[layerId].overlayUrl) {
              getOrLoadTile(layerId, 'overlay', z, tx, ty);
            }
          }
        }
      });
    }

    // 輪轉開始瞬間，預先下載各停靠餐廳周圍的高倍率衛星／道路圖磚，放大聚焦時立即清晰
    function preloadSpotTiles(layerId, place) {
      if (!place || !Number.isFinite(place.lat) || !Number.isFinite(place.lng)) return;
      [16, 17, 18].forEach(z => {
        const cx = Math.floor(lngToWorldX(place.lng, z) / TILE_SIZE);
        const cy = Math.floor(latToWorldY(place.lat, z) / TILE_SIZE);
        const pad = z === 17 ? 1 : 0;
        for (let dx = -pad; dx <= pad; dx += 1) {
          for (let dy = -pad; dy <= pad; dy += 1) {
            getOrLoadTile(layerId, 'base', z, cx + dx, cy + dy);
            if (MAP_LAYERS[layerId].overlayUrl) {
              getOrLoadTile(layerId, 'overlay', z, cx + dx, cy + dy);
            }
          }
        }
      });
    }

    function drawTileLayer(layerId, kind, tileZ) {
      const cam = appState.camera;
      const anchor = getAnchorPoint();
      const scale = Math.pow(2, cam.zoom - tileZ);
      const tilePx = TILE_SIZE * scale;
      const camWX = lngToWorldX(cam.lng, tileZ);
      const camWY = latToWorldY(cam.lat, tileZ);

      const leftWX = camWX - anchor.x / scale;
      const rightWX = camWX + (viewport.width - anchor.x) / scale;
      const topWY = camWY - anchor.y / scale;
      const bottomWY = camWY + (viewport.height - anchor.y) / scale;

      const minTX = Math.floor(leftWX / TILE_SIZE);
      const maxTX = Math.floor(rightWX / TILE_SIZE);
      const minTY = Math.floor(topWY / TILE_SIZE);
      const maxTY = Math.floor(bottomWY / TILE_SIZE);
      const maxIdx = Math.pow(2, tileZ);

      for (let tx = minTX; tx <= maxTX; tx += 1) {
        for (let ty = minTY; ty <= maxTY; ty += 1) {
          if (ty < 0 || ty >= maxIdx) continue;
          const dx = anchor.x + (tx * TILE_SIZE - camWX) * scale;
          const dy = anchor.y + (ty * TILE_SIZE - camWY) * scale;
          const drawSize = tilePx + 0.75;

          const entry = getOrLoadTile(layerId, kind, tileZ, tx, ty);
          if (entry && entry.status === 'ready' && entry.img) {
            ctx.drawImage(entry.img, dx, dy, drawSize, drawSize);
            continue;
          }

          // 若目標層圖磚尚在下載，自動由低倍率父圖磚裁切補繪，確保飛行過程零黑屏
          let drawnParent = false;
          for (let pz = tileZ - 1; pz >= 12; pz -= 1) {
            const factor = Math.pow(2, tileZ - pz);
            const px = Math.floor(tx / factor);
            const py = Math.floor(ty / factor);
            const parent = getOrLoadTile(layerId, kind, pz, px, py);
            if (parent && parent.status === 'ready' && parent.img) {
              const subX = ((tx - px * factor) + factor) % factor;
              const subY = ty - py * factor;
              const srcSize = TILE_SIZE / factor;
              ctx.drawImage(
                parent.img,
                subX * srcSize,
                subY * srcSize,
                srcSize,
                srcSize,
                dx,
                dy,
                drawSize,
                drawSize
              );
              drawnParent = true;
              break;
            }
          }

          if (!drawnParent && kind === 'base') {
            ctx.strokeStyle = MAP_LAYERS[layerId].isDark
              ? 'rgba(255, 255, 255, 0.045)'
              : 'rgba(17, 22, 28, 0.06)';
            ctx.lineWidth = 1;
            ctx.strokeRect(dx, dy, tilePx, tilePx);
          }
        }
      }
    }

    function drawBackgroundGrid(isDark) {
      ctx.fillStyle = isDark ? '#0F151B' : '#E2DFD6';
      ctx.fillRect(0, 0, viewport.width, viewport.height);

      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(20, 26, 32, 0.045)';
      ctx.lineWidth = 1;
      const step = 48;
      const anchor = getAnchorPoint();
      const camX = lngToWorldX(appState.camera.lng, appState.camera.zoom);
      const camY = latToWorldY(appState.camera.lat, appState.camera.zoom);
      const offX = ((anchor.x - camX) % step + step) % step;
      const offY = ((anchor.y - camY) % step + step) % step;

      ctx.beginPath();
      for (let x = offX; x < viewport.width; x += step) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, viewport.height);
      }
      for (let y = offY; y < viewport.height; y += step) {
        ctx.moveTo(0, y);
        ctx.lineTo(viewport.width, y);
      }
      ctx.stroke();
    }

    function drawRoundedPill(x, y, text, bgColor, borderColor, textColor, fontSize = 11.5) {
      ctx.font = `600 ${fontSize}px -apple-system, BlinkMacSystemFont, "PingFang TC", "Noto Sans TC", sans-serif`;
      const padX = 9;
      const boxH = 22;
      const textW = ctx.measureText(text).width;
      const boxW = Math.min(210, textW + padX * 2);
      const left = x - boxW * 0.5;
      const top = y - boxH;
      const radius = 8;

      ctx.beginPath();
      ctx.roundRect(left, top, boxW, boxH, radius);
      ctx.fillStyle = bgColor;
      ctx.fill();
      if (borderColor) {
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      ctx.fillStyle = textColor;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, top + boxH * 0.5 + 0.5, boxW - 10);
    }

    function truncateLabel(name, maxLen = 8) {
      if (!name) return '';
      return name.length > maxLen ? `${name.slice(0, maxLen - 1)}…` : name;
    }

    function renderMapFrame(nowTs) {
      const layerId = appState.prefs.layer;
      const layerDef = MAP_LAYERS[layerId] || MAP_LAYERS.sat;
      const tileZ = Math.max(12, Math.min(18, Math.ceil(appState.camera.zoom - 0.35)));

      drawBackgroundGrid(layerDef.isDark);
      if (layerDef.tileFilter) {
        ctx.save();
        ctx.filter = layerDef.tileFilter;
      }
      drawTileLayer(layerId, 'base', tileZ);
      if (layerDef.overlayUrl) {
        drawTileLayer(layerId, 'overlay', tileZ);
      }
      if (layerDef.tileFilter) {
        ctx.restore();
      }

      // 1. 畫出飛行軌跡或雷達掃描連線
      if (appState.flightArc && appState.flightArc.from && appState.flightArc.to) {
        const p1 = projectToScreen(appState.flightArc.from.lat, appState.flightArc.from.lng);
        const p2 = projectToScreen(appState.flightArc.to.lat, appState.flightArc.to.lng);
        const ctrlX = (p1.x + p2.x) * 0.5;
        const distPx = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const ctrlY = (p1.y + p2.y) * 0.5 - Math.min(95, distPx * 0.28);

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(ctrlX, ctrlY, p2.x, p2.y);
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = 'rgba(234, 88, 40, 0.72)';
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.setLineDash([]);

        // 起點標記環
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fill();
        ctx.strokeStyle = '#EA5828';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }

      if (appState.hopTrail.length > 1) {
        ctx.save();
        ctx.beginPath();
        appState.hopTrail.forEach((pt, idx) => {
          const sp = projectToScreen(pt.lat, pt.lng);
          if (idx === 0) ctx.moveTo(sp.x, sp.y);
          else ctx.lineTo(sp.x, sp.y);
        });
        ctx.setLineDash([4, 5]);
        ctx.strokeStyle = 'rgba(255, 165, 118, 0.78)';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();
      }

      // 2. 繪製目前 GPS / 基準點藍色定位點
      const userPos = projectToScreen(appState.userLoc.lat, appState.userLoc.lng);
      if (userPos.x >= -24 && userPos.x <= viewport.width + 24 && userPos.y >= -24 && userPos.y <= viewport.height + 24) {
        ctx.beginPath();
        ctx.arc(userPos.x, userPos.y, 13, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(userPos.x, userPos.y, 5.2, 0, Math.PI * 2);
        ctx.fillStyle = '#38BDF8';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 3. 繪製所有候選店家點位
      const candidates = getCandidates();
      const activeTarget = appState.focusPlace || appState.currentPick;
      const activeKey = activeTarget ? placeKey(activeTarget) : null;
      const showNearbyLabels = appState.camera.zoom >= 15.6;
      const minLabelY = 104;
      const maxLabelY = viewport.height - 210;
      const placedBoxes = [];

      if (activeTarget && Number.isFinite(activeTarget.lat) && Number.isFinite(activeTarget.lng)) {
        const ap = projectToScreen(activeTarget.lat, activeTarget.lng);
        placedBoxes.push(
          { left: ap.x - 28, right: ap.x + 28, top: ap.y - 26, bottom: ap.y + 26 },
          { left: ap.x - 84, right: ap.x + 84, top: Math.max(106, ap.y - 52), bottom: Math.max(132, ap.y - 16) }
        );
      }

      candidates.forEach(c => {
        if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng)) return;
        const key = placeKey(c);
        if (key === activeKey) return;
        const pt = projectToScreen(c.lat, c.lng);
        if (pt.x < -16 || pt.x > viewport.width + 16 || pt.y < -16 || pt.y > viewport.height + 16) return;

        const r = appState.camera.zoom >= 15.6 ? 5.5 : 4.2;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r + 2, 0, Math.PI * 2);
        ctx.fillStyle = layerDef.isDark ? 'rgba(8, 12, 16, 0.72)' : 'rgba(255, 255, 255, 0.9)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fillStyle = layerDef.isDark ? '#E8ECEF' : '#1E2730';
        ctx.fill();

        if (showNearbyLabels && pt.y > minLabelY && pt.y < maxLabelY) {
          const shortName = truncateLabel(c.name, 7);
          const box = { left: pt.x - 42, right: pt.x + 42, top: pt.y + 8, bottom: pt.y + 26 };
          const overlaps = placedBoxes.some(b =>
            !(box.right < b.left || box.left > b.right || box.bottom < b.top || box.top > b.bottom)
          );
          if (!overlaps) {
            placedBoxes.push(box);
            ctx.font = '600 10.5px -apple-system, BlinkMacSystemFont, "PingFang TC", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';
            ctx.lineWidth = 3;
            ctx.strokeStyle = layerDef.isDark ? 'rgba(10, 14, 18, 0.88)' : 'rgba(255, 255, 255, 0.92)';
            ctx.strokeText(shortName, pt.x, pt.y + 8);
            ctx.fillStyle = layerDef.isDark ? '#F1F4F7' : '#151B22';
            ctx.fillText(shortName, pt.x, pt.y + 8);
          }
        }
      });

      // 4. 繪製當前鎖定／聚焦中的目標準星與浮動店名標籤
      if (activeTarget && Number.isFinite(activeTarget.lat) && Number.isFinite(activeTarget.lng)) {
        const tp = projectToScreen(activeTarget.lat, activeTarget.lng);
        const pulsePhase = (nowTs % 1500) / 1500;
        const pulseR = 13 + pulsePhase * 28;
        const pulseAlpha = (1 - pulsePhase) * 0.58;

        ctx.save();
        // 外擴脈衝波
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(234, 88, 40, ${pulseAlpha.toFixed(3)})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 光暈背景
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, appState.isFocusingStop ? 18 : 14, 0, Math.PI * 2);
        ctx.fillStyle = appState.isFocusingStop ? 'rgba(234, 88, 40, 0.30)' : 'rgba(234, 88, 40, 0.22)';
        ctx.fill();

        // 四角戰術瞄準準星（拉近聚焦時向內收緊）
        const bracket = appState.isFocusingStop ? 15 : (appState.isAnimating ? 22 : 16);
        const arm = 6;
        ctx.strokeStyle = '#FF9068';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(tp.x - bracket, tp.y - bracket + arm);
        ctx.lineTo(tp.x - bracket, tp.y - bracket);
        ctx.lineTo(tp.x - bracket + arm, tp.y - bracket);
        ctx.moveTo(tp.x + bracket - arm, tp.y - bracket);
        ctx.lineTo(tp.x + bracket, tp.y - bracket);
        ctx.lineTo(tp.x + bracket, tp.y - bracket + arm);
        ctx.moveTo(tp.x + bracket, tp.y + bracket - arm);
        ctx.lineTo(tp.x + bracket, tp.y + bracket);
        ctx.lineTo(tp.x + bracket - arm, tp.y + bracket);
        ctx.moveTo(tp.x - bracket + arm, tp.y + bracket);
        ctx.lineTo(tp.x - bracket, tp.y + bracket);
        ctx.lineTo(tp.x - bracket, tp.y + bracket - arm);
        ctx.stroke();

        // 核心亮點
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = '#EA5828';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 浮動店名膠囊標籤
        drawRoundedPill(
          Math.max(70, Math.min(viewport.width - 70, tp.x)),
          Math.max(120, tp.y - 24),
          truncateLabel(activeTarget.name, 13),
          'rgba(14, 19, 24, 0.90)',
          'rgba(234, 88, 40, 0.82)',
          '#FFFFFF',
          12
        );
        ctx.restore();
      }

      // 5. 更新頂部即時經緯度 HUD
      const coordEl = document.getElementById('hudCoordText');
      if (coordEl) {
        coordEl.textContent = `${appState.camera.lat.toFixed(4)}°N  ${appState.camera.lng.toFixed(4)}°E · Z${appState.camera.zoom.toFixed(1)}`;
      }
    }

    function startRenderLoop() {
      const step = nowTs => {
        if (!document.hidden && appState.screen === 'map') {
          renderMapFrame(nowTs);
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    function resizeCanvas() {
      const shell = canvas.parentElement;
      const rect = shell.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      viewport.width = Math.max(320, rect.width);
      viewport.height = Math.max(480, rect.height);
      viewport.dpr = dpr;
      canvas.width = Math.round(viewport.width * dpr);
      canvas.height = Math.round(viewport.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ==================== 狀態持久化與候選計算 ====================
    function persistPrefs() {
      saveJson(STORAGE_KEYS.prefs, appState.prefs);
    }

    function clearAnimations() {
      if (appState.animRaf) {
        cancelAnimationFrame(appState.animRaf);
        appState.animRaf = null;
      }
      while (appState.animTimers.length > 0) {
        clearTimeout(appState.animTimers.pop());
      }
      appState.flightArc = null;
      appState.hopTrail = [];
      appState.isAnimating = false;
      appState.isFocusingStop = false;
    }

    function formatDistShort(meters) {
      if (!Number.isFinite(meters)) return '距離未知';
      if (meters < 1000) return `約 ${Math.round(meters)}m`;
      return `約 ${(meters / 1000).toFixed(1)}km`;
    }

    function formatMinimalMeta(place) {
      if (!place) return '';
      const timePart = place.openStatus.state === 'open'
        ? place.openStatus.todayText
        : place.openStatus.label;
      return `${timePart} · ${formatDistShort(place.dist)}`;
    }

    function getAllEnrichedPlaces(includeDisabled = false) {
      const now = new Date();
      const nowMs = now.getTime();
      return appState.places
        .filter(p => includeDisabled || p.enabled !== false)
        .map(p => {
          const hasCoords = Number.isFinite(p.lat) && Number.isFinite(p.lng);
          const dist = hasCoords
            ? haversineMeters(appState.userLoc.lat, appState.userLoc.lng, p.lat, p.lng)
            : Infinity;
          const openStatus = getOpenStatus(p, now, CLOSING_SOON_MINS);
          const weightInfo = computeWeightDetail(p, appState.history, appState.passedIds, nowMs, true);
          const historyRec = lookupHistory(appState.history, p);
          return { ...p, dist, openStatus, weightInfo, historyRec };
        });
    }

    function getCandidates() {
      return getAllEnrichedPlaces().filter(p => {
        if (appState.prefs.category !== '全部' && p.category !== appState.prefs.category) return false;
        if (appState.prefs.onlyOpen && p.openStatus.state === 'closed') return false;
        return true;
      });
    }

    function drawNextCandidate(excludeCurrent = false) {
      let candidates = getCandidates();
      if (candidates.length === 0) {
        appState.currentPick = null;
        return null;
      }
      const prevKey = appState.currentPick ? placeKey(appState.currentPick) : null;
      const { chosen, resetPassed } = pickWeightedCandidate(candidates, appState.passedIds, prevKey, excludeCurrent);
      if (resetPassed) {
        candidates = getCandidates();
        const rerun = pickWeightedCandidate(candidates, appState.passedIds, prevKey, excludeCurrent);
        appState.currentPick = rerun.chosen || chosen;
      } else {
        appState.currentPick = chosen;
      }
      return appState.currentPick;
    }

    function openExternalMap(url) {
      if (!url) return;
      const win = window.open(url, '_blank', 'noopener,noreferrer');
      if (!win) window.location.href = url;
    }

    function goEatCurrent() {
      const pick = appState.currentPick;
      if (!pick || appState.isAnimating) return;
      const key = placeKey(pick);
      const prev = appState.history[key];
      appState.history[key] = {
        key,
        name: pick.name,
        count: prev ? prev.count + 1 : 1,
        lastAteAt: Date.now()
      };
      saveJson(STORAGE_KEYS.history, appState.history);
      openExternalMap(pick.maps_url);
    }

    // ==================== PAGE 1：主畫面圖表與選品項渲染 ====================
    function formatDaysAgo(ts) {
      if (!ts) return '';
      const diffDays = Math.floor(Math.max(0, Date.now() - ts) / 86400000);
      if (diffDays <= 0) return '今天吃過';
      if (diffDays === 1) return '1 天前';
      return `${diffDays} 天前`;
    }

    function pickTeaserPlace(allPlaces, excludeKey = null) {
      const openUnvisited = allPlaces.filter(p => !p.historyRec && p.openStatus.state !== 'closed' && placeKey(p) !== excludeKey);
      const unvisited = allPlaces.filter(p => !p.historyRec && placeKey(p) !== excludeKey);
      const openAny = allPlaces.filter(p => p.openStatus.state !== 'closed' && placeKey(p) !== excludeKey);
      const pool = openUnvisited.length > 0
        ? openUnvisited
        : (unvisited.length > 0 ? unvisited : (openAny.length > 0 ? openAny : allPlaces));
      if (pool.length === 0) return null;
      return pool[Math.floor(Math.random() * pool.length)];
    }

    function renderTeaserCard(allPlaces) {
      let current = allPlaces.find(p => placeKey(p) === appState.teaserKey);
      if (!current) {
        current = pickTeaserPlace(allPlaces);
        appState.teaserKey = current ? placeKey(current) : null;
      }
      if (!current) return;

      const badgeEl = document.getElementById('teaserBadge');
      const ratingEl = document.getElementById('teaserRating');
      const nameEl = document.getElementById('teaserName');
      const metaEl = document.getElementById('teaserMeta');
      const hintEl = document.getElementById('teaserHint');
      const color = CATEGORY_COLORS[current.category] || '#EA5828';

      if (badgeEl) {
        badgeEl.textContent = current.category;
        badgeEl.style.color = color;
      }
      if (ratingEl) {
        if (Number.isFinite(Number(current.rating))) {
          ratingEl.hidden = false;
          ratingEl.textContent = `★ ${Number(current.rating).toFixed(1)}`;
        } else {
          ratingEl.hidden = true;
        }
      }
      if (nameEl) nameEl.textContent = current.name;
      if (metaEl) metaEl.textContent = formatMinimalMeta(current);
      if (hintEl) {
        hintEl.textContent = current.historyRec
          ? `已吃過 ${current.historyRec.count} 次 · 點卡看下一間`
          : '未解鎖口袋新店 · 點卡換一間';
      }
    }

    function shuffleTeaserCard() {
      const bodyEl = document.getElementById('teaserBody');
      const allPlaces = getAllEnrichedPlaces();
      const next = pickTeaserPlace(allPlaces, appState.teaserKey);
      if (!next) return;
      appState.teaserKey = placeKey(next);

      if (bodyEl) {
        bodyEl.classList.add('is-flipping');
        setTimeout(() => {
          renderTeaserCard(allPlaces);
          bodyEl.classList.remove('is-flipping');
        }, 160);
      } else {
        renderTeaserCard(allPlaces);
      }
    }

    function launchFromDial() {
      const enterBtn = document.getElementById('enterMapBtn');
      if (enterBtn && enterBtn.classList.contains('is-launching')) return;
      if (enterBtn) {
        enterBtn.classList.add('is-launching');
        setTimeout(() => {
          enterBtn.classList.remove('is-launching');
          openMapScreen();
        }, 280);
      } else {
        openMapScreen();
      }
    }

    function renderHomeDashboard() {
      const allPlaces = getAllEnrichedPlaces();
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');

      const timeLine = document.getElementById('homeTimeLine');
      if (timeLine) timeLine.textContent = `台中北區 · ${hh}:${mm} · 共 ${allPlaces.length} 間口袋名單`;

      const openSwitch = document.getElementById('homeOpenToggle');
      const openLabel = document.getElementById('homeOpenLabel');
      if (openSwitch) {
        openSwitch.classList.toggle('is-active', appState.prefs.onlyOpen);
        openSwitch.setAttribute('aria-pressed', String(appState.prefs.onlyOpen));
      }
      if (openLabel) openLabel.textContent = appState.prefs.onlyOpen ? '只抽營業中' : '不限時段';

      // 1. 計算各分類即時營業統計
      const realCats = CATEGORIES.slice(1);
      const stats = {};
      CATEGORIES.forEach(cat => {
        stats[cat] = { open: 0, total: 0 };
      });
      allPlaces.forEach(p => {
        const isOpen = p.openStatus.state !== 'closed';
        stats['全部'].total += 1;
        if (isOpen) stats['全部'].open += 1;
        if (stats[p.category]) {
          stats[p.category].total += 1;
          if (isOpen) stats[p.category].open += 1;
        }
      });

      // Bento 左卡：即時營業 Dynamic SVG Progress Ring
      const openPctVal = stats['全部'].total > 0
        ? Math.round((stats['全部'].open / stats['全部'].total) * 100)
        : 0;
      const ringCircle = document.getElementById('openRingCircle');
      if (ringCircle) {
        const r = 33;
        const circumference = 2 * Math.PI * r;
        const displayPct = appState.prefs.onlyOpen ? openPctVal : 100;
        ringCircle.style.strokeDasharray = `${circumference} ${circumference}`;
        ringCircle.style.strokeDashoffset = circumference - (displayPct / 100) * circumference;
        ringCircle.style.stroke = appState.prefs.onlyOpen ? 'var(--emerald)' : 'var(--accent)';
        ringCircle.style.filter = 'none';
      }
      const openPctEl = document.getElementById('homeOpenPct');
      const ringNumEl = document.getElementById('openRingNum');
      const ringDenomEl = document.getElementById('openRingDenom');
      const ringFootEl = document.getElementById('openRingFoot');
      if (openPctEl) openPctEl.textContent = appState.prefs.onlyOpen ? `${openPctVal}%` : '全部';
      if (ringNumEl) ringNumEl.textContent = String(appState.prefs.onlyOpen ? stats['全部'].open : stats['全部'].total);
      if (ringDenomEl) ringDenomEl.textContent = `/ ${stats['全部'].total} 間`;
      if (ringFootEl) ringFootEl.textContent = appState.prefs.onlyOpen ? '營業中 · 點切不限' : '不限時段 · 點切營業';

      // Bento 右卡：互動靈感盲盒卡
      renderTeaserCard(allPlaces);

      // Bento 中卡：圖示化 3×2 品項卡片牆
      const selSummary = document.getElementById('homeSelectionSummary');
      const matchedCount = getCandidates().length;
      if (selSummary) {
        selSummary.textContent = `${appState.prefs.category} · ${matchedCount} 間可抽`;
      }

      const catGrid = document.getElementById('homeCategoryGrid');
      if (catGrid) {
        catGrid.innerHTML = '';
        CATEGORIES.forEach(cat => {
          const st = stats[cat];
          const active = appState.prefs.category === cat;
          const emptyUnderOpen = appState.prefs.onlyOpen && st.open === 0;
          const ratio = st.total > 0 ? Math.round((st.open / st.total) * 100) : 0;
          const color = CATEGORY_COLORS[cat] || '#EA5828';
          const iconSvg = CATEGORY_ICONS[cat] || '';

          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `cat-card ${active ? 'is-active' : ''} ${emptyUnderOpen ? 'is-empty-open' : ''}`;
          btn.setAttribute('role', 'radio');
          btn.setAttribute('aria-checked', String(active));
          btn.innerHTML = `
            <div class="cat-icon-row">
              <span class="cat-icon-wrap" style="color:${color};">${iconSvg}</span>
              <span class="cat-count-badge">${appState.prefs.onlyOpen ? `${st.open}/${st.total}` : `${st.total} 間`}</span>
            </div>
            <span class="cat-card-name">${escapeHtml(cat)}</span>
            <div class="cat-mini-track">
              <div class="cat-mini-fill" style="width:${appState.prefs.onlyOpen ? ratio : 100}%;background:${color};"></div>
            </div>
          `;
          btn.onclick = () => {
            appState.prefs.category = cat;
            persistPrefs();
            renderHomeDashboard();
          };
          catGrid.appendChild(btn);
        });
      }

      // Bento 下卡：星圖 ⇄ 飲食統計雙切卡
      document.querySelectorAll('.sub-tab').forEach(btn => {
        if (btn.dataset.subtab === 'matrix') {
          btn.textContent = `${allPlaces.length} 格星圖`;
        }
        btn.classList.toggle('is-active', btn.dataset.subtab === appState.homeSubTab);
      });
      const matrixPane = document.getElementById('matrixPane');
      const statsPane = document.getElementById('statsPane');
      if (matrixPane) matrixPane.hidden = appState.homeSubTab !== 'matrix';
      if (statsPane) statsPane.hidden = appState.homeSubTab !== 'stats';

      const visitedPlaces = allPlaces.filter(p => Boolean(p.historyRec));
      const exploreKpi = document.getElementById('homeExploreKpi');
      const matrixEl = document.getElementById('exploreMatrix');
      const matrixTip = document.getElementById('matrixTip');

      if (exploreKpi) {
        exploreKpi.textContent = `已解鎖 ${visitedPlaces.length}/${allPlaces.length}`;
      }

      if (matrixEl) {
        matrixEl.innerHTML = '';
        allPlaces.forEach(p => {
          const key = placeKey(p);
          const cell = document.createElement('button');
          cell.type = 'button';
          const statusCls = p.historyRec
            ? 'is-visited'
            : (p.openStatus.state !== 'closed' ? 'is-open-new' : '');
          const selCls = appState.selectedMatrixKey === key ? 'is-selected' : '';
          cell.className = `matrix-cell ${statusCls} ${selCls}`.trim();
          cell.setAttribute('aria-label', `${p.name}（${p.category}）`);
          cell.onclick = () => {
            appState.selectedMatrixKey = key;
            if (matrixTip) {
              const openTxt = p.openStatus.state === 'open' ? p.openStatus.todayText : p.openStatus.label;
              const visitTxt = p.historyRec ? `吃過 ${p.historyRec.count} 次` : '尚未解鎖';
              matrixTip.textContent = `${p.name} · ${p.category} · ${openTxt}（${visitTxt}）`;
            }
            matrixEl.querySelectorAll('.matrix-cell').forEach(el => el.classList.remove('is-selected'));
            cell.classList.add('is-selected');
          };
          matrixEl.appendChild(cell);
        });
      }

      // 分類飲食統計與近期紀錄
      const placeByKey = new Map();
      allPlaces.forEach(p => placeByKey.set(placeKey(p), p));

      const historyList = Object.values(appState.history || {})
        .filter(rec => rec && rec.count > 0)
        .sort((a, b) => (b.lastAteAt || 0) - (a.lastAteAt || 0));

      const totalMeals = historyList.reduce((acc, r) => acc + (r.count || 0), 0);
      const prefBarsEl = document.getElementById('homePrefBars');
      const recentListEl = document.getElementById('homeRecentList');

      if (prefBarsEl && recentListEl) {
        if (totalMeals === 0) {
          prefBarsEl.innerHTML = `<p class="history-empty">尚無用餐紀錄 — 前往衛星畫面抽中並點擊「出發去吃」後，系統會自動統計各分類比例與近期吃過的避重清單。</p>`;
          recentListEl.hidden = true;
          recentListEl.innerHTML = '';
        } else {
          const catMeals = {};
          realCats.forEach(c => { catMeals[c] = 0; });
          historyList.forEach(rec => {
            const matched = placeByKey.get(rec.key) || allPlaces.find(p => p.name === rec.name);
            const cat = matched ? matched.category : null;
            if (cat && catMeals[cat] !== undefined) {
              catMeals[cat] += rec.count || 1;
            }
          });
          const maxMeal = Math.max(1, ...Object.values(catMeals));

          prefBarsEl.innerHTML = realCats.map(cat => {
            const cnt = catMeals[cat];
            const pct = cnt > 0 ? Math.max(8, Math.round((cnt / maxMeal) * 100)) : 0;
            const col = CATEGORY_COLORS[cat] || '#EA5828';
            return `
              <div class="pref-row">
                <span class="pref-label">${escapeHtml(cat)}</span>
                <div class="pref-track">
                  <div class="pref-fill" style="width:${pct}%;background:${col};"></div>
                </div>
                <span class="pref-val">${cnt} 次</span>
              </div>
            `;
          }).join('');

          recentListEl.hidden = false;
          recentListEl.innerHTML = historyList.slice(0, 3).map(rec => {
            const matched = placeByKey.get(rec.key) || allPlaces.find(p => p.name === rec.name);
            const cat = matched ? matched.category : '口袋名單';
            return `
              <div class="recent-item">
                <span class="recent-name">${escapeHtml(rec.name)}</span>
                <span class="recent-meta">${escapeHtml(cat)} · ${escapeHtml(formatDaysAgo(rec.lastAteAt))}</span>
              </div>
            `;
          }).join('');
        }
      }

      // 底部動態圓盤啟動器狀態
      const enterBtn = document.getElementById('enterMapBtn');
      const enterMain = document.getElementById('enterMapBtnMain');
      const enterSub = document.getElementById('enterMapBtnSub');
      const dialCatVal = document.getElementById('dialCatVal');
      const dialOpenVal = document.getElementById('dialOpenVal');

      if (dialCatVal) dialCatVal.textContent = appState.prefs.category;
      if (dialOpenVal) dialOpenVal.textContent = appState.prefs.onlyOpen ? '只抽營業中' : '不限時段';

      if (enterBtn && enterMain && enterSub) {
        if (matchedCount > 0) {
          enterBtn.classList.remove('is-warn');
          enterMain.textContent = '出發選餐';
          enterSub.textContent = `${matchedCount} 間`;
        } else {
          enterBtn.classList.add('is-warn');
          enterMain.textContent = '改不限時';
          enterSub.textContent = '0 間';
        }
      }
    }

    // ==================== 雙畫面切換與 Page 2 HUD 更新 ====================
    function applyChrome() {
      const layerDef = MAP_LAYERS[appState.prefs.layer] || MAP_LAYERS.sat;
      document.body.setAttribute('data-layer', appState.prefs.layer);
      document.body.setAttribute('data-screen', appState.screen);

      const layerBtn = document.getElementById('layerToggleBtn');
      if (layerBtn) layerBtn.textContent = layerDef.label;

      const attrib = document.getElementById('mapAttrib');
      if (attrib) attrib.textContent = layerDef.attrib;

      const filterPill = document.getElementById('activeFilterPill');
      if (filterPill) {
        const count = getCandidates().length;
        const openTxt = appState.prefs.onlyOpen ? '營業中' : '不限時段';
        filterPill.textContent = `${appState.prefs.category} · ${openTxt} (${count})`;
      }
    }

    function updateFooterAvailability(hasPick, mode = 'result') {
      const readyDock = document.getElementById('readyDock');
      const resultDock = document.getElementById('resultDock');
      const startBtn = document.getElementById('startSpinBtn');
      const goBtn = document.getElementById('goEatBtn');
      const redrawBtn = document.getElementById('redrawBtn');

      if (mode === 'ready') {
        if (readyDock) readyDock.hidden = false;
        if (resultDock) resultDock.hidden = true;
        if (startBtn) startBtn.disabled = !hasPick;
      } else {
        if (readyDock) readyDock.hidden = true;
        if (resultDock) resultDock.hidden = false;
        if (goBtn) goBtn.disabled = !hasPick;
        if (redrawBtn) redrawBtn.disabled = !hasPick;
      }
    }

    function renderMapOverviewReady() {
      clearAnimations();
      const candidates = getCandidates();
      appState.currentPick = null;
      appState.focusPlace = null;
      applyChrome();

      const ov = computeOverviewCamera(candidates);
      appState.camera = { lat: ov.lat, lng: ov.lng, zoom: ov.zoom };

      const cardEl = document.getElementById('placeCard');
      const badgesEl = document.getElementById('cardBadges');
      const emptyEl = document.getElementById('emptyPanel');
      const titleEl = document.getElementById('cardTitle');
      const subEl = document.getElementById('cardSub');
      const metaEl = document.getElementById('cardMeta');
      const hudStatusEl = document.getElementById('hudStatusText');

      if (candidates.length === 0) {
        cardEl.hidden = true;
        emptyEl.hidden = false;
        updateFooterAvailability(false, 'ready');
        if (hudStatusEl) hudStatusEl.textContent = '目前無營業店家';
        return;
      }

      emptyEl.hidden = true;
      cardEl.hidden = false;
      cardEl.classList.remove('is-flying', 'is-landed');
      if (badgesEl) {
        badgesEl.hidden = false;
        const openTxtBadge = appState.prefs.onlyOpen ? '營業中篩選' : '全時段篩選';
        badgesEl.innerHTML = `
          <span class="card-badge-pill is-open">● ${escapeHtml(openTxtBadge)}</span>
          <span class="card-badge-pill">${escapeHtml(appState.prefs.category)}</span>
        `;
      }
      updateFooterAvailability(true, 'ready');

      const openTxt = appState.prefs.onlyOpen ? '僅限營業中' : '不限營業時段';
      titleEl.textContent = `已框選 ${candidates.length} 間候選餐廳`;
      subEl.textContent = `條件：${appState.prefs.category} · ${openTxt}（可先拖曳地圖或點圓點預覽）`;
      metaEl.textContent = '準備就緒 · 點擊下方按鈕開始衛星縮放輪轉';
      if (hudStatusEl) hudStatusEl.textContent = `全區鳥瞰待命 · ${candidates.length} 間`;
    }

    function openMapScreen() {
      if (getCandidates().length === 0 && appState.prefs.onlyOpen) {
        appState.prefs.onlyOpen = false;
        persistPrefs();
      }
      appState.screen = 'map';
      appState.passedIds.clear();
      document.body.setAttribute('data-screen', 'map');
      resizeCanvas();
      preloadCoreTiles(appState.prefs.layer);
      renderMapOverviewReady();
    }

    function openHomeScreen() {
      clearAnimations();
      appState.screen = 'home';
      document.body.setAttribute('data-screen', 'home');
      renderHomeDashboard();
    }

    function renderCardBadges(pick) {
      const badgesEl = document.getElementById('cardBadges');
      if (!badgesEl || !pick) return;
      const color = CATEGORY_COLORS[pick.category] || '#EA5828';
      const ratingHtml = Number.isFinite(Number(pick.rating))
        ? `<span class="card-badge-pill is-rating">★ ${Number(pick.rating).toFixed(1)}${Number.isFinite(Number(pick.reviews)) ? ` (${pick.reviews})` : ''}</span>`
        : '';
      const openState = pick.openStatus ? pick.openStatus.state : 'unknown';
      const openLabel = openState === 'open'
        ? '營業中'
        : (openState === 'closing_soon' ? '即將打烊' : (openState === 'closed' ? '休息中' : '時段未詳'));
      const openCls = openState === 'open' ? 'is-open' : '';
      badgesEl.hidden = false;
      badgesEl.innerHTML = `
        <span class="card-badge-pill" style="color:${color};border-color:${color}44;">● ${escapeHtml(pick.category)}</span>
        ${ratingHtml}
        <span class="card-badge-pill ${openCls}">${escapeHtml(openLabel)}</span>
      `;
    }

    function showPlaceCard(pick, state, stepNum = 0, totalSteps = 0) {
      const cardEl = document.getElementById('placeCard');
      const badgesEl = document.getElementById('cardBadges');
      const emptyEl = document.getElementById('emptyPanel');
      const titleEl = document.getElementById('cardTitle');
      const subEl = document.getElementById('cardSub');
      const metaEl = document.getElementById('cardMeta');
      const hudStatusEl = document.getElementById('hudStatusText');

      if (!pick) {
        cardEl.hidden = true;
        emptyEl.hidden = false;
        updateFooterAvailability(false, 'result');
        if (hudStatusEl) hudStatusEl.textContent = '目前無營業店家';
        return;
      }

      emptyEl.hidden = true;
      cardEl.hidden = false;
      updateFooterAvailability(true, 'result');

      if (state === 'flying') {
        cardEl.classList.remove('is-landed');
        cardEl.classList.add('is-flying');
        if (badgesEl) badgesEl.hidden = true;
        titleEl.textContent = '衛星俯視輪轉中…';
        subEl.textContent = '正縮小地圖並跳轉至下一間候選餐廳';
        metaEl.textContent = `候選清單 ${getCandidates().length} 間`;
        return;
      }

      if (state === 'focusing') {
        cardEl.classList.remove('is-landed');
        cardEl.classList.add('is-flying');
        renderCardBadges(pick);
        titleEl.textContent = pick.name;
        subEl.textContent = `${pick.category} · ${pick.note || '精選推薦'}`;
        metaEl.textContent = `輪轉聚焦 ${stepNum}/${totalSteps} · 即將縮小跳轉下一間`;
        return;
      }

      cardEl.classList.remove('is-flying');
      cardEl.classList.remove('is-landed');
      if (state === 'landed') {
        void cardEl.offsetWidth;
        cardEl.classList.add('is-landed');
      }

      renderCardBadges(pick);
      titleEl.textContent = pick.name;
      subEl.textContent = `${pick.category} · ${pick.note || '精選推薦'}`;
      metaEl.textContent = formatMinimalMeta(pick);
      if (hudStatusEl) {
        hudStatusEl.textContent = `已鎖定 · ${truncateLabel(pick.name, 9)}`;
      }
    }

    // ==================== 俯視衛星圖「縮小跳轉 ➔ 放大聚焦」輪轉引擎 ====================
    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function getPlaceCoords(place) {
      if (place && Number.isFinite(place.lat) && Number.isFinite(place.lng)) {
        return { lat: place.lat, lng: place.lng };
      }
      return { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng };
    }

    function computeOverviewCamera(candidates) {
      const geoList = (candidates || []).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
      if (geoList.length === 0) {
        return { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng, zoom: 14.6 };
      }
      if (geoList.length === 1) {
        return { lat: geoList[0].lat, lng: geoList[0].lng, zoom: 16.4 };
      }

      let minLat = Infinity;
      let maxLat = -Infinity;
      let minLng = Infinity;
      let maxLng = -Infinity;
      geoList.forEach(p => {
        if (p.lat < minLat) minLat = p.lat;
        if (p.lat > maxLat) maxLat = p.lat;
        if (p.lng < minLng) minLng = p.lng;
        if (p.lng > maxLng) maxLng = p.lng;
      });

      const centerLat = (minLat + maxLat) * 0.5;
      const centerLng = (minLng + maxLng) * 0.5;
      const openW = Math.max(180, viewport.width - 68);
      const openH = Math.max(200, viewport.height - 320);

      const xSpanBase = Math.max(1e-6, lngToWorldX(maxLng, 0) - lngToWorldX(minLng, 0));
      const ySpanBase = Math.max(1e-6, latToWorldY(minLat, 0) - latToWorldY(maxLat, 0));
      const zx = Math.log2(openW / xSpanBase);
      const zy = Math.log2(openH / ySpanBase);
      const fitZoom = Math.max(13.2, Math.min(15.6, Math.min(zx, zy)));

      return { lat: centerLat, lng: centerLng, zoom: fitZoom };
    }

    function animateCameraSegment(durationMs, onStep, onComplete) {
      const startTs = performance.now();
      const frame = nowTs => {
        const rawT = Math.min(1, (nowTs - startTs) / Math.max(1, durationMs));
        onStep(rawT);
        if (rawT < 1) {
          appState.animRaf = requestAnimationFrame(frame);
        } else {
          appState.animRaf = null;
          if (onComplete) onComplete();
        }
      };
      appState.animRaf = requestAnimationFrame(frame);
    }

    function flyCameraTo(targetCam, durationMs = 460) {
      clearAnimations();
      const fromCam = { ...appState.camera };
      appState.isAnimating = true;
      animateCameraSegment(
        durationMs,
        t => {
          const e = easeOutCubic(t);
          appState.camera.lat = lerp(fromCam.lat, targetCam.lat, e);
          appState.camera.lng = lerp(fromCam.lng, targetCam.lng, e);
          appState.camera.zoom = clampZoom(lerp(fromCam.zoom, targetCam.zoom, e));
        },
        () => {
          appState.isAnimating = false;
        }
      );
    }

    // 挑選空間分散的輪轉停靠站，讓每次縮小跳轉都明顯跨越台中街廓
    function buildHopSequence(candidates, startPlace, finalPick, maxHops = 3) {
      const finalKey = finalPick ? placeKey(finalPick) : null;
      const startKey = startPlace ? placeKey(startPlace) : null;
      const available = candidates.filter(c => Number.isFinite(c.lat) && Number.isFinite(c.lng) && placeKey(c) !== finalKey);
      if (available.length === 0) return [finalPick];

      const hopCount = Math.min(maxHops, available.length);
      const chosen = [];
      const usedKeys = new Set();
      let anchorCoords = startPlace ? getPlaceCoords(startPlace) : getPlaceCoords(finalPick);

      for (let i = 0; i < hopCount; i += 1) {
        let pool = available.filter(c => !usedKeys.has(placeKey(c)));
        if (i === 0 && startKey && pool.length > 1) {
          pool = pool.filter(c => placeKey(c) !== startKey);
        }
        const farPool = pool.filter(c => haversineMeters(anchorCoords.lat, anchorCoords.lng, c.lat, c.lng) >= 160);
        const pickFrom = farPool.length > 0 ? farPool : pool;
        const picked = pickFrom[Math.floor(Math.random() * pickFrom.length)];
        if (!picked) break;
        chosen.push(picked);
        usedKeys.add(placeKey(picked));
        anchorCoords = getPlaceCoords(picked);
      }

      return [...chosen, finalPick];
    }

    function runSatelliteRoulette(pick, prevPick, animate) {
      clearAnimations();
      if (!pick) {
        appState.focusPlace = null;
        showPlaceCard(null, 'static');
        return;
      }

      const targetCoords = getPlaceCoords(pick);
      const candidates = getCandidates();

      if (!animate) {
        preloadSpotTiles(appState.prefs.layer, pick);
        appState.focusPlace = pick;
        appState.camera = { lat: targetCoords.lat, lng: targetCoords.lng, zoom: LOCK_ZOOM };
        showPlaceCard(pick, 'static');
        return;
      }

      const waypoints = buildHopSequence(candidates, prevPick, pick, 3);
      waypoints.forEach(spot => preloadSpotTiles(appState.prefs.layer, spot));

      appState.isAnimating = true;
      appState.hopTrail = prevPick ? [getPlaceCoords(prevPick)] : [{ lat: appState.camera.lat, lng: appState.camera.lng }];
      showPlaceCard(pick, 'flying');
      const hudStatusEl = document.getElementById('hudStatusText');
      const totalStops = waypoints.length;

      const visitStop = idx => {
        const stopPlace = waypoints[idx];
        const stopCoords = getPlaceCoords(stopPlace);
        const isFinal = idx === totalStops - 1;
        const startCam = { ...appState.camera };
        const alreadyZoomedOut = idx === 0 && startCam.zoom <= CRUISE_ZOOM + 0.65;
        const pullDur = alreadyZoomedOut ? 0 : (isFinal ? 290 : 250);
        const flyZoomDur = isFinal ? 580 : (430 + idx * 25);
        const holdDur = 270;
        const destZoom = isFinal ? LOCK_ZOOM : HOP_FOCUS_ZOOM;

        const runFlyAndFocus = () => {
          // 階段 2：飛躍到該店座標並放大衛星圖聚焦屋頂
          const flyFrom = { ...appState.camera };
          let switchedFocus = false;

          animateCameraSegment(
            flyZoomDur,
            t => {
              const posE = easeInOutCubic(t);
              appState.camera.lat = lerp(flyFrom.lat, stopCoords.lat, posE);
              appState.camera.lng = lerp(flyFrom.lng, stopCoords.lng, posE);

              // 先在高空跨過街區，隨後迅速放大俯衝聚焦在該店屋頂
              const zoomProgress = Math.max(0, (t - 0.16) / 0.84);
              appState.camera.zoom = lerp(flyFrom.zoom, destZoom, easeOutCubic(zoomProgress));

              if (!switchedFocus && t >= 0.28) {
                switchedFocus = true;
                appState.focusPlace = stopPlace;
                if (hudStatusEl) {
                  hudStatusEl.textContent = isFinal
                    ? `放大鎖定 · ${truncateLabel(stopPlace.name, 8)}`
                    : `放大聚焦 (${idx + 1}/${totalStops}) · ${truncateLabel(stopPlace.name, 8)}`;
                }
              }
            },
            () => {
              appState.focusPlace = stopPlace;
              appState.hopTrail.push(stopCoords);

              if (isFinal) {
                appState.isAnimating = false;
                appState.isFocusingStop = false;
                appState.flightArc = null;
                appState.hopTrail = [];
                showPlaceCard(pick, 'landed');
                return;
              }

              // 階段 3：短暫放大聚焦停留，讓使用者看清衛星屋頂與店名，隨後再縮小跳轉下一間
              appState.isFocusingStop = true;
              showPlaceCard(stopPlace, 'focusing', idx + 1, totalStops);
              const holdTimer = setTimeout(() => {
                visitStop(idx + 1);
              }, holdDur);
              appState.animTimers.push(holdTimer);
            }
          );
        };

        // 階段 1：縮小地圖拉高（若目前是從全區俯視剛起跳，直接飛往第一站放大聚焦）
        appState.isFocusingStop = false;
        appState.flightArc = { from: { lat: startCam.lat, lng: startCam.lng }, to: stopCoords };

        if (pullDur === 0) {
          if (hudStatusEl) {
            hudStatusEl.textContent = `起跳聚焦 (${idx + 1}/${totalStops}) · ${truncateLabel(stopPlace.name, 8)}`;
          }
          runFlyAndFocus();
          return;
        }

        if (hudStatusEl) {
          hudStatusEl.textContent = isFinal
            ? `縮小跳轉 · 最終站 (${idx + 1}/${totalStops})`
            : `縮小地圖 · 跳轉下一間 (${idx + 1}/${totalStops})`;
        }

        const pullMidLat = lerp(startCam.lat, stopCoords.lat, 0.24);
        const pullMidLng = lerp(startCam.lng, stopCoords.lng, 0.24);

        animateCameraSegment(
          pullDur,
          t => {
            const e = easeOutCubic(t);
            appState.camera.lat = lerp(startCam.lat, pullMidLat, e);
            appState.camera.lng = lerp(startCam.lng, pullMidLng, e);
            appState.camera.zoom = lerp(startCam.zoom, CRUISE_ZOOM, e);
          },
          runFlyAndFocus
        );
      };

      visitStop(0);
    }

    function triggerDraw(excludeCurrent = true, animate = true) {
      if (appState.isAnimating) return;
      const prevPick = appState.currentPick;
      if (excludeCurrent && prevPick) {
        appState.passedIds.add(placeKey(prevPick));
      }
      const pick = drawNextCandidate(excludeCurrent);
      runSatelliteRoulette(pick, prevPick, Boolean(pick && animate));
    }

    function cycleMapLayer() {
      const idx = LAYER_ORDER.indexOf(appState.prefs.layer);
      const nextLayer = LAYER_ORDER[(idx + 1) % LAYER_ORDER.length];
      appState.prefs.layer = nextLayer;
      persistPrefs();
      preloadCoreTiles(nextLayer);
      if (appState.currentPick) preloadSpotTiles(nextLayer, appState.currentPick);
      applyChrome();
    }

    // ==================== 地圖拖曳、縮放與點選地標互動 ====================
    function bindCanvasGestures() {
      const pointers = new Map();
      let dragStart = null;
      let camStart = null;
      let pinchStartDist = 0;
      let pinchStartZoom = LOCK_ZOOM;
      let movedDist = 0;

      function getPinchDistance() {
        const vals = Array.from(pointers.values());
        if (vals.length < 2) return 0;
        return Math.hypot(vals[1].x - vals[0].x, vals[1].y - vals[0].y);
      }

      canvas.addEventListener('pointerdown', e => {
        if (appState.isAnimating) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        canvas.setPointerCapture(e.pointerId);

        if (pointers.size === 1) {
          dragStart = { x: e.clientX, y: e.clientY };
          camStart = { ...appState.camera };
          movedDist = 0;
        } else if (pointers.size === 2) {
          pinchStartDist = getPinchDistance();
          pinchStartZoom = appState.camera.zoom;
          movedDist = 999;
        }
      });

      canvas.addEventListener('pointermove', e => {
        if (!pointers.has(e.pointerId) || appState.isAnimating) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (pointers.size === 2 && pinchStartDist > 10) {
          const curDist = getPinchDistance();
          if (curDist > 10) {
            const deltaZ = Math.log2(curDist / pinchStartDist);
            appState.camera.zoom = clampZoom(pinchStartZoom + deltaZ);
          }
          return;
        }

        if (pointers.size === 1 && dragStart && camStart) {
          const dx = e.clientX - dragStart.x;
          const dy = e.clientY - dragStart.y;
          movedDist = Math.max(movedDist, Math.hypot(dx, dy));

          const wx = lngToWorldX(camStart.lng, camStart.zoom) - dx;
          const wy = latToWorldY(camStart.lat, camStart.zoom) - dy;
          const clamped = clampLatLng(worldYToLat(wy, camStart.zoom), worldXToLng(wx, camStart.zoom));
          appState.camera.lat = clamped.lat;
          appState.camera.lng = clamped.lng;
        }
      });

      const handlePointerEnd = e => {
        const wasSingleTap = pointers.size === 1 && movedDist <= 6 && !appState.isAnimating;
        const rect = canvas.getBoundingClientRect();
        const tapX = e.clientX - rect.left;
        const tapY = e.clientY - rect.top;

        pointers.delete(e.pointerId);
        if (pointers.size === 1) {
          const remaining = Array.from(pointers.values())[0];
          dragStart = { x: remaining.x, y: remaining.y };
          camStart = { ...appState.camera };
        } else if (pointers.size === 0) {
          dragStart = null;
          camStart = null;
        }

        if (wasSingleTap) {
          // 命中檢索：若點到某個候選餐廳圓點，鏡頭平滑飛往該店並放大聚焦
          const candidates = getCandidates();
          let bestPlace = null;
          let bestDist = 24;
          candidates.forEach(c => {
            if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng)) return;
            const pt = projectToScreen(c.lat, c.lng);
            const d = Math.hypot(pt.x - tapX, pt.y - tapY);
            if (d < bestDist) {
              bestDist = d;
              bestPlace = c;
            }
          });
          if (bestPlace) {
            appState.currentPick = bestPlace;
            appState.focusPlace = bestPlace;
            preloadSpotTiles(appState.prefs.layer, bestPlace);
            showPlaceCard(bestPlace, 'landed');
            flyCameraTo({
              lat: bestPlace.lat,
              lng: bestPlace.lng,
              zoom: Math.max(appState.camera.zoom, HOP_FOCUS_ZOOM)
            }, 420);
          }
        }
      };

      canvas.addEventListener('pointerup', handlePointerEnd);
      canvas.addEventListener('pointercancel', handlePointerEnd);

      canvas.addEventListener('wheel', e => {
        if (appState.isAnimating) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const anchor = getAnchorPoint();
        const before = screenToLatLng(sx, sy);
        const step = e.deltaY > 0 ? -0.45 : 0.45;
        const nextZoom = clampZoom(appState.camera.zoom + step);

        appState.camera.zoom = nextZoom;
        const bx = lngToWorldX(before.lng, nextZoom);
        const by = latToWorldY(before.lat, nextZoom);
        const newCamX = bx - (sx - anchor.x);
        const newCamY = by - (sy - anchor.y);
        const clamped = clampLatLng(worldYToLat(newCamY, nextZoom), worldXToLng(newCamX, nextZoom));
        appState.camera.lat = clamped.lat;
        appState.camera.lng = clamped.lng;
      }, { passive: false });
    }

    // ==================== Toast 與本機／GAS 雲端保存 ====================
    function showToast(message) {
      const el = document.getElementById('appToast');
      if (!el) return;
      el.textContent = message;
      el.classList.add('is-show');
      if (appState.toastTimer) clearTimeout(appState.toastTimer);
      appState.toastTimer = setTimeout(() => {
        el.classList.remove('is-show');
      }, 2200);
    }

    function persistCustomPlaces() {
      appState.hasLocalEdits = true;
      saveJson(CUSTOM_PLACES_KEY, {
        places: appState.places,
        updatedAt: new Date().toISOString()
      });
    }

    async function postGasAction(payload) {
      const url = (appState.gasConfig.url || '').trim();
      const token = (appState.gasConfig.token || '').trim();
      if (!url || !token) return { skipped: true };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...payload, token })
      });
      const data = await res.json();
      if (!data || !data.ok) {
        throw new Error((data && data.error) || 'SYNC_FAILED');
      }
      return data;
    }

    async function syncMutationInBackground(payload, localOkMsg) {
      if (!appState.gasConfig.url || !appState.gasConfig.token) {
        showToast(localOkMsg);
        return;
      }
      showToast(`${localOkMsg}，同步雲端中…`);
      try {
        const res = await postGasAction(payload);
        // 若雲端 GAS 自動展開短網址抓回精準座標，同步補回本機
        if (payload.action === 'upsert' && payload.place && Number.isFinite(Number(res.lat)) && Number.isFinite(Number(res.lng))) {
          const target = appState.places.find(p => p.id === payload.place.id);
          if (target && (!Number.isFinite(target.lat) || !Number.isFinite(target.lng))) {
            target.lat = Number(res.lat);
            target.lng = Number(res.lng);
            persistCustomPlaces();
            if (appState.screen === 'manage') renderManageList();
          }
        }
        showToast('已儲存並同步至 Google Sheets');
      } catch (_) {
        showToast(`${localOkMsg}（雲端同步失敗，已保留本機修改）`);
      }
    }

    function generateNextPlaceId() {
      let maxNum = 0;
      appState.places.forEach(p => {
        const m = String(p.id || '').match(/^p(\d+)$/i);
        if (m) maxNum = Math.max(maxNum, Number(m[1]));
      });
      return `p${String(maxNum + 1).padStart(2, '0')}`;
    }

    // ==================== PAGE 3：口袋名單管理頁 ====================
    const MANAGE_DAY_DEFS = [
      { key: 'mon', label: '週一' },
      { key: 'tue', label: '週二' },
      { key: 'wed', label: '週三' },
      { key: 'thu', label: '週四' },
      { key: 'fri', label: '週五' },
      { key: 'sat', label: '週六' },
      { key: 'sun', label: '週日' }
    ];

    function openManageScreen() {
      clearAnimations();
      appState.screen = 'manage';
      document.body.setAttribute('data-screen', 'manage');
      renderManageList();
    }

    function renderManageList() {
      const allEnriched = getAllEnrichedPlaces(true);
      const countBadge = document.getElementById('manageCountBadge');
      const enabledCount = allEnriched.filter(p => p.enabled !== false).length;
      if (countBadge) {
        countBadge.textContent = enabledCount === allEnriched.length
          ? `${allEnriched.length} 間`
          : `${enabledCount}/${allEnriched.length} 啟用`;
      }

      const filterRow = document.getElementById('manageFilterRow');
      const manageFilters = [...CATEGORIES, '已停用'];
      if (filterRow) {
        filterRow.innerHTML = '';
        manageFilters.forEach(f => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `m-filter-pill ${appState.manageFilter === f ? 'is-active' : ''}`;
          btn.textContent = f;
          btn.onclick = () => {
            appState.manageFilter = f;
            renderManageList();
          };
          filterRow.appendChild(btn);
        });
      }

      const kw = (appState.manageSearch || '').trim().toLowerCase();
      const filtered = allEnriched.filter(p => {
        if (appState.manageFilter === '已停用') {
          if (p.enabled !== false) return false;
        } else if (appState.manageFilter !== '全部') {
          if (p.category !== appState.manageFilter) return false;
        }
        if (kw) {
          const hay = `${p.name} ${p.category} ${p.note || ''}`.toLowerCase();
          if (!hay.includes(kw)) return false;
        }
        return true;
      });

      const listEl = document.getElementById('manageList');
      if (!listEl) return;

      if (filtered.length === 0) {
        listEl.innerHTML = `<div class="manage-empty">找不到符合條件的店家，可換個關鍵字或點右上角「＋ 新增」。</div>`;
        return;
      }

      listEl.innerHTML = '';
      filtered.forEach((p, idx) => {
        const isOn = p.enabled !== false;
        const color = CATEGORY_COLORS[p.category] || '#EA5828';
        const hasCoords = Number.isFinite(p.lat) && Number.isFinite(p.lng);
        const openTxt = p.openStatus.state === 'open' ? p.openStatus.todayText : p.openStatus.label;
        const ratingBadge = Number.isFinite(Number(p.rating))
          ? `<span class="store-rating-tag">★ ${Number(p.rating).toFixed(1)}</span>`
          : '';

        const row = document.createElement('div');
        row.className = `store-row ${isOn ? '' : 'is-disabled'}`.trim();
        row.style.setProperty('--row-idx', String(Math.min(idx, 16)));
        row.innerHTML = `
          <div class="store-row-info">
            <div class="store-row-head">
              <span class="store-dot" style="background:${color};color:${color};"></span>
              <span class="store-row-name">${escapeHtml(p.name)}</span>
              ${ratingBadge}
              ${isOn ? '' : '<span class="store-muted-tag">已停用</span>'}
            </div>
            <div class="store-row-sub">${escapeHtml(p.category)} · ${escapeHtml(p.note || '無備註')} · ${escapeHtml(openTxt)}${hasCoords ? '' : ' · 未設座標'}</div>
          </div>
          <div class="store-row-controls">
            <button type="button" class="mini-switch ${isOn ? 'is-on' : ''}" role="switch" aria-checked="${isOn}" aria-label="切換啟用 ${escapeHtml(p.name)}"></button>
            <button type="button" class="row-edit-btn">編輯</button>
          </div>
        `;

        const switchBtn = row.querySelector('.mini-switch');
        switchBtn.onclick = () => {
          const target = appState.places.find(item => placeKey(item) === placeKey(p));
          if (!target) return;
          target.enabled = target.enabled === false;
          persistCustomPlaces();
          renderManageList();
          syncMutationInBackground(
            { action: 'upsert', place: target },
            target.enabled ? `已啟用「${target.name}」` : `已暫停「${target.name}」`
          );
        };

        const editBtn = row.querySelector('.row-edit-btn');
        editBtn.onclick = () => {
          const rawPlace = appState.places.find(item => placeKey(item) === placeKey(p)) || p;
          openEditorModal(rawPlace);
        };

        listEl.appendChild(row);
      });
    }

    // ==================== 彈出抽屜 1：新增／編輯餐廳 ====================
    function renderEditorCategories() {
      const catRow = document.getElementById('editCatRow');
      if (!catRow) return;
      catRow.innerHTML = '';
      CATEGORIES.slice(1).forEach(cat => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `cat-pick-btn ${appState.editingCategory === cat ? 'is-active' : ''}`;
        btn.textContent = cat;
        btn.onclick = () => {
          appState.editingCategory = cat;
          renderEditorCategories();
        };
        catRow.appendChild(btn);
      });
    }

    function renderEditorHours(hoursObj = {}) {
      const grid = document.getElementById('editHoursGrid');
      if (!grid) return;
      grid.innerHTML = '';
      MANAGE_DAY_DEFS.forEach(({ key, label }) => {
        const val = hoursObj[key] || '';
        const isRest = val === '休';
        const row = document.createElement('div');
        row.className = 'hour-row';
        row.innerHTML = `
          <span class="hour-day">${label}</span>
          <input type="text" class="field-input hour-input" data-day="${key}" value="${escapeHtml(val)}" placeholder="11:00-20:00 或 休" />
          <button type="button" class="hour-rest-btn ${isRest ? 'is-rest' : ''}" data-day="${key}">休</button>
        `;
        const input = row.querySelector('.hour-input');
        const restBtn = row.querySelector('.hour-rest-btn');
        input.oninput = () => {
          restBtn.classList.toggle('is-rest', input.value.trim() === '休');
        };
        restBtn.onclick = () => {
          if (input.value.trim() === '休') {
            input.value = '';
            restBtn.classList.remove('is-rest');
          } else {
            input.value = '休';
            restBtn.classList.add('is-rest');
          }
        };
        grid.appendChild(row);
      });
    }

    function updateEditorEnabledSwitch() {
      const sw = document.getElementById('editEnabledToggle');
      if (!sw) return;
      sw.classList.toggle('is-on', appState.editingEnabled);
      sw.setAttribute('aria-checked', String(appState.editingEnabled));
    }

    function openEditorModal(place = null) {
      const modal = document.getElementById('editorModal');
      const titleEl = document.getElementById('editorTitle');
      const delBtn = document.getElementById('deletePlaceBtn');
      const saveBtn = document.getElementById('savePlaceBtn');
      const feedback = document.getElementById('parseFeedback');
      const syncShortcut = document.getElementById('openSyncFromEditorBtn');
      const parseBtn = document.getElementById('parseMapsBtn');

      appState.editingPlaceId = place ? placeKey(place) : null;
      appState.editingCategory = (place && CATEGORIES.includes(place.category) && place.category !== '全部')
        ? place.category
        : '便當飯類';
      appState.editingEnabled = place ? place.enabled !== false : true;
      appState.editingRating = (place && Number.isFinite(Number(place.rating))) ? Number(place.rating) : null;
      appState.editingReviews = (place && Number.isFinite(Number(place.reviews))) ? Number(place.reviews) : null;
      appState.deleteArmed = false;

      if (titleEl) titleEl.textContent = place ? '編輯餐廳' : '新增餐廳';
      if (saveBtn) saveBtn.textContent = place ? '儲存變更' : '新增至口袋名單';
      if (delBtn) {
        delBtn.hidden = !place;
        delBtn.classList.remove('is-confirm');
        delBtn.textContent = '刪除店家';
      }
      if (feedback) {
        feedback.textContent = '';
        feedback.classList.remove('is-warn');
      }
      if (syncShortcut) syncShortcut.hidden = true;
      if (parseBtn) {
        parseBtn.disabled = false;
        parseBtn.textContent = '自動抓取店名與營業時間';
      }

      document.getElementById('editMapsPaste').value = '';
      document.getElementById('editName').value = place ? (place.name || '') : '';
      document.getElementById('editNote').value = place ? (place.note || '') : '';
      document.getElementById('editLat').value = (place && Number.isFinite(place.lat)) ? String(place.lat) : '';
      document.getElementById('editLng').value = (place && Number.isFinite(place.lng)) ? String(place.lng) : '';
      document.getElementById('editMapsUrl').value = place ? (place.maps_url || '') : '';
      document.getElementById('quickHoursInput').value = '';

      renderEditorCategories();
      updateEditorEnabledSwitch();
      renderEditorHours(place ? (place.hours || {}) : {});

      if (modal) {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('has-modal-open');
      }
    }

    function syncModalBodyClass() {
      const ed = document.getElementById('editorModal');
      const sy = document.getElementById('syncModal');
      const anyOpen = Boolean((ed && ed.classList.contains('is-open')) || (sy && sy.classList.contains('is-open')));
      document.body.classList.toggle('has-modal-open', anyOpen);
    }

    function closeEditorModal() {
      const modal = document.getElementById('editorModal');
      if (modal) {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      }
      appState.deleteArmed = false;
      syncModalBodyClass();
    }

    async function handleParseMapsPaste() {
      const raw = document.getElementById('editMapsPaste').value.trim();
      const feedback = document.getElementById('parseFeedback');
      const syncShortcut = document.getElementById('openSyncFromEditorBtn');
      const parseBtn = document.getElementById('parseMapsBtn');
      const nameInput = document.getElementById('editName');
      const noteInput = document.getElementById('editNote');
      const latInput = document.getElementById('editLat');
      const lngInput = document.getElementById('editLng');
      const urlInput = document.getElementById('editMapsUrl');

      if (!raw) {
        feedback.textContent = '請先貼上 Google Maps 分享連結、網址，或直接輸入店名。';
        feedback.classList.add('is-warn');
        if (syncShortcut) syncShortcut.hidden = true;
        return;
      }

      // 1. 先執行本機即時解析（若為完整網址，立刻先填上能拆出的欄位）
      const parsed = parseGoogleMapsInput(raw);
      if (parsed.name) nameInput.value = parsed.name;
      if (Number.isFinite(parsed.lat)) latInput.value = String(parsed.lat);
      if (Number.isFinite(parsed.lng)) lngInput.value = String(parsed.lng);
      if (parsed.maps_url) urlInput.value = parsed.maps_url;

      const hasGas = Boolean((appState.gasConfig.url || '').trim() && (appState.gasConfig.token || '').trim());

      // 2. 若已連接 Apps Script，透過雲端展開短網址 + 呼叫 Google Places API (New) 抓完整資訊
      if (hasGas) {
        if (syncShortcut) syncShortcut.hidden = true;
        if (parseBtn) {
          parseBtn.disabled = true;
          parseBtn.textContent = '查詢 Google 地圖中…';
        }
        feedback.textContent = '正在透過雲端展開連結並抓取週一～週日營業時間…';
        feedback.classList.remove('is-warn');

        try {
          const res = await postGasAction({ action: 'lookup', input: raw });
          const place = res && res.place;
          if (!place) {
            feedback.textContent = '雲端查無相符店家，請確認連結或直接輸入完整店名再試一次。';
            feedback.classList.add('is-warn');
            return;
          }

          if (place.name) nameInput.value = place.name;
          if (Number.isFinite(Number(place.lat))) latInput.value = String(Number(place.lat));
          if (Number.isFinite(Number(place.lng))) lngInput.value = String(Number(place.lng));
          if (place.maps_url) urlInput.value = place.maps_url;
          if (place.note && !noteInput.value.trim()) noteInput.value = place.note;

          if (place.category && CATEGORIES.includes(place.category) && place.category !== '全部') {
            appState.editingCategory = place.category;
            renderEditorCategories();
          }
          if (Number.isFinite(Number(place.rating))) appState.editingRating = Number(place.rating);
          if (Number.isFinite(Number(place.reviews))) appState.editingReviews = Number(place.reviews);

          const hasAnyHours = place.hours && Object.values(place.hours).some(v => String(v || '').trim() !== '');
          if (hasAnyHours) {
            renderEditorHours(place.hours);
          }

          if (res.source === 'google_places_api') {
            const ratingStr = Number.isFinite(Number(place.rating)) ? ` · ★${Number(place.rating).toFixed(1)}` : '';
            const hoursMsg = hasAnyHours ? '與週一～週日營業時間' : '（Google 未提供該店營業時間）';
            feedback.textContent = `✔ 已自動帶入「${place.name || '店家'}」座標${hoursMsg}${ratingStr}`;
            feedback.classList.remove('is-warn');
          } else {
            feedback.textContent = res.placesApiConfigured
              ? '✔ 已展開連結帶入店名與座標，但 Google Places 查無營業時間，請手動補填。'
              : '✔ 已展開短網址帶入店名與座標；若要自動抓取 7 天營業時間，請於 Apps Script 填入 Places API Key。';
            feedback.classList.add('is-warn');
          }
        } catch (err) {
          feedback.textContent = `雲端查詢失敗：${err.message || '請確認網路與 Apps Script 設定'}`;
          feedback.classList.add('is-warn');
          if (syncShortcut) syncShortcut.hidden = false;
        } finally {
          if (parseBtn) {
            parseBtn.disabled = false;
            parseBtn.textContent = '自動抓取店名與營業時間';
          }
        }
        return;
      }

      // 3. 尚未連接 Apps Script 時，給予明確引導與一鍵設定按鈕
      const looksLikeShortUrl = /maps\.app\.goo\.gl|goo\.gl\/maps|g\.co\/kgs/i.test(raw);
      if (Number.isFinite(parsed.lat) && Number.isFinite(parsed.lng)) {
        feedback.textContent = `✔ 已從網址帶入「${parsed.name || '座標'}」(${parsed.lat.toFixed(4)}, ${parsed.lng.toFixed(4)})。Google Maps 網址本身不含營業時間，設定免費雲端腳本即可自動抓 7 天營業時間。`;
        feedback.classList.add('is-warn');
        if (syncShortcut) syncShortcut.hidden = false;
      } else if (looksLikeShortUrl) {
        feedback.textContent = '短網址（maps.app.goo.gl）受瀏覽器跨域限制無法直接展開，且網址本身不含營業時間。完成下方免費 Apps Script 設定後，貼上連結即可自動帶入店名、座標與 7 天營業時間。';
        feedback.classList.add('is-warn');
        if (syncShortcut) syncShortcut.hidden = false;
      } else {
        feedback.textContent = '尚未連接雲端抓取服務；設定免費 Apps Script 後，貼上 Google Maps 連結或輸入店名即可自動帶入店名、座標與週一～週日營業時間。';
        feedback.classList.add('is-warn');
        if (syncShortcut) syncShortcut.hidden = false;
      }
    }

    function saveEditorPlace() {
      const name = document.getElementById('editName').value.trim();
      if (!name) {
        showToast('請輸入餐廳名稱');
        document.getElementById('editName').focus();
        return;
      }

      const latRaw = document.getElementById('editLat').value.trim();
      const lngRaw = document.getElementById('editLng').value.trim();
      const lat = latRaw !== '' && Number.isFinite(Number(latRaw)) ? Number(latRaw) : null;
      const lng = lngRaw !== '' && Number.isFinite(Number(lngRaw)) ? Number(lngRaw) : null;
      const note = document.getElementById('editNote').value.trim();
      let mapsUrl = document.getElementById('editMapsUrl').value.trim();
      if (!mapsUrl) {
        mapsUrl = (Number.isFinite(lat) && Number.isFinite(lng))
          ? `https://maps.google.com/?q=${lat},${lng}`
          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
      }

      const hours = {};
      document.querySelectorAll('#editHoursGrid .hour-input').forEach(inp => {
        hours[inp.dataset.day] = inp.value.trim();
      });

      const isEdit = Boolean(appState.editingPlaceId);
      let savedPlace = null;

      if (isEdit) {
        const idx = appState.places.findIndex(p => placeKey(p) === appState.editingPlaceId);
        if (idx >= 0) {
          savedPlace = {
            ...appState.places[idx],
            name,
            category: appState.editingCategory,
            rating: appState.editingRating !== null ? appState.editingRating : appState.places[idx].rating,
            reviews: appState.editingReviews !== null ? appState.editingReviews : appState.places[idx].reviews,
            lat,
            lng,
            hours,
            maps_url: mapsUrl,
            note,
            enabled: appState.editingEnabled
          };
          appState.places[idx] = savedPlace;
        }
      }

      if (!savedPlace) {
        savedPlace = {
          id: generateNextPlaceId(),
          name,
          category: appState.editingCategory,
          rating: appState.editingRating,
          reviews: appState.editingReviews,
          lat,
          lng,
          hours,
          maps_url: mapsUrl,
          note,
          enabled: appState.editingEnabled
        };
        appState.places.unshift(savedPlace);
      }

      persistCustomPlaces();
      closeEditorModal();
      renderManageList();
      renderHomeDashboard();
      syncMutationInBackground(
        { action: 'upsert', place: savedPlace },
        isEdit ? `已更新「${savedPlace.name}」` : `已新增「${savedPlace.name}」`
      );
    }

    function handleDeletePlace() {
      const delBtn = document.getElementById('deletePlaceBtn');
      if (!appState.editingPlaceId) return;

      if (!appState.deleteArmed) {
        appState.deleteArmed = true;
        delBtn.classList.add('is-confirm');
        delBtn.textContent = '再點確認刪除';
        setTimeout(() => {
          if (appState.deleteArmed) {
            appState.deleteArmed = false;
            delBtn.classList.remove('is-confirm');
            delBtn.textContent = '刪除店家';
          }
        }, 3500);
        return;
      }

      const idx = appState.places.findIndex(p => placeKey(p) === appState.editingPlaceId);
      if (idx < 0) return;
      const [removed] = appState.places.splice(idx, 1);
      persistCustomPlaces();
      closeEditorModal();
      renderManageList();
      renderHomeDashboard();
      syncMutationInBackground(
        { action: 'delete', id: removed.id || removed.name },
        `已刪除「${removed.name}」`
      );
    }

    // ==================== 彈出抽屜 2：雲端同步與 CSV 匯出 ====================
    function buildFullCsvText() {
      const header = 'id,name,category,rating,reviews,lat,lng,mon,tue,wed,thu,fri,sat,sun,maps_url,note,enabled';
      const rows = appState.places.map(placeToCsvRow);
      return `\uFEFF${[header, ...rows].join('\r\n')}`;
    }

    function openSyncModal() {
      const modal = document.getElementById('syncModal');
      document.getElementById('gasUrlInput').value = appState.gasConfig.url || '';
      document.getElementById('gasTokenInput').value = appState.gasConfig.token || '';
      const statusEl = document.getElementById('gasStatusText');
      if (statusEl) {
        statusEl.textContent = appState.gasConfig.url ? '已設定雲端同步網址' : '';
        statusEl.classList.remove('is-err');
      }
      const resetBtn = document.getElementById('resetDefaultBtn');
      if (resetBtn) {
        appState.resetArmed = false;
        resetBtn.classList.remove('is-confirm');
        resetBtn.textContent = '重設回預設 49 間';
      }
      if (modal) {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('has-modal-open');
      }
    }

    function closeSyncModal() {
      const modal = document.getElementById('syncModal');
      if (modal) {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      }
      syncModalBodyClass();
    }

    // ==================== 背景同步與 GPS ====================
    async function backgroundSync(forcePull = false) {
      if (!forcePull && appState.hasLocalEdits) return false;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(`${DEFAULT_SHEET_CSV_URL}&_t=${Date.now()}`, { signal: controller.signal, cache: 'no-store' });
        if (!res.ok) return false;
        const text = await res.text();
        const parsed = csvToPlaces(text);
        if (parsed.length > 0) {
          appState.places = parsed;
          if (forcePull) {
            appState.hasLocalEdits = false;
            try { localStorage.removeItem(CUSTOM_PLACES_KEY); } catch (_) {}
          }
          saveJson(STORAGE_KEYS.placesCache, { places: parsed, syncedAt: new Date().toISOString() });
          renderHomeDashboard();
          if (appState.screen === 'manage') renderManageList();
          return true;
        }
        return false;
      } catch (_) {
        return false;
      } finally {
        clearTimeout(timer);
      }
    }

    function requestGps() {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        pos => {
          appState.userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude, hasGps: true };
          if (appState.screen === 'home') {
            renderHomeDashboard();
          } else if (appState.screen === 'map' && !appState.isAnimating && appState.currentPick) {
            const refreshed = getCandidates().find(c => placeKey(c) === placeKey(appState.currentPick));
            if (refreshed) {
              appState.currentPick = refreshed;
              appState.focusPlace = refreshed;
              showPlaceCard(refreshed, 'static');
            }
          }
        },
        () => {},
        { enableHighAccuracy: false, timeout: 4500, maximumAge: 180000 }
      );
    }

    // ==================== 事件綁定與啟動 ====================
    // Page 1：主畫面事件
    const toggleHomeOpen = () => {
      appState.prefs.onlyOpen = !appState.prefs.onlyOpen;
      persistPrefs();
      renderHomeDashboard();
    };

    document.getElementById('homeOpenToggle').onclick = toggleHomeOpen;
    const openRingCard = document.getElementById('openRingCard');
    if (openRingCard) openRingCard.onclick = toggleHomeOpen;
    const dialOpenSideBtn = document.getElementById('dialOpenSideBtn');
    if (dialOpenSideBtn) dialOpenSideBtn.onclick = toggleHomeOpen;

    const openManageBtn = document.getElementById('openManageBtn');
    if (openManageBtn) openManageBtn.onclick = openManageScreen;

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
      themeToggleBtn.onclick = () => {
        const curIdx = THEME_ORDER.indexOf(appState.prefs.theme);
        const nextTheme = THEME_ORDER[(curIdx + 1) % THEME_ORDER.length];
        appState.prefs.theme = nextTheme;
        applyThemeDom(nextTheme);
        persistPrefs();
        showToast(`配色：${THEME_LABELS[nextTheme]}`);
      };
    }

    const teaserCard = document.getElementById('teaserCard');
    if (teaserCard) teaserCard.onclick = shuffleTeaserCard;

    document.querySelectorAll('.sub-tab').forEach(btn => {
      btn.onclick = () => {
        appState.homeSubTab = btn.dataset.subtab;
        renderHomeDashboard();
      };
    });

    document.getElementById('enterMapBtn').onclick = launchFromDial;

    // SceneAI / 60fps.design 卡片動態聚光追蹤 (--mx / --my)
    document.querySelectorAll('.bento-card').forEach(card => {
      card.addEventListener('pointermove', e => {
        const rect = card.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', `${x.toFixed(1)}%`);
        card.style.setProperty('--my', `${y.toFixed(1)}%`);
      }, { passive: true });
    });

    // Page 2：衛星俯視抽籤畫面事件
    document.getElementById('backToHomeBtn').onclick = openHomeScreen;
    document.getElementById('activeFilterPill').onclick = openHomeScreen;
    document.getElementById('layerToggleBtn').onclick = cycleMapLayer;

    document.getElementById('emptyShowAllBtn').onclick = () => {
      if (appState.isAnimating) return;
      appState.prefs.onlyOpen = false;
      persistPrefs();
      renderMapOverviewReady();
    };

    document.getElementById('zoomInBtn').onclick = () => {
      if (appState.isAnimating) return;
      flyCameraTo({ ...appState.camera, zoom: clampZoom(appState.camera.zoom + 0.85) }, 260);
    };

    document.getElementById('zoomOutBtn').onclick = () => {
      if (appState.isAnimating) return;
      flyCameraTo({ ...appState.camera, zoom: clampZoom(appState.camera.zoom - 0.85) }, 260);
    };

    document.getElementById('overviewBtn').onclick = () => {
      if (appState.isAnimating) return;
      const ov = computeOverviewCamera(getCandidates());
      flyCameraTo(ov, 480);
    };

    document.getElementById('startSpinBtn').onclick = () => triggerDraw(false, true);
    document.getElementById('redrawBtn').onclick = () => triggerDraw(true, true);
    document.getElementById('goEatBtn').onclick = goEatCurrent;

    // Page 3：名單管理與編輯抽屜事件
    document.getElementById('manageBackBtn').onclick = openHomeScreen;
    document.getElementById('openAddBtn').onclick = () => openEditorModal(null);
    document.getElementById('openSyncBtn').onclick = openSyncModal;
    document.getElementById('manageSearchInput').oninput = e => {
      appState.manageSearch = e.target.value;
      renderManageList();
    };

    document.getElementById('closeEditorBtn').onclick = closeEditorModal;
    document.getElementById('editorModal').onclick = e => {
      if (e.target.id === 'editorModal') closeEditorModal();
    };
    document.getElementById('parseMapsBtn').onclick = handleParseMapsPaste;
    const openSyncFromEditorBtn = document.getElementById('openSyncFromEditorBtn');
    if (openSyncFromEditorBtn) openSyncFromEditorBtn.onclick = openSyncModal;
    document.getElementById('editEnabledToggle').onclick = () => {
      appState.editingEnabled = !appState.editingEnabled;
      updateEditorEnabledSwitch();
    };
    document.getElementById('applyAllWeekBtn').onclick = () => {
      const val = document.getElementById('quickHoursInput').value.trim();
      if (!val) return showToast('請先輸入要套用的營業時間');
      document.querySelectorAll('#editHoursGrid .hour-input').forEach(inp => {
        inp.value = val;
        const btn = document.querySelector(`#editHoursGrid .hour-rest-btn[data-day="${inp.dataset.day}"]`);
        if (btn) btn.classList.toggle('is-rest', val === '休');
      });
      showToast('已套用至週一～週日');
    };
    document.getElementById('applyWeekdaysBtn').onclick = () => {
      const val = document.getElementById('quickHoursInput').value.trim();
      if (!val) return showToast('請先輸入要套用的營業時間');
      ['mon', 'tue', 'wed', 'thu', 'fri'].forEach(day => {
        const inp = document.querySelector(`#editHoursGrid .hour-input[data-day="${day}"]`);
        const btn = document.querySelector(`#editHoursGrid .hour-rest-btn[data-day="${day}"]`);
        if (inp) inp.value = val;
        if (btn) btn.classList.toggle('is-rest', val === '休');
      });
      showToast('已套用至週一～週五');
    };
    document.getElementById('savePlaceBtn').onclick = saveEditorPlace;
    document.getElementById('deletePlaceBtn').onclick = handleDeletePlace;

    // 雲端同步與 CSV 匯出抽屜事件
    document.getElementById('closeSyncBtn').onclick = closeSyncModal;
    document.getElementById('syncModal').onclick = e => {
      if (e.target.id === 'syncModal') closeSyncModal();
    };
    document.getElementById('downloadCsvBtn').onclick = () => {
      const blob = new Blob([buildFullCsvText()], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'places_sheet.csv';
      a.click();
      URL.revokeObjectURL(url);
      showToast('已下載 places_sheet.csv');
    };
    document.getElementById('copyCsvBtn').onclick = async () => {
      try {
        await navigator.clipboard.writeText(buildFullCsvText());
        showToast('已複製完整 CSV 至剪貼簿');
      } catch (_) {
        showToast('複製失敗，請改用下載 CSV 檔');
      }
    };
    document.getElementById('saveGasBtn').onclick = async () => {
      const url = document.getElementById('gasUrlInput').value.trim();
      const token = document.getElementById('gasTokenInput').value.trim();
      const statusEl = document.getElementById('gasStatusText');
      appState.gasConfig = { url, token };
      saveJson(GAS_CONFIG_KEY, appState.gasConfig);
      if (!url || !token) {
        statusEl.textContent = '已清除雲端設定，目前僅本機儲存';
        statusEl.classList.remove('is-err');
        return;
      }
      statusEl.textContent = '正在測試連線…';
      statusEl.classList.remove('is-err');
      try {
        const res = await postGasAction({ action: 'ping' });
        const placesHint = res.placesApiConfigured
          ? 'Places 自動抓營業時間已啟用'
          : '尚未填 Places API Key（僅展開短網址）';
        statusEl.textContent = `✔ 連線成功！試算表 ${res.rows} 筆 · ${placesHint}`;
        showToast('Google Sheets 雙向同步已啟用');
      } catch (err) {
        statusEl.textContent = `連線失敗：${err.message || '請檢查網址與密鑰'}`;
        statusEl.classList.add('is-err');
      }
    };
    document.getElementById('pushGasBtn').onclick = async () => {
      const statusEl = document.getElementById('gasStatusText');
      if (!appState.gasConfig.url || !appState.gasConfig.token) {
        statusEl.textContent = '請先填寫並儲存 Apps Script 網址與密鑰';
        statusEl.classList.add('is-err');
        return;
      }
      statusEl.textContent = '正在推送整份名單至 Google Sheets…';
      statusEl.classList.remove('is-err');
      try {
        const res = await postGasAction({ action: 'sync_all', places: appState.places });
        statusEl.textContent = `✔ 已將 ${res.synced} 間店家完整寫入 Google Sheets`;
        showToast('已同步整份名單上雲端');
      } catch (err) {
        statusEl.textContent = `推送失敗：${err.message}`;
        statusEl.classList.add('is-err');
      }
    };
    document.getElementById('pullSheetBtn').onclick = async () => {
      const ok = await backgroundSync(true);
      showToast(ok ? '已從 Google Sheets 重新拉取最新名單' : '拉取失敗，請確認網路連線');
      if (ok) closeSyncModal();
    };
    document.getElementById('resetDefaultBtn').onclick = () => {
      const btn = document.getElementById('resetDefaultBtn');
      if (!appState.resetArmed) {
        appState.resetArmed = true;
        btn.classList.add('is-confirm');
        btn.textContent = '再點確認重設';
        setTimeout(() => {
          if (appState.resetArmed) {
            appState.resetArmed = false;
            btn.classList.remove('is-confirm');
            btn.textContent = '重設回預設 49 間';
          }
        }, 3500);
        return;
      }
      appState.places = DEFAULT_PLACES.map(p => ({ ...p, hours: { ...(p.hours || {}) } }));
      appState.hasLocalEdits = false;
      try { localStorage.removeItem(CUSTOM_PLACES_KEY); } catch (_) {}
      appState.resetArmed = false;
      closeSyncModal();
      renderManageList();
      renderHomeDashboard();
      showToast('已重設回內建 49 間預設名單');
    };

    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    bindCanvasGestures();
    preloadCoreTiles(appState.prefs.layer);
    applyChrome();
    renderHomeDashboard();

    if (appState.screen === 'map') {
      renderMapOverviewReady();
    } else if (appState.screen === 'manage') {
      renderManageList();
    }

    startRenderLoop();
    requestGps();
    backgroundSync(false);
  }

  const exported = {
    DEFAULT_SHEET_ID,
    DEFAULT_SHEET_URL,
    DEFAULT_SHEET_CSV_URL,
    DEFAULT_PLACES,
    CATEGORIES,
    parseCSV,
    csvToPlaces,
    haversineMeters,
    formatDistance,
    getOpenStatus,
    computeWeightDetail,
    pickWeightedCandidate,
    parseGoogleMapsInput,
    placeToCsvRow
  };

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = exported;
  }
  if (globalScope) {
    globalScope.MealPickerApp = exported;
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBrowserApp);
    } else {
      initBrowserApp();
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
