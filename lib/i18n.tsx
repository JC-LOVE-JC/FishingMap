"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { DestinationStatus, TransportMode, WaterType } from "@/lib/types";

export type Language = "en" | "zh";

type TranslationKey =
  | "toolbar.journal"
  | "toolbar.title"
  | "toolbar.searchPlaceholder"
  | "toolbar.addDestination"
  | "toolbar.placingDestination"
  | "toolbar.working"
  | "toolbar.manualPinMode"
  | "toolbar.language"
  | "toolbar.chinese"
  | "toolbar.english"
  | "toolbar.search"
  | "toolbar.showSearch"
  | "toolbar.hideSearch"
  | "timeline.tripTimeline"
  | "timeline.heading"
  | "timeline.description"
  | "timeline.routeNotSet"
  | "timeline.stop"
  | "timeline.stops"
  | "timeline.deleteTrip"
  | "timeline.deleteStop"
  | "timeline.show"
  | "timeline.hide"
  | "timeline.past"
  | "timeline.upcoming"
  | "timeline.tbd"
  | "overview.destination"
  | "overview.destinationDetail"
  | "overview.atlas"
  | "overview.deleteStop"
  | "overview.overview"
  | "overview.timing"
  | "overview.coordinates"
  | "overview.notes"
  | "overview.targetSpecies"
  | "overview.techniques"
  | "overview.tags"
  | "overview.guideBoatInformation"
  | "overview.onBoardingPoint"
  | "overview.pointName"
  | "overview.openGoogleMaps"
  | "overview.guide"
  | "overview.guideName"
  | "overview.contact"
  | "overview.boatInformation"
  | "overview.boatName"
  | "overview.length"
  | "overview.typeOfBoat"
  | "overview.maxAnglers"
  | "overview.engineSetup"
  | "overview.fightingChair"
  | "overview.liveBaitTank"
  | "overview.outriggers"
  | "overview.birdRadar"
  | "overview.tunaTubes"
  | "overview.cabin"
  | "overview.toilet"
  | "overview.notProvided"
  | "overview.yes"
  | "overview.no"
  | "overview.expeditionRoute"
  | "overview.addStop"
  | "overview.deleteTrip"
  | "overview.oneStopMessage"
  | "overview.atlasOverview"
  | "overview.chartDream"
  | "overview.chartDreamCopy"
  | "overview.visibleExpeditions"
  | "overview.resultsFor"
  | "overview.destinationsReady"
  | "overview.noDestinations"
  | "overview.edit"
  | "overview.featured"
  | "transport.segment"
  | "transport.editRouteLeg"
  | "transport.routeEditor"
  | "transport.mode"
  | "transport.name"
  | "transport.time"
  | "transport.duration"
  | "transport.notes"
  | "transport.namePlaceholder"
  | "transport.notesPlaceholder"
  | "transport.save"
  | "common.cancel"
  | "common.draft"
  | "common.editing"
  | "form.newPin"
  | "form.refineDestination"
  | "form.composeDestination"
  | "form.editDetails"
  | "form.addDescription"
  | "form.editDescription"
  | "form.locationSearch"
  | "form.locationSearchDescription"
  | "form.backToSearch"
  | "form.useMapPick"
  | "form.locationPlaceholder"
  | "form.mapPickResolving"
  | "form.mapPickManual"
  | "form.locationChoiceHint"
  | "form.status"
  | "form.waterType"
  | "form.title"
  | "form.titlePlaceholder"
  | "form.expeditionName"
  | "form.expeditionPlaceholder"
  | "form.existingTrip"
  | "form.cityPort"
  | "form.cityPlaceholder"
  | "form.stopOrder"
  | "form.country"
  | "form.countryPlaceholder"
  | "form.region"
  | "form.regionPlaceholder"
  | "form.bestSeason"
  | "form.bestSeasonPlaceholder"
  | "form.startDate"
  | "form.endDate"
  | "form.rating"
  | "form.pinCoordinates"
  | "form.pinCoordinatesDescription"
  | "form.resolvingPlace"
  | "form.latitude"
  | "form.longitude"
  | "form.markFeatured"
  | "form.summary"
  | "form.summaryPlaceholder"
  | "form.notes"
  | "form.notesPlaceholder"
  | "form.species"
  | "form.speciesPlaceholder"
  | "form.techniques"
  | "form.techniquesPlaceholder"
  | "form.tags"
  | "form.tagsPlaceholder"
  | "form.gallery"
  | "form.galleryDescription"
  | "form.upload"
  | "form.addUrl"
  | "form.emptyGallery"
  | "form.photoItem"
  | "form.caption"
  | "form.altText"
  | "form.saveDestination"
  | "gallery.noGallery"
  | "gallery.noGalleryCopy"
  | "gallery.heroFrame"
  | "weather.forecast"
  | "weather.description"
  | "weather.loading"
  | "weather.unavailable"
  | "weather.now"
  | "weather.feelsLike"
  | "weather.apparentTemperature"
  | "weather.wind"
  | "weather.rain"
  | "weather.currentPrecipitation"
  | "weather.wave"
  | "weather.significantHeight"
  | "weather.swell"
  | "weather.primarySwell"
  | "weather.period"
  | "weather.wavePeriod"
  | "weather.seaTemp"
  | "weather.surfaceWater"
  | "weather.nextDays"
  | "weather.rainChance"
  | "weather.waveMax"
  | "weather.nextHours"
  | "weather.openWindy"
  | "weather.na"
  | "weather.forecastUnavailable"
  | "weather.thunderstorm"
  | "weather.mixedConditions"
  | "map.transferDetailsNotSet"
  | "map.timeNotSet"
  | "map.durationNotSet"
  | "map.leg"
  | "map.to"
  | "map.zoomIn"
  | "map.zoomOut"
  | "app.immersiveAtlas";

type TranslationDictionary = Record<TranslationKey, string>;

const translations: Record<Language, TranslationDictionary> = {
  en: {
    "toolbar.journal": "Global Expedition Journal",
    "toolbar.title": "Fishing Travel Planner",
    "toolbar.searchPlaceholder": "Search waters, cities, regions, countries",
    "toolbar.addDestination": "Add Destination",
    "toolbar.placingDestination": "Placing Destination",
    "toolbar.working": "Working...",
    "toolbar.manualPinMode":
      "Map pick mode is active. Click the map to place the stop, and we will try to fill the nearest city automatically.",
    "toolbar.language": "Language",
    "toolbar.chinese": "中文",
    "toolbar.english": "EN",
    "toolbar.search": "Search",
    "toolbar.showSearch": "Show search and filters",
    "toolbar.hideSearch": "Hide search and filters",
    "timeline.tripTimeline": "Trip Timeline",
    "timeline.heading": "Past and upcoming water time",
    "timeline.description": "Every expedition is sorted by date so you can scan what happened and what is already booked next.",
    "timeline.routeNotSet": "Route not set",
    "timeline.stop": "stop",
    "timeline.stops": "stops",
    "timeline.deleteTrip": "Delete trip",
    "timeline.deleteStop": "Delete stop",
    "timeline.show": "Show trip timeline",
    "timeline.hide": "Hide trip timeline",
    "timeline.past": "Past Log",
    "timeline.upcoming": "Upcoming Window",
    "timeline.tbd": "TBD",
    "overview.destination": "Destination",
    "overview.destinationDetail": "Destination Detail",
    "overview.atlas": "Atlas",
    "overview.deleteStop": "Delete Stop",
    "overview.overview": "Overview",
    "overview.timing": "Timing",
    "overview.coordinates": "Coordinates",
    "overview.notes": "Notes",
    "overview.targetSpecies": "Target Species",
    "overview.techniques": "Techniques",
    "overview.tags": "Tags",
    "overview.guideBoatInformation": "Guide & Boat Information",
    "overview.onBoardingPoint": "On Boarding Point",
    "overview.pointName": "Point Name",
    "overview.openGoogleMaps": "Open in Google Maps",
    "overview.guide": "Guide",
    "overview.guideName": "Name",
    "overview.contact": "Contact",
    "overview.boatInformation": "Boat Information",
    "overview.boatName": "Boat Name",
    "overview.length": "Length",
    "overview.typeOfBoat": "Type of Boat",
    "overview.maxAnglers": "Max Number of Anglers",
    "overview.engineSetup": "Engine Setup",
    "overview.fightingChair": "Fighting Chair",
    "overview.liveBaitTank": "Live Bait Tank",
    "overview.outriggers": "Outriggers",
    "overview.birdRadar": "Bird Radar",
    "overview.tunaTubes": "Tuna Tubes",
    "overview.cabin": "Cabin",
    "overview.toilet": "Toilet",
    "overview.notProvided": "Not provided",
    "overview.yes": "Yes",
    "overview.no": "No",
    "overview.expeditionRoute": "Expedition Route",
    "overview.addStop": "Add Stop",
    "overview.deleteTrip": "Delete Trip",
    "overview.oneStopMessage": "This expedition currently has one stop. Add another city or port to start drawing route legs on the map.",
    "overview.atlasOverview": "Atlas Overview",
    "overview.chartDream": "Chart dream waters, revisit legendary sessions.",
    "overview.chartDreamCopy": "The map is the main canvas. Search, filter, and open a destination to turn this into a living expedition journal.",
    "overview.visibleExpeditions": "Visible Expeditions",
    "overview.resultsFor": "{count} results for \"{query}\"",
    "overview.destinationsReady": "{count} destinations ready to explore",
    "overview.noDestinations": "No destinations match the current search and filters. Clear the query or add a new pin from the atlas toolbar.",
    "overview.edit": "Edit",
    "overview.featured": "Featured",
    "transport.segment": "Transport Segment",
    "transport.editRouteLeg": "Edit route leg",
    "transport.routeEditor": "Route editor",
    "transport.mode": "Mode",
    "transport.name": "Name",
    "transport.time": "Time",
    "transport.duration": "Duration",
    "transport.notes": "Notes",
    "transport.namePlaceholder": "Qantas QF431 or Outer Atoll Tender",
    "transport.notesPlaceholder": "Terminal, marina, pickup, or transfer notes",
    "transport.save": "Save Transfer",
    "common.cancel": "Cancel",
    "common.draft": "Draft",
    "common.editing": "Editing",
    "form.newPin": "New Expedition Pin",
    "form.refineDestination": "Refine Destination",
    "form.composeDestination": "Compose a new destination",
    "form.editDetails": "Edit expedition details",
    "form.addDescription": "Search a city or port first, let the app drop the stop into the city center, and only use manual coordinates when you need a custom pin.",
    "form.editDescription": "Tune the narrative, logistics, and gallery so the atlas stays elegant and useful.",
    "form.locationSearch": "Location Search",
    "form.locationSearchDescription": "Type a city, harbor, or region like Sydney, then pick the right result from the dropdown.",
    "form.backToSearch": "Back To Search",
    "form.useMapPick": "Use Map Pick",
    "form.locationPlaceholder": "Start typing: Sydney, Cairns, Cape Town...",
    "form.mapPickResolving": "Map pick mode is active. Click the map and we will try to resolve the nearest city for you.",
    "form.mapPickManual": "Map pick mode is active. Click directly on the map for a manual stop placement.",
    "form.locationChoiceHint": "Choosing a result will place the stop at that city's center and keep the exact coordinates editable below.",
    "form.status": "Status",
    "form.waterType": "Region Type",
    "form.title": "Stop Name",
    "form.titlePlaceholder": "Galapagos Outer Reef",
    "form.expeditionName": "Trip Name",
    "form.expeditionPlaceholder": "Florida Keys Backcountry",
    "form.existingTrip": "Existing Trip",
    "form.cityPort": "City / Port",
    "form.cityPlaceholder": "Puerto Ayora",
    "form.stopOrder": "Stop Order",
    "form.country": "Country",
    "form.countryPlaceholder": "Ecuador",
    "form.region": "Region",
    "form.regionPlaceholder": "Galapagos Province",
    "form.bestSeason": "Best Season",
    "form.bestSeasonPlaceholder": "June to November",
    "form.startDate": "Start Date",
    "form.endDate": "End Date",
    "form.rating": "Rating",
    "form.pinCoordinates": "Pin Coordinates",
    "form.pinCoordinatesDescription": "Fine-tune the pin manually, or use the map pick toggle above when you want to click a custom spot.",
    "form.resolvingPlace": "Resolving place",
    "form.latitude": "Latitude",
    "form.longitude": "Longitude",
    "form.markFeatured": "Mark as featured in the atlas overview",
    "form.summary": "Summary",
    "form.summaryPlaceholder": "A sharp, editorial overview of why this destination matters.",
    "form.notes": "Notes",
    "form.notesPlaceholder": "Record planning notes, memories, catch details, logistics, or tackle ideas.",
    "form.species": "Species",
    "form.speciesPlaceholder": "Type mah, gt, tuna, tarpon...",
    "form.techniques": "Techniques",
    "form.techniquesPlaceholder": "Popping, fly, jigging",
    "form.tags": "Tags",
    "form.tagsPlaceholder": "Remote, bucket list, mothership",
    "form.gallery": "Gallery",
    "form.galleryDescription": "Mix uploaded images with remote URLs. Everything persists locally for the MVP.",
    "form.upload": "Upload",
    "form.addUrl": "Add URL",
    "form.emptyGallery": "Add the first image to give this destination a stronger editorial presence.",
    "form.photoItem": "Photo item",
    "form.caption": "Caption",
    "form.altText": "Alt text",
    "form.saveDestination": "Save Destination",
    "gallery.noGallery": "No Gallery Yet",
    "gallery.noGalleryCopy": "Add inspiration frames, memories, or scouting imagery.",
    "gallery.heroFrame": "Hero Frame",
    "weather.forecast": "Forecast",
    "weather.description": "Recent forecast powered by MET Norway, with marine fallback where needed and a direct Windy handoff for deeper map detail.",
    "weather.loading": "Loading forecast...",
    "weather.unavailable": "Forecast is unavailable right now. You can still open this location in Windy.",
    "weather.now": "Now",
    "weather.feelsLike": "Feels Like",
    "weather.apparentTemperature": "Apparent temperature",
    "weather.wind": "Wind",
    "weather.rain": "Rain",
    "weather.currentPrecipitation": "Current precipitation",
    "weather.wave": "Wave",
    "weather.significantHeight": "Significant height",
    "weather.swell": "Swell",
    "weather.primarySwell": "Primary swell",
    "weather.period": "Period",
    "weather.wavePeriod": "Wave period",
    "weather.seaTemp": "Sea Temp",
    "weather.surfaceWater": "Surface water",
    "weather.nextDays": "Next Days",
    "weather.rainChance": "Rain Chance",
    "weather.waveMax": "Wave Max",
    "weather.nextHours": "Next Hours",
    "weather.openWindy": "Windy",
    "weather.na": "N/A",
    "weather.forecastUnavailable": "Forecast unavailable",
    "weather.thunderstorm": "Thunderstorm",
    "weather.mixedConditions": "Mixed conditions",
    "map.transferDetailsNotSet": "Transfer details not set",
    "map.timeNotSet": "Time not set",
    "map.durationNotSet": "Duration not set",
    "map.leg": "Leg {number}",
    "map.to": "to",
    "map.zoomIn": "Zoom in",
    "map.zoomOut": "Zoom out",
    "app.immersiveAtlas": "Immersive expedition atlas · local-first MVP"
  },
  zh: {
    "toolbar.journal": "全球钓旅图志",
    "toolbar.title": "钓旅规划",
    "toolbar.searchPlaceholder": "搜索海域、城市、地区或国家",
    "toolbar.addDestination": "添加地点",
    "toolbar.placingDestination": "正在放置",
    "toolbar.working": "处理中",
    "toolbar.manualPinMode": "已开启地图选点。点击地图即可放置站点，系统会尽量补全最近的城市信息。",
    "toolbar.language": "语言",
    "toolbar.chinese": "中文",
    "toolbar.english": "EN",
    "toolbar.search": "搜索",
    "toolbar.showSearch": "展开搜索与筛选",
    "toolbar.hideSearch": "收起搜索与筛选",
    "timeline.tripTimeline": "行程时间线",
    "timeline.heading": "行程时间线",
    "timeline.description": "所有行程都会按时间顺序排列，方便你快速浏览过往记录与后续安排。",
    "timeline.routeNotSet": "路线未设置",
    "timeline.stop": "站",
    "timeline.stops": "站",
    "timeline.deleteTrip": "删除行程",
    "timeline.deleteStop": "删除站点",
    "timeline.show": "显示行程时间轴",
    "timeline.hide": "隐藏行程时间轴",
    "timeline.past": "过往行程",
    "timeline.upcoming": "未来行程",
    "timeline.tbd": "待定",
    "overview.destination": "目的地",
    "overview.destinationDetail": "目的地详情",
    "overview.atlas": "总览",
    "overview.deleteStop": "删除站点",
    "overview.overview": "概览",
    "overview.timing": "时间",
    "overview.coordinates": "坐标",
    "overview.notes": "备注",
    "overview.targetSpecies": "目标鱼种",
    "overview.techniques": "钓法",
    "overview.tags": "标签",
    "overview.guideBoatInformation": "向导与船只信息",
    "overview.onBoardingPoint": "上船点",
    "overview.pointName": "点位名称",
    "overview.openGoogleMaps": "在 Google 地图中打开",
    "overview.guide": "向导",
    "overview.guideName": "姓名",
    "overview.contact": "联系方式",
    "overview.boatInformation": "船只信息",
    "overview.boatName": "船名",
    "overview.length": "长度",
    "overview.typeOfBoat": "船型",
    "overview.maxAnglers": "最多钓手数",
    "overview.engineSetup": "引擎配置",
    "overview.fightingChair": "搏鱼椅",
    "overview.liveBaitTank": "活饵舱",
    "overview.outriggers": "侧伸杆",
    "overview.birdRadar": "鸟雷达",
    "overview.tunaTubes": "金枪鱼管",
    "overview.cabin": "舱室",
    "overview.toilet": "厕所",
    "overview.notProvided": "未填写",
    "overview.yes": "有",
    "overview.no": "无",
    "overview.expeditionRoute": "行程路线",
    "overview.addStop": "新增站点",
    "overview.deleteTrip": "删除行程",
    "overview.oneStopMessage": "当前行程只有一个站点。再添加一个城市或港口后，地图上就会显示路线。",
    "overview.atlasOverview": "行程总览",
    "overview.chartDream": "收藏心仪水域，回看经典旅程。",
    "overview.chartDreamCopy": "以地图为主视图，梳理每一段计划与回忆。",
    "overview.visibleExpeditions": "当前结果",
    "overview.resultsFor": "“{query}” 共匹配 {count} 个地点",
    "overview.destinationsReady": "当前共有 {count} 个地点",
    "overview.noDestinations": "当前搜索与筛选条件下没有匹配结果。你可以清空条件，或从顶部工具栏新增地点。",
    "overview.edit": "编辑",
    "overview.featured": "精选",
    "transport.segment": "交通信息",
    "transport.editRouteLeg": "编辑本段行程",
    "transport.routeEditor": "交通编辑器",
    "transport.mode": "交通方式",
    "transport.name": "名称",
    "transport.time": "时间",
    "transport.duration": "时长",
    "transport.notes": "备注",
    "transport.namePlaceholder": "例如 Qantas QF431 或 Outer Atoll Tender",
    "transport.notesPlaceholder": "填写航站楼、码头、接送或转场备注",
    "transport.save": "保存交通信息",
    "common.cancel": "取消",
    "common.draft": "草稿",
    "common.editing": "编辑中",
    "form.newPin": "新增地点",
    "form.refineDestination": "编辑地点",
    "form.composeDestination": "创建新地点",
    "form.editDetails": "编辑地点信息",
    "form.addDescription": "先搜索城市或港口，系统会把站点落在城市中心；只有需要自定义位置时再手动调整坐标。",
    "form.editDescription": "补充说明、行程信息和图片，让这张地图既清晰也更完整。",
    "form.locationSearch": "搜索地点",
    "form.locationSearchDescription": "输入城市、港口或地区名称，例如 Sydney，然后从下拉结果里选择正确地点。",
    "form.backToSearch": "返回搜索",
    "form.useMapPick": "地图选点",
    "form.locationPlaceholder": "开始输入：Sydney、Cairns、Cape Town...",
    "form.mapPickResolving": "地图选点模式已开启。点击地图后，我们会尝试帮你解析最近的城市。",
    "form.mapPickManual": "地图选点模式已开启。请直接点击地图来手动放置 stop。",
    "form.locationChoiceHint": "选择搜索结果后，站点会自动落在该城市中心，下方坐标仍可继续微调。",
    "form.status": "状态",
    "form.waterType": "地域类型",
    "form.title": "站点名称",
    "form.titlePlaceholder": "Galapagos Outer Reef",
    "form.expeditionName": "行程名称",
    "form.expeditionPlaceholder": "Florida Keys Backcountry",
    "form.existingTrip": "已有行程",
    "form.cityPort": "城市 / 港口",
    "form.cityPlaceholder": "Puerto Ayora",
    "form.stopOrder": "站点顺序",
    "form.country": "国家",
    "form.countryPlaceholder": "Ecuador",
    "form.region": "区域",
    "form.regionPlaceholder": "Galapagos Province",
    "form.bestSeason": "最佳季节",
    "form.bestSeasonPlaceholder": "6月到11月",
    "form.startDate": "开始日期",
    "form.endDate": "结束日期",
    "form.rating": "评分",
    "form.pinCoordinates": "地图坐标",
    "form.pinCoordinatesDescription": "你可以在这里微调坐标；若想直接在地图上落点，可使用上方的地图选点。",
    "form.resolvingPlace": "正在解析地点",
    "form.latitude": "纬度",
    "form.longitude": "经度",
    "form.markFeatured": "在 atlas 总览中标记为精选",
    "form.summary": "简介",
    "form.summaryPlaceholder": "用一句简洁的话概括这个地点的亮点与意义。",
    "form.notes": "备注",
    "form.notesPlaceholder": "记录计划、回忆、鱼获细节、后勤安排或装备想法。",
    "form.species": "鱼种",
    "form.speciesPlaceholder": "输入 mah、gt、tuna、tarpon...",
    "form.techniques": "钓法",
    "form.techniquesPlaceholder": "波扒、飞蝇、铁板",
    "form.tags": "标签",
    "form.tagsPlaceholder": "偏远、梦想清单、母船",
    "form.gallery": "图片库",
    "form.galleryDescription": "支持上传本地图片，也支持填写远程图片链接；当前版本会保存在本地。",
    "form.upload": "上传",
    "form.addUrl": "添加链接",
    "form.emptyGallery": "先添加一张图片，让这个地点的信息更完整。",
    "form.photoItem": "图片项",
    "form.caption": "说明文字",
    "form.altText": "替代文本",
    "form.saveDestination": "保存地点",
    "gallery.noGallery": "还没有图片",
    "gallery.noGalleryCopy": "可以添加灵感图、回忆照片或踩点素材。",
    "gallery.heroFrame": "主视觉",
    "weather.forecast": "天气预报",
    "weather.description": "显示近期天气与海况信息，并保留 Windy 跳转入口。",
    "weather.loading": "正在加载天气...",
    "weather.unavailable": "暂时无法获取天气数据，但你仍然可以在 Windy 中打开这个地点。",
    "weather.now": "当前",
    "weather.feelsLike": "体感",
    "weather.apparentTemperature": "体感温度",
    "weather.wind": "风",
    "weather.rain": "降雨",
    "weather.currentPrecipitation": "当前降水",
    "weather.wave": "浪高",
    "weather.significantHeight": "有效波高",
    "weather.swell": "涌浪",
    "weather.primarySwell": "主涌浪",
    "weather.period": "周期",
    "weather.wavePeriod": "波浪周期",
    "weather.seaTemp": "海温",
    "weather.surfaceWater": "表层水温",
    "weather.nextDays": "未来几天",
    "weather.rainChance": "降雨概率",
    "weather.waveMax": "最大浪高",
    "weather.nextHours": "未来几小时",
    "weather.openWindy": "Windy",
    "weather.na": "暂无",
    "weather.forecastUnavailable": "暂无预报",
    "weather.thunderstorm": "雷暴",
    "weather.mixedConditions": "天气多变",
    "map.transferDetailsNotSet": "还没有填写交通信息",
    "map.timeNotSet": "时间未设置",
    "map.durationNotSet": "时长未设置",
    "map.leg": "第 {number} 段",
    "map.to": "至",
    "map.zoomIn": "放大",
    "map.zoomOut": "缩小",
    "app.immersiveAtlas": "沉浸式钓旅地图 · 本地优先 MVP"
  }
};

type LanguageContextValue = {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export const LANGUAGE_STORAGE_KEY = "fishing-travel-planner.language.v1";

export function getLocale(language: Language) {
  return language === "zh" ? "zh-CN" : "en-US";
}

export function LanguageProvider({
  children,
  language,
  setLanguage
}: {
  children: ReactNode;
  language: Language;
  setLanguage: (language: Language) => void;
}) {
  const value: LanguageContextValue = {
    language,
    locale: getLocale(language),
    setLanguage,
    t(key, vars) {
      const template = translations[language][key] ?? translations.en[key] ?? key;

      if (!vars) {
        return template;
      }

      return Object.entries(vars).reduce(
        (result, [name, value]) => result.replaceAll(`{${name}}`, String(value)),
        template
      );
    }
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }

  return context;
}

export function getStatusLabel(status: DestinationStatus, language: Language) {
  const table = {
    en: { planned: "Planned", visited: "Visited" },
    zh: { planned: "计划中", visited: "已完成" }
  } satisfies Record<Language, Record<DestinationStatus, string>>;

  return table[language][status];
}

export function getWaterTypeLabel(waterType: WaterType, language: Language) {
  const table = {
    en: { saltwater: "Saltwater", freshwater: "Freshwater", urban: "Urban" },
    zh: { saltwater: "海水", freshwater: "淡水", urban: "城市" }
  } satisfies Record<Language, Record<WaterType, string>>;

  return table[language][waterType];
}

export function getTransportModeLabel(mode: TransportMode, language: Language) {
  const table = {
    en: { flight: "Flight", boat: "Boat", drive: "Drive" },
    zh: { flight: "飞机", boat: "船", drive: "车" }
  } satisfies Record<Language, Record<TransportMode, string>>;

  return table[language][mode];
}

export function formatStopOrdinal(number: number, language: Language) {
  return language === "zh" ? `第 ${number} 站` : `Stop ${number}`;
}

export function formatStopCount(count: number, language: Language) {
  return language === "zh" ? `${count} 站` : `${count} ${count === 1 ? "stop" : "stops"}`;
}

export function translateWeatherCondition(label: string | null | undefined, language: Language) {
  if (!label) {
    return language === "zh" ? "暂无预报" : "Forecast unavailable";
  }

  const dictionary: Record<string, string> = {
    "Forecast unavailable": "暂无预报",
    "Thunderstorm": "雷暴",
    "Mixed conditions": "天气多变",
    "Clear sky": "晴朗",
    "Mostly clear": "大致晴朗",
    "Partly cloudy": "局部多云",
    "Overcast": "阴天",
    "Fog": "有雾",
    "Depositing rime fog": "雾凇雾",
    "Light drizzle": "小毛毛雨",
    "Drizzle": "毛毛雨",
    "Dense drizzle": "强毛毛雨",
    "Freezing drizzle": "冻毛毛雨",
    "Dense freezing drizzle": "强冻毛毛雨",
    "Light rain": "小雨",
    "Rain": "降雨",
    "Heavy rain": "大雨",
    "Freezing rain": "冻雨",
    "Heavy freezing rain": "强冻雨",
    "Light snow": "小雪",
    "Snow": "降雪",
    "Heavy snow": "大雪",
    "Snow grains": "米雪",
    "Rain showers": "阵雨",
    "Heavy showers": "强阵雨",
    "Violent showers": "暴雨阵雨",
    "Snow showers": "阵雪",
    "Heavy snow showers": "强阵雪",
    "Thunderstorm with hail": "伴有冰雹的雷暴",
    "Severe thunderstorm": "强雷暴",
    "Fair": "晴好",
    "Cloudy": "多云",
    "Sleet": "雨夹雪",
    "Light sleet": "小雨夹雪"
  };

  return language === "zh" ? dictionary[label] ?? label : label;
}
