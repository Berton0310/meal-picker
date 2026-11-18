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

  // ==================== 瀏覽器極簡四風格動畫主程式 ====================
  function initBrowserApp() {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

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

    const savedPrefs = Object.assign(
      { style: 'slot', category: '全部', onlyOpen: true },
      loadJson(STORAGE_KEYS.prefs, {})
    );

    const urlStyle = new URLSearchParams(window.location.search).get('style');
    if (['slot', 'deck', 'omikuji', 'wheel'].includes(urlStyle)) {
      savedPrefs.style = urlStyle;
    }

    const cachedWrap = loadJson(STORAGE_KEYS.placesCache, null);
    const appState = {
      prefs: savedPrefs,
      places: (cachedWrap && Array.isArray(cachedWrap.places) && cachedWrap.places.length > 0)
        ? cachedWrap.places
        : DEFAULT_PLACES,
      history: loadJson(STORAGE_KEYS.history, {}),
      userLoc: { lat: DEFAULT_CENTER.lat, lng: DEFAULT_CENTER.lng, hasGps: false },
      passedIds: new Set(),
      currentPick: null,
      isAnimating: false,
      animTimers: [],
      wheelRotation: 0,
      wheelSlices: [],
      wheelRaf: null
    };

    function persistPrefs() {
      saveJson(STORAGE_KEYS.prefs, appState.prefs);
    }

    function clearTimers() {
      while (appState.animTimers.length > 0) {
        clearTimeout(appState.animTimers.pop());
      }
      if (appState.wheelRaf) {
        cancelAnimationFrame(appState.wheelRaf);
        appState.wheelRaf = null;
      }
      appState.isAnimating = false;
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

    function getCandidates() {
      const now = new Date();
      const nowMs = now.getTime();
      return appState.places
        .map(p => {
          const hasCoords = Number.isFinite(p.lat) && Number.isFinite(p.lng);
          const dist = hasCoords
            ? haversineMeters(appState.userLoc.lat, appState.userLoc.lng, p.lat, p.lng)
            : Infinity;
          const openStatus = getOpenStatus(p, now, CLOSING_SOON_MINS);
          const weightInfo = computeWeightDetail(p, appState.history, appState.passedIds, nowMs, true);
          return { ...p, dist, openStatus, weightInfo };
        })
        .filter(p => {
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

    // ==================== 頂部與底部基礎渲染 ====================
    function applyTheme() {
      document.body.setAttribute('data-theme', appState.prefs.style);
      document.querySelectorAll('.style-tab').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.style === appState.prefs.style);
      });

      const redrawBtn = document.getElementById('redrawBtn');
      if (redrawBtn) {
        const labels = {
          slot: '拉動手把再抽',
          deck: '洗牌換下一張',
          omikuji: '再搖一籤',
          wheel: '轉動輪盤'
        };
        redrawBtn.textContent = labels[appState.prefs.style] || '再抽一次';
      }
    }

    function renderFilters() {
      const catRow = document.getElementById('categoryRow');
      if (catRow) {
        catRow.innerHTML = '';
        CATEGORIES.forEach(cat => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `cat-pill ${cat === appState.prefs.category ? 'is-active' : ''}`;
          btn.textContent = cat;
          btn.onclick = () => {
            if (appState.isAnimating) return;
            appState.prefs.category = cat;
            persistPrefs();
            renderFilters();
            triggerDraw(false);
          };
          catRow.appendChild(btn);
        });
      }

      const openBtn = document.getElementById('openToggleBtn');
      if (openBtn) {
        openBtn.textContent = appState.prefs.onlyOpen ? '營業中' : '不限時段';
        openBtn.classList.toggle('is-active', appState.prefs.onlyOpen);
      }
    }

    function updateFooterAvailability(hasPick) {
      const goBtn = document.getElementById('goEatBtn');
      const redrawBtn = document.getElementById('redrawBtn');
      if (goBtn) goBtn.disabled = !hasPick;
      if (redrawBtn) redrawBtn.disabled = !hasPick;
    }

    function renderEmptyStage() {
      const stage = document.getElementById('stageArea');
      updateFooterAvailability(false);
      stage.innerHTML = `
        <div class="empty-panel">
          <div class="empty-title">目前這個分類沒有在營業的店家</div>
          <p class="empty-sub">可能是午休或深夜時段，切換為「不限時段」就能從全部口袋名單抽籤。</p>
          <button type="button" id="emptyShowAllBtn" class="empty-action-btn">改為不限時段</button>
        </div>
      `;
      document.getElementById('emptyShowAllBtn').onclick = () => {
        appState.prefs.onlyOpen = false;
        persistPrefs();
        renderFilters();
        triggerDraw(false);
      };
    }

    // ==================== 方案 A：Braun 機械滾輪拉霸機 ====================
    function renderSlotStage(pick, animate) {
      const stage = document.getElementById('stageArea');
      const candidates = getCandidates();
      const prevName = stage.dataset.lastSlotName || pick.name;

      // 建構 18 格滾筒軌道，最後一格必為目標店名
      const items = [prevName];
      const poolNames = candidates.map(c => c.name);
      for (let i = 0; i < 16; i += 1) {
        const randName = poolNames[Math.floor(Math.random() * poolNames.length)] || pick.name;
        items.push(randName);
      }
      items.push(pick.name);
      stage.dataset.lastSlotName = pick.name;

      const subText = `${pick.category} · ${pick.note || '精選推薦'}`;
      const metaText = formatMinimalMeta(pick);

      stage.innerHTML = `
        <div class="slot-machine">
          <div class="slot-bezel">
            <div class="slot-window-header">
              <span class="slot-serial">TAICHUNG NORTH</span>
              <span class="slot-serial">MEAL REEL · ${String(pick.id || '01').toUpperCase()}</span>
            </div>
            <div class="slot-reel-viewport">
              <div class="slot-pointer slot-pointer-left"></div>
              <div class="slot-pointer slot-pointer-right"></div>
              <div class="slot-reel-track ${animate ? 'is-blur' : ''}" id="slotReelTrack">
                ${items.map(name => `<div class="slot-reel-item">${escapeHtml(name)}</div>`).join('')}
              </div>
              <div class="slot-glass-mask"></div>
            </div>
            <div class="slot-flap-panel" id="slotFlapPanel">
              <div class="slot-flap-sub">${escapeHtml(animate ? '轉輪定格中…' : subText)}</div>
              <div class="slot-flap-meta">${escapeHtml(animate ? '請稍候' : metaText)}</div>
            </div>
          </div>
        </div>
      `;

      const track = document.getElementById('slotReelTrack');
      const flap = document.getElementById('slotFlapPanel');

      if (!animate) {
        track.style.transform = `translate3d(0, -${17 * 68}px, 0)`;
        return;
      }

      appState.isAnimating = true;
      track.style.transform = 'translate3d(0, 0, 0)';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          track.style.transition = 'transform 0.96s cubic-bezier(0.14, 0.88, 0.22, 1.06)';
          track.style.transform = `translate3d(0, -${17 * 68}px, 0)`;
        });
      });

      const finishTimer = setTimeout(() => {
        track.classList.remove('is-blur');
        flap.classList.add('is-flipping');
        flap.innerHTML = `
          <div class="slot-flap-sub">${escapeHtml(subText)}</div>
          <div class="slot-flap-meta">${escapeHtml(metaText)}</div>
        `;
        appState.isAnimating = false;
      }, 980);
      appState.animTimers.push(finishTimer);
    }

    // ==================== 方案 B：3D 實體牌疊洗牌 ＆ 滑卡 ====================
    function renderDeckStage(pick, animate) {
      const stage = document.getElementById('stageArea');
      const candidates = getCandidates();
      const decoys = candidates.filter(c => placeKey(c) !== placeKey(pick));
      const next1 = decoys[0] || pick;
      const next2 = decoys[1] || pick;

      const cardNo = String(pick.id || '01').replace(/\D/g, '').padStart(2, '0') || '01';
      const subText = `${pick.category} · ${pick.note || '精選推薦'}`;
      const metaText = formatMinimalMeta(pick);

      stage.innerHTML = `
        <div class="deck-scene" id="deckScene">
          <div class="deck-card deck-back-2 ${animate ? 'is-shuffling-right' : ''}">
            <div class="deck-card-inner">
              <div class="deck-top-line"><span>NO. ${cardNo}</span><span>NORTH DIST.</span></div>
              <div class="deck-name">${escapeHtml(next2.name)}</div>
            </div>
          </div>
          <div class="deck-card deck-back-1 ${animate ? 'is-shuffling-left' : ''}">
            <div class="deck-card-inner">
              <div class="deck-top-line"><span>NEXT</span><span>TAICHUNG</span></div>
              <div class="deck-name">${escapeHtml(next1.name)}</div>
            </div>
          </div>
          <div class="deck-card deck-front ${animate ? 'is-flipping-in' : ''}" id="deckFrontCard">
            <div class="deck-card-inner">
              <div class="deck-top-line">
                <span>NO. ${cardNo}</span>
                <span>${escapeHtml(pick.category)}</span>
              </div>
              <div class="deck-body">
                <h2 class="deck-name">${escapeHtml(pick.name)}</h2>
                <p class="deck-note">${escapeHtml(subText)}</p>
              </div>
              <div class="deck-bottom-line">
                <span>${escapeHtml(metaText)}</span>
                <span class="deck-hint">可左滑丟飛換張</span>
              </div>
            </div>
          </div>
        </div>
      `;

      if (animate) {
        appState.isAnimating = true;
        const t = setTimeout(() => {
          const back1 = stage.querySelector('.deck-back-1');
          const back2 = stage.querySelector('.deck-back-2');
          const front = document.getElementById('deckFrontCard');
          if (back1) back1.classList.remove('is-shuffling-left');
          if (back2) back2.classList.remove('is-shuffling-right');
          if (front) front.classList.remove('is-flipping-in');
          appState.isAnimating = false;
        }, 620);
        appState.animTimers.push(t);
      }

      bindDeckSwipeGesture();
    }

    function bindDeckSwipeGesture() {
      const card = document.getElementById('deckFrontCard');
      if (!card) return;

      let startX = 0;
      let startY = 0;
      let currentDx = 0;
      let dragging = false;

      card.addEventListener('pointerdown', e => {
        if (appState.isAnimating) return;
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        currentDx = 0;
        card.style.transition = 'none';
        card.setPointerCapture(e.pointerId);
      });

      card.addEventListener('pointermove', e => {
        if (!dragging) return;
        currentDx = e.clientX - startX;
        const dy = (e.clientY - startY) * 0.25;
        const rot = currentDx * 0.06;
        card.style.transform = `translate3d(${currentDx}px, ${dy}px, 0) rotate(${rot}deg)`;
      });

      const endDrag = () => {
        if (!dragging) return;
        dragging = false;
        if (Math.abs(currentDx) > 72) {
          const dir = currentDx > 0 ? 1 : -1;
          appState.isAnimating = true;
          card.style.transition = 'transform 0.28s ease-out, opacity 0.28s ease-out';
          card.style.transform = `translate3d(${dir * 420}px, 24px, 0) rotate(${dir * 26}deg)`;
          card.style.opacity = '0';
          const t = setTimeout(() => {
            if (appState.currentPick) appState.passedIds.add(placeKey(appState.currentPick));
            const next = drawNextCandidate(true);
            if (!next) return renderEmptyStage();
            renderDeckStage(next, false);
            appState.isAnimating = false;
          }, 260);
          appState.animTimers.push(t);
        } else {
          card.style.transition = 'transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1)';
          card.style.transform = 'translate3d(0, 0, 0) rotate(0deg)';
        }
      };

      card.addEventListener('pointerup', endDrag);
      card.addEventListener('pointercancel', endDrag);
    }

    // ==================== 方案 C：日式搖籤筒／今日食籤 ====================
    function renderOmikujiStage(pick, animate) {
      const stage = document.getElementById('stageArea');
      const slipNo = String(pick.id || '01').replace(/\D/g, '') || '1';
      const subText = `${pick.category} · ${pick.note || '隨緣一味'}`;
      const metaText = formatMinimalMeta(pick);

      const slipHtml = `
        <div class="omikuji-slip ${animate ? 'is-unfolding' : ''}" id="omikujiSlip">
          <div class="omikuji-inner-frame">
            <div class="omikuji-head">
              <span class="omikuji-label">今日食籤 · 第 ${escapeHtml(slipNo)} 番</span>
              <span class="omikuji-stamp">吉</span>
            </div>
            <div class="omikuji-center">
              <h2 class="omikuji-name">${escapeHtml(pick.name)}</h2>
              <p class="omikuji-note">${escapeHtml(subText)}</p>
            </div>
            <div class="omikuji-foot">
              <span class="omikuji-divider"></span>
              <div class="omikuji-meta">${escapeHtml(metaText)}</div>
            </div>
          </div>
        </div>
      `;

      if (!animate) {
        stage.innerHTML = `<div class="omikuji-scene">${slipHtml}</div>`;
        return;
      }

      appState.isAnimating = true;
      stage.innerHTML = `
        <div class="omikuji-scene">
          <div class="omikuji-shaker-wrap">
            <div class="omikuji-stick" id="omikujiStick">
              <span class="stick-tip"></span>
              <span class="stick-num">第${escapeHtml(slipNo)}番</span>
            </div>
            <svg class="omikuji-box-svg is-shaking" id="omikujiBoxSvg" viewBox="0 0 120 170" width="120" height="170">
              <defs>
                <linearGradient id="woodBody" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="#8B5A2B" />
                  <stop offset="45%" stop-color="#B07843" />
                  <stop offset="100%" stop-color="#6F451E" />
                </linearGradient>
              </defs>
              <ellipse cx="60" cy="30" rx="34" ry="10" fill="#3D2410" />
              <path d="M26 30 L94 30 L88 148 C88 156, 32 156, 32 148 Z" fill="url(#woodBody)" stroke="#4A2D13" stroke-width="2" />
              <ellipse cx="60" cy="30" rx="34" ry="10" fill="none" stroke="#D1A06A" stroke-width="2.5" />
              <ellipse cx="60" cy="30" rx="11" ry="4" fill="#1C1007" />
              <rect x="44" y="54" width="32" height="68" rx="3" fill="#F3EFE6" stroke="#4A2D13" stroke-width="1.5" />
              <text x="60" y="84" text-anchor="middle" font-size="16" font-weight="700" fill="#1D1B18" font-family="serif">食</text>
              <text x="60" y="106" text-anchor="middle" font-size="16" font-weight="700" fill="#1D1B18" font-family="serif">籤</text>
            </svg>
          </div>
        </div>
      `;

      const t1 = setTimeout(() => {
        const box = document.getElementById('omikujiBoxSvg');
        const stick = document.getElementById('omikujiStick');
        if (box) box.classList.remove('is-shaking');
        if (stick) stick.classList.add('is-rising');
      }, 540);

      const t2 = setTimeout(() => {
        stage.innerHTML = `<div class="omikuji-scene">${slipHtml}</div>`;
        appState.isAnimating = false;
      }, 1050);

      appState.animTimers.push(t1, t2);
    }

    // ==================== 方案 D：慣性物理美食轉盤 ====================
    function buildWheelSvg(slices) {
      const count = slices.length;
      const cx = 160;
      const cy = 160;
      const r = 148;
      const palette = ['#1F2A33', '#2B3A45', '#D6CFC2', '#3B564D', '#D95D34'];
      const textColors = ['#F2F4F5', '#F2F4F5', '#1A1C1E', '#F2F4F5', '#FFF8F3'];
      const sliceDeg = 360 / count;

      let paths = '';
      for (let i = 0; i < count; i += 1) {
        const startDeg = i * sliceDeg - 90;
        const endDeg = (i + 1) * sliceDeg - 90;
        const rad1 = (startDeg * Math.PI) / 180;
        const rad2 = (endDeg * Math.PI) / 180;
        const x1 = cx + r * Math.cos(rad1);
        const y1 = cy + r * Math.sin(rad1);
        const x2 = cx + r * Math.cos(rad2);
        const y2 = cy + r * Math.sin(rad2);
        const largeArc = sliceDeg > 180 ? 1 : 0;

        const colorIdx = i % palette.length;
        const fill = palette[colorIdx];
        const tCol = textColors[colorIdx];
        const midDeg = startDeg + sliceDeg / 2;
        const rawName = slices[i].name;
        const shortName = rawName.length > 7 ? `${rawName.slice(0, 6)}…` : rawName;

        paths += `
          <path d="M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z"
            fill="${fill}" stroke="#11161A" stroke-width="2" />
          <g transform="rotate(${midDeg.toFixed(2)} ${cx} ${cy})">
            <text x="${cx + r * 0.61}" y="${cy + 4}" text-anchor="middle" fill="${tCol}"
              font-size="${count >= 10 ? 10.5 : 11.5}" font-weight="600" letter-spacing="0.02em">
              ${escapeHtml(shortName)}
            </text>
          </g>
        `;
      }

      return `
        <svg viewBox="0 0 320 320" class="wheel-svg" id="wheelSvg">
          <circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="none" stroke="rgba(255,255,255,0.16)" stroke-width="2" />
          ${paths}
          <circle cx="${cx}" cy="${cy}" r="26" fill="#11161A" stroke="rgba(255,255,255,0.22)" stroke-width="2" />
        </svg>
      `;
    }

    function renderWheelStage(pick, animate) {
      const stage = document.getElementById('stageArea');
      const candidates = getCandidates();

      // 挑選最多 10 間（必含本次命中店）組成轉盤扇形
      const others = candidates.filter(c => placeKey(c) !== placeKey(pick));
      const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 9);
      const slices = [pick, ...shuffled].sort(() => Math.random() - 0.5);
      const targetIdx = slices.findIndex(s => placeKey(s) === placeKey(pick));
      const sliceDeg = 360 / slices.length;

      // 讓目標扇形中心點對齊 12 點鐘方向（0 度）
      const targetCenterDeg = targetIdx * sliceDeg + sliceDeg / 2;
      const desiredMod = (360 - (targetCenterDeg % 360)) % 360;

      const subText = `${pick.category} · ${pick.note || '精選推薦'}`;
      const metaText = formatMinimalMeta(pick);

      stage.innerHTML = `
        <div class="wheel-scene">
          <div class="wheel-dial-wrap">
            <div class="wheel-pointer" id="wheelPointer"></div>
            <div class="wheel-rotator" id="wheelRotator">
              ${buildWheelSvg(slices)}
            </div>
            <button type="button" class="wheel-hub" id="wheelHubBtn" aria-label="轉動輪盤">SPIN</button>
          </div>
          <div class="wheel-result-card" id="wheelResultCard">
            <h2 class="wheel-result-name">${escapeHtml(animate ? '輪盤轉動中…' : pick.name)}</h2>
            <p class="wheel-result-sub">${escapeHtml(animate ? '即將揭曉' : `${subText} · ${metaText}`)}</p>
          </div>
        </div>
      `;

      document.getElementById('wheelHubBtn').onclick = () => {
        if (!appState.isAnimating) triggerDraw(true);
      };

      const rotator = document.getElementById('wheelRotator');
      const pointer = document.getElementById('wheelPointer');
      const resultCard = document.getElementById('wheelResultCard');

      if (!animate) {
        appState.wheelRotation = desiredMod;
        rotator.style.transform = `rotate(${appState.wheelRotation}deg)`;
        return;
      }

      appState.isAnimating = true;
      const currentMod = ((appState.wheelRotation % 360) + 360) % 360;
      const delta = (desiredMod - currentMod + 360) % 360;
      const startDeg = appState.wheelRotation;
      const endDeg = startDeg + 360 * 5 + delta;
      appState.wheelRotation = endDeg;

      rotator.style.transform = `rotate(${startDeg}deg)`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          rotator.style.transition = 'transform 1.65s cubic-bezier(0.1, 0.82, 0.16, 1)';
          rotator.style.transform = `rotate(${endDeg}deg)`;
        });
      });

      // 模擬指針經過扇形格線時的微幅物理彈跳
      let lastSector = -1;
      const startTime = performance.now();
      const duration = 1650;
      const tickPointer = nowTs => {
        const t = Math.min(1, (nowTs - startTime) / duration);
        // cubic-bezier(0.1, 0.82, 0.16, 1) approximate easeOutQuart progress
        const eased = 1 - (1 - t) ** 3.6;
        const curDeg = startDeg + (endDeg - startDeg) * eased;
        const curSector = Math.floor(curDeg / sliceDeg);
        if (curSector !== lastSector) {
          lastSector = curSector;
          if (pointer) {
            pointer.classList.remove('is-ticking');
            void pointer.offsetWidth;
            pointer.classList.add('is-ticking');
          }
        }
        if (t < 1 && appState.isAnimating) {
          appState.wheelRaf = requestAnimationFrame(tickPointer);
        }
      };
      appState.wheelRaf = requestAnimationFrame(tickPointer);

      const doneTimer = setTimeout(() => {
        appState.isAnimating = false;
        if (resultCard) {
          resultCard.classList.add('is-revealed');
          resultCard.innerHTML = `
            <h2 class="wheel-result-name">${escapeHtml(pick.name)}</h2>
            <p class="wheel-result-sub">${escapeHtml(subText)} · ${escapeHtml(metaText)}</p>
          `;
        }
      }, duration + 40);
      appState.animTimers.push(doneTimer);
    }

    // ==================== 統一抽籤調度 ====================
    function renderCurrentStyle(pick, animate) {
      if (!pick) {
        renderEmptyStage();
        return;
      }
      updateFooterAvailability(true);
      const style = appState.prefs.style;
      if (style === 'slot') renderSlotStage(pick, animate);
      else if (style === 'deck') renderDeckStage(pick, animate);
      else if (style === 'omikuji') renderOmikujiStage(pick, animate);
      else renderWheelStage(pick, animate);
    }

    function triggerDraw(excludeCurrent = true) {
      if (appState.isAnimating) return;
      if (excludeCurrent && appState.currentPick) {
        appState.passedIds.add(placeKey(appState.currentPick));
      }
      const pick = drawNextCandidate(excludeCurrent);
      renderCurrentStyle(pick, Boolean(pick && excludeCurrent));
    }

    function switchStyle(nextStyle) {
      clearTimers();
      appState.prefs.style = nextStyle;
      persistPrefs();
      applyTheme();
      if (!appState.currentPick) {
        drawNextCandidate(false);
      }
      renderCurrentStyle(appState.currentPick, false);
    }

    // ==================== 背景同步與 GPS ====================
    async function backgroundSync() {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      try {
        const res = await fetch(`${DEFAULT_SHEET_CSV_URL}&_t=${Date.now()}`, { signal: controller.signal, cache: 'no-store' });
        if (!res.ok) return;
        const text = await res.text();
        const parsed = csvToPlaces(text);
        if (parsed.length > 0) {
          appState.places = parsed;
          saveJson(STORAGE_KEYS.placesCache, { places: parsed, syncedAt: new Date().toISOString() });
        }
      } catch (_) {
        // silent offline fallback
      } finally {
        clearTimeout(timer);
      }
    }

    function requestGps() {
      if (!navigator.geolocation) return;
      navigator.geolocation.getCurrentPosition(
        pos => {
          appState.userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude, hasGps: true };
          if (!appState.isAnimating && appState.currentPick) {
            const refreshed = getCandidates().find(c => placeKey(c) === placeKey(appState.currentPick));
            if (refreshed) {
              appState.currentPick = refreshed;
              renderCurrentStyle(refreshed, false);
            }
          }
        },
        () => {},
        { enableHighAccuracy: false, timeout: 4500, maximumAge: 180000 }
      );
    }

    // ==================== 事件綁定 ====================
    document.querySelectorAll('.style-tab').forEach(btn => {
      btn.onclick = () => switchStyle(btn.dataset.style);
    });

    document.getElementById('openToggleBtn').onclick = () => {
      if (appState.isAnimating) return;
      appState.prefs.onlyOpen = !appState.prefs.onlyOpen;
      persistPrefs();
      renderFilters();
      triggerDraw(false);
    };

    document.getElementById('redrawBtn').onclick = () => triggerDraw(true);
    document.getElementById('goEatBtn').onclick = goEatCurrent;

    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    applyTheme();
    renderFilters();
    const initialPick = drawNextCandidate(false);
    renderCurrentStyle(initialPick, false);
    requestGps();
    backgroundSync();
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
