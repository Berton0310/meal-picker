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
    const MAX_ZOOM = 18.0;
    const LOCK_ZOOM = 16.75;

    const CAMERA_MODES = {
      hop: { btnLabel: '跳躍抽下一間', flyLabel: '正從高空跳躍挑選候選餐廳…' },
      fly: { btnLabel: '飛往下一間', flyLabel: '正跨越台中北區飛往目標座標…' },
      radar: { btnLabel: '掃描抽下一間', flyLabel: '正執行全區座標雷達掃描…' }
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

    const savedPrefs = Object.assign(
      { mode: 'hop', layer: 'sat', category: '全部', onlyOpen: true },
      loadJson(STORAGE_KEYS.prefs, {})
    );

    const searchParams = new URLSearchParams(window.location.search);
    const urlMode = searchParams.get('mode');
    const urlLayer = searchParams.get('layer');
    if (CAMERA_MODES[urlMode]) savedPrefs.mode = urlMode;
    if (MAP_LAYERS[urlLayer]) savedPrefs.layer = urlLayer;
    if (!CAMERA_MODES[savedPrefs.mode]) savedPrefs.mode = 'hop';
    if (!MAP_LAYERS[savedPrefs.layer]) savedPrefs.layer = 'sat';
    if (!CATEGORIES.includes(savedPrefs.category)) savedPrefs.category = '全部';

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
      focusPlace: null,
      isAnimating: false,
      animRaf: null,
      animTimers: [],
      flightArc: null,
      hopTrail: [],
      scanLinks: [],
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
        y: viewport.height * 0.455
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

      if (appState.scanLinks.length > 1) {
        ctx.save();
        ctx.beginPath();
        appState.scanLinks.forEach((pt, idx) => {
          const sp = projectToScreen(pt.lat, pt.lng);
          if (idx === 0) ctx.moveTo(sp.x, sp.y);
          else ctx.lineTo(sp.x, sp.y);
        });
        ctx.strokeStyle = 'rgba(234, 88, 40, 0.42)';
        ctx.lineWidth = 1.5;
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
      const placedBoxes = [];

      if (activeTarget && Number.isFinite(activeTarget.lat) && Number.isFinite(activeTarget.lng)) {
        const ap = projectToScreen(activeTarget.lat, activeTarget.lng);
        placedBoxes.push(
          { left: ap.x - 28, right: ap.x + 28, top: ap.y - 26, bottom: ap.y + 26 },
          { left: ap.x - 84, right: ap.x + 84, top: Math.max(128, ap.y - 52), bottom: Math.max(154, ap.y - 16) }
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

        if (showNearbyLabels && pt.y > 135 && pt.y < viewport.height - 210) {
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

      // 4. 繪製當前鎖定／掃描中的目標準星與浮動店名標籤
      if (activeTarget && Number.isFinite(activeTarget.lat) && Number.isFinite(activeTarget.lng)) {
        const tp = projectToScreen(activeTarget.lat, activeTarget.lng);
        const pulsePhase = (nowTs % 1600) / 1600;
        const pulseR = 13 + pulsePhase * 26;
        const pulseAlpha = (1 - pulsePhase) * 0.55;

        ctx.save();
        // 外擴脈衝波
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, pulseR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(234, 88, 40, ${pulseAlpha.toFixed(3)})`;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 光暈背景
        ctx.beginPath();
        ctx.arc(tp.x, tp.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(234, 88, 40, 0.24)';
        ctx.fill();

        // 四角戰術瞄準準星
        const bracket = appState.isAnimating ? 18 : 16;
        const arm = 6;
        ctx.strokeStyle = '#FF9068';
        ctx.lineWidth = 2;
        ctx.beginPath();
        // Top-left
        ctx.moveTo(tp.x - bracket, tp.y - bracket + arm);
        ctx.lineTo(tp.x - bracket, tp.y - bracket);
        ctx.lineTo(tp.x - bracket + arm, tp.y - bracket);
        // Top-right
        ctx.moveTo(tp.x + bracket - arm, tp.y - bracket);
        ctx.lineTo(tp.x + bracket, tp.y - bracket);
        ctx.lineTo(tp.x + bracket, tp.y - bracket + arm);
        // Bottom-right
        ctx.moveTo(tp.x + bracket, tp.y + bracket - arm);
        ctx.lineTo(tp.x + bracket, tp.y + bracket);
        ctx.lineTo(tp.x + bracket - arm, tp.y + bracket);
        // Bottom-left
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
          Math.max(150, tp.y - 24),
          truncateLabel(activeTarget.name, 13),
          'rgba(14, 19, 24, 0.90)',
          'rgba(234, 88, 40, 0.78)',
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
        if (!document.hidden) {
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
      appState.scanLinks = [];
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

    // ==================== 頂部與底部 HUD 更新 ====================
    function applyChrome() {
      const layerDef = MAP_LAYERS[appState.prefs.layer] || MAP_LAYERS.sat;
      document.body.setAttribute('data-layer', appState.prefs.layer);

      document.querySelectorAll('.mode-tab').forEach(btn => {
        btn.classList.toggle('is-active', btn.dataset.mode === appState.prefs.mode);
      });

      const layerBtn = document.getElementById('layerToggleBtn');
      if (layerBtn) layerBtn.textContent = layerDef.label;

      const attrib = document.getElementById('mapAttrib');
      if (attrib) attrib.textContent = layerDef.attrib;

      const redrawBtn = document.getElementById('redrawBtn');
      if (redrawBtn) {
        const modeDef = CAMERA_MODES[appState.prefs.mode] || CAMERA_MODES.hop;
        redrawBtn.textContent = modeDef.btnLabel;
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

    function showPlaceCard(pick, state) {
      const cardEl = document.getElementById('placeCard');
      const emptyEl = document.getElementById('emptyPanel');
      const titleEl = document.getElementById('cardTitle');
      const subEl = document.getElementById('cardSub');
      const metaEl = document.getElementById('cardMeta');
      const hudStatusEl = document.getElementById('hudStatusText');

      if (!pick) {
        cardEl.hidden = true;
        emptyEl.hidden = false;
        updateFooterAvailability(false);
        if (hudStatusEl) hudStatusEl.textContent = '目前無營業店家';
        return;
      }

      emptyEl.hidden = true;
      cardEl.hidden = false;
      updateFooterAvailability(true);

      if (state === 'flying') {
        const modeDef = CAMERA_MODES[appState.prefs.mode] || CAMERA_MODES.hop;
        cardEl.classList.remove('is-landed');
        cardEl.classList.add('is-flying');
        titleEl.textContent = '搜尋降落目標中…';
        subEl.textContent = modeDef.flyLabel;
        metaEl.textContent = `候選清單 ${getCandidates().length} 間`;
        return;
      }

      cardEl.classList.remove('is-flying');
      cardEl.classList.remove('is-landed');
      if (state === 'landed') {
        void cardEl.offsetWidth;
        cardEl.classList.add('is-landed');
      }

      titleEl.textContent = pick.name;
      subEl.textContent = `${pick.category} · ${pick.note || '精選推薦'}`;
      metaEl.textContent = formatMinimalMeta(pick);
      if (hudStatusEl) {
        hudStatusEl.textContent = `已鎖定 · ${truncateLabel(pick.name, 9)}`;
      }
    }

    // ==================== 三種地圖鏡頭動畫引擎 ====================
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
        return { lat: geoList[0].lat, lng: geoList[0].lng, zoom: 16.0 };
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
      const openH = Math.max(200, viewport.height - 365);

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

    function buildDistinctSequence(candidates, excludePlace, count) {
      const targetKey = excludePlace ? placeKey(excludePlace) : null;
      const pool = candidates.filter(c => Number.isFinite(c.lat) && Number.isFinite(c.lng) && placeKey(c) !== targetKey);
      if (pool.length === 0) return [];
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const seq = [];
      for (let i = 0; i < count; i += 1) {
        if (i < shuffled.length) {
          seq.push(shuffled[i]);
        } else {
          seq.push(shuffled[i % shuffled.length]);
        }
      }
      return seq;
    }

    function runMapDrawAnimation(pick, prevPick, animate) {
      clearAnimations();
      if (!pick) {
        appState.focusPlace = null;
        showPlaceCard(null, 'static');
        return;
      }

      const targetCoords = getPlaceCoords(pick);
      const candidates = getCandidates();

      if (!animate) {
        appState.focusPlace = pick;
        appState.camera = { lat: targetCoords.lat, lng: targetCoords.lng, zoom: LOCK_ZOOM };
        showPlaceCard(pick, 'static');
        return;
      }

      appState.isAnimating = true;
      showPlaceCard(pick, 'flying');
      const hudStatusEl = document.getElementById('hudStatusText');
      const mode = appState.prefs.mode;

      // -------------------- A: 跳躍俯衝 --------------------
      if (mode === 'hop') {
        const hops = buildDistinctSequence(candidates, pick, Math.min(4, Math.max(0, candidates.length - 1)));
        const waypoints = [...hops, pick];
        const hopZoom = 14.55;
        const startCam = { ...appState.camera };
        const firstCoords = getPlaceCoords(waypoints[0]);

        appState.hopTrail = [];

        // Phase 1: 拉高至高空俯視第一站
        animateCameraSegment(
          280,
          t => {
            const e = easeOutCubic(t);
            appState.camera.lat = lerp(startCam.lat, firstCoords.lat, e);
            appState.camera.lng = lerp(startCam.lng, firstCoords.lng, e);
            appState.camera.zoom = lerp(startCam.zoom, hopZoom, e);
          },
          () => {
            let hopIdx = 0;
            const runNextHop = () => {
              if (hopIdx >= hops.length) {
                // Phase 3: 俯衝放大鎖定目標
                const diveStart = { ...appState.camera };
                appState.focusPlace = pick;
                appState.hopTrail.push(targetCoords);
                if (hudStatusEl) hudStatusEl.textContent = `俯衝鎖定 · ${truncateLabel(pick.name, 8)}`;

                animateCameraSegment(
                  660,
                  t => {
                    const e = easeInOutCubic(t);
                    appState.camera.lat = lerp(diveStart.lat, targetCoords.lat, e);
                    appState.camera.lng = lerp(diveStart.lng, targetCoords.lng, e);
                    appState.camera.zoom = lerp(diveStart.zoom, LOCK_ZOOM, easeOutCubic(t));
                  },
                  () => {
                    appState.isAnimating = false;
                    appState.hopTrail = [];
                    showPlaceCard(pick, 'landed');
                  }
                );
                return;
              }

              const curPlace = hops[hopIdx];
              const curCoords = getPlaceCoords(curPlace);
              const segFrom = { ...appState.camera };
              appState.focusPlace = curPlace;
              appState.hopTrail.push(curCoords);
              if (hudStatusEl) hudStatusEl.textContent = `跳躍偵測 · ${truncateLabel(curPlace.name, 8)}`;

              animateCameraSegment(
                290,
                t => {
                  const e = easeOutCubic(t);
                  appState.camera.lat = lerp(segFrom.lat, curCoords.lat, e);
                  appState.camera.lng = lerp(segFrom.lng, curCoords.lng, e);
                  appState.camera.zoom = hopZoom + Math.sin(Math.PI * t) * 0.2;
                },
                () => {
                  hopIdx += 1;
                  runNextHop();
                }
              );
            };
            runNextHop();
          }
        );
        return;
      }

      // -------------------- B: 跨區飛行 --------------------
      if (mode === 'fly') {
        const startCoords = prevPick ? getPlaceCoords(prevPick) : { lat: appState.camera.lat, lng: appState.camera.lng };
        const startZoom = appState.camera.zoom;
        const meters = haversineMeters(startCoords.lat, startCoords.lng, targetCoords.lat, targetCoords.lng);
        const arcDip = meters < 140 ? 1.15 : Math.min(2.6, 1.55 + meters / 1600);

        appState.focusPlace = prevPick || null;
        appState.flightArc = { from: startCoords, to: targetCoords };
        let cardRevealed = false;

        animateCameraSegment(
          1680,
          t => {
            const posE = easeInOutCubic(t);
            appState.camera.lat = lerp(startCoords.lat, targetCoords.lat, posE);
            appState.camera.lng = lerp(startCoords.lng, targetCoords.lng, posE);

            const baseZ = lerp(startZoom, LOCK_ZOOM, posE);
            appState.camera.zoom = clampZoom(baseZ - arcDip * Math.sin(Math.PI * t));

            if (t > 0.35) {
              appState.focusPlace = pick;
            }
            if (hudStatusEl) {
              const pct = Math.round(t * 100);
              hudStatusEl.textContent = t < 0.85 ? `航線飛行中 ${pct}%` : `即將降落 · ${truncateLabel(pick.name, 8)}`;
            }
            if (t >= 0.9 && !cardRevealed) {
              cardRevealed = true;
              showPlaceCard(pick, 'landed');
            }
          },
          () => {
            appState.isAnimating = false;
            appState.flightArc = null;
            appState.focusPlace = pick;
            if (!cardRevealed) showPlaceCard(pick, 'landed');
          }
        );
        return;
      }

      // -------------------- C: 鳥瞰掃描 --------------------
      const overview = computeOverviewCamera(candidates);
      const startCam = { ...appState.camera };
      const scanTargets = buildDistinctSequence(candidates, pick, Math.min(8, Math.max(0, candidates.length - 1)));
      const scanSequence = [...scanTargets, pick];

      appState.scanLinks = [];
      if (hudStatusEl) hudStatusEl.textContent = `全區掃描啟動 · 候選 ${candidates.length} 間`;

      // Phase 1: 退到全區鳥瞰視角
      animateCameraSegment(
        340,
        t => {
          const e = easeOutCubic(t);
          appState.camera.lat = lerp(startCam.lat, overview.lat, e);
          appState.camera.lng = lerp(startCam.lng, overview.lng, e);
          appState.camera.zoom = lerp(startCam.zoom, overview.zoom, e);
        },
        () => {
          // Phase 2: 鳥瞰視角下，雷達光標由快而慢在候選點間跳躍掃描
          let lastIdx = -1;
          animateCameraSegment(
            1220,
            t => {
              // 減速節奏：先快掃再放慢定格
              const slowed = 1 - Math.pow(1 - t, 1.85);
              const idx = Math.min(scanSequence.length - 1, Math.floor(slowed * scanSequence.length));
              if (idx !== lastIdx) {
                lastIdx = idx;
                const spot = scanSequence[idx];
                appState.focusPlace = spot;
                if (Number.isFinite(spot.lat) && Number.isFinite(spot.lng)) {
                  appState.scanLinks.push({ lat: spot.lat, lng: spot.lng });
                  if (appState.scanLinks.length > 5) appState.scanLinks.shift();
                }
                if (hudStatusEl) {
                  hudStatusEl.textContent = idx === scanSequence.length - 1
                    ? `掃描鎖定 · ${truncateLabel(spot.name, 8)}`
                    : `雷達掃描 · ${truncateLabel(spot.name, 8)}`;
                }
              }
            },
            () => {
              // Phase 3: 從鳥瞰垂直俯衝放大鎖定中獎店家
              const zoomFrom = { ...appState.camera };
              appState.focusPlace = pick;
              animateCameraSegment(
                620,
                t => {
                  const e = easeInOutCubic(t);
                  appState.camera.lat = lerp(zoomFrom.lat, targetCoords.lat, e);
                  appState.camera.lng = lerp(zoomFrom.lng, targetCoords.lng, e);
                  appState.camera.zoom = lerp(zoomFrom.zoom, LOCK_ZOOM, easeOutCubic(t));
                },
                () => {
                  appState.isAnimating = false;
                  appState.scanLinks = [];
                  showPlaceCard(pick, 'landed');
                }
              );
            }
          );
        }
      );
    }

    function triggerDraw(excludeCurrent = true) {
      if (appState.isAnimating) return;
      const prevPick = appState.currentPick;
      if (excludeCurrent && prevPick) {
        appState.passedIds.add(placeKey(prevPick));
      }
      const pick = drawNextCandidate(excludeCurrent);
      runMapDrawAnimation(pick, prevPick, Boolean(pick && excludeCurrent));
    }

    function switchMode(nextMode) {
      if (!CAMERA_MODES[nextMode]) return;
      if (appState.isAnimating) clearAnimations();
      appState.prefs.mode = nextMode;
      persistPrefs();
      applyChrome();
      if (!appState.currentPick) {
        drawNextCandidate(false);
      }
      if (appState.currentPick) {
        const coords = getPlaceCoords(appState.currentPick);
        appState.focusPlace = appState.currentPick;
        appState.camera = { lat: coords.lat, lng: coords.lng, zoom: LOCK_ZOOM };
        showPlaceCard(appState.currentPick, 'static');
      } else {
        showPlaceCard(null, 'static');
      }
    }

    function cycleMapLayer() {
      const idx = LAYER_ORDER.indexOf(appState.prefs.layer);
      const nextLayer = LAYER_ORDER[(idx + 1) % LAYER_ORDER.length];
      appState.prefs.layer = nextLayer;
      persistPrefs();
      preloadCoreTiles(nextLayer);
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
          // 命中檢索：若點到某個候選餐廳圓點，鏡頭飛往該店並顯示資訊卡
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
            showPlaceCard(bestPlace, 'landed');
            flyCameraTo({
              lat: bestPlace.lat,
              lng: bestPlace.lng,
              zoom: Math.max(appState.camera.zoom, 16.45)
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
    document.querySelectorAll('.mode-tab').forEach(btn => {
      btn.onclick = () => switchMode(btn.dataset.mode);
    });

    document.getElementById('layerToggleBtn').onclick = cycleMapLayer;

    document.getElementById('openToggleBtn').onclick = () => {
      if (appState.isAnimating) return;
      appState.prefs.onlyOpen = !appState.prefs.onlyOpen;
      persistPrefs();
      renderFilters();
      triggerDraw(false);
    };

    document.getElementById('emptyShowAllBtn').onclick = () => {
      if (appState.isAnimating) return;
      appState.prefs.onlyOpen = false;
      persistPrefs();
      renderFilters();
      triggerDraw(false);
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

    document.getElementById('redrawBtn').onclick = () => triggerDraw(true);
    document.getElementById('goEatBtn').onclick = goEatCurrent;

    if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    bindCanvasGestures();
    preloadCoreTiles(appState.prefs.layer);
    applyChrome();
    renderFilters();

    const initialPick = drawNextCandidate(false);
    runMapDrawAnimation(initialPick, null, false);
    startRenderLoop();
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
