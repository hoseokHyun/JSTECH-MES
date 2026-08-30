import { ProductType } from '../types';

export const KOREAN_DAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const HOLIDAYS_2026: string[] = [
  "2026-01-01", "2026-02-16", "2026-02-17", "2026-02-18", "2026-03-01",
  "2026-05-05", "2026-05-24", "2026-06-06", "2026-08-15", "2026-09-24",
  "2026-09-25", "2026-09-26", "2026-10-03", "2026-10-09", "2026-12-25"
];

export const MCT_MACHINES: string[] = [
  "MCT 5호기 #1",
  "MCT 5호기 #2",
  "MCT 5호기 #3",
  "MCT 6.5호기 #1",
  "MCT 6.5호기 #2",
  "MCT 6.5호기 #3",
  "MCT 6.5호기 #4",
  "MCT 7.5호기 #1",
  "MCT 12호기 #1",
  "MCT 12호기 #2"
];

export const GRINDER_MACHINES: string[] = [
  "연마기 2M #1",
  "연마기 2M #2",
  "연마기 2M #3",
  "연마기 2M #4",
  "연마기 3M #1",
  "연마기 3M #2",
  "연마기 3M #3",
  "연마기 3M #4",
  "프로파일 연마기 #1"
];

export const CMM_MACHINES: string[] = [
  "CMM 덕인",
  "CMM Mitutoyo"
];

export const ALL_EQUIPMENT_LIST: string[] = [
  ...MCT_MACHINES,
  ...GRINDER_MACHINES,
  ...CMM_MACHINES
];

export const DEFAULT_PRODUCT_TYPES: Record<string, ProductType> = {
  "TYPE_CUSTOM": {
    id: "TYPE_CUSTOM",
    isReference: false,
    name: "직접 입력 (커스텀 공정 설계)",
    processes: [
      { name: "1차 MCT 가공", category: "가공", durationHours: 4.0 },
      { name: "정밀 평면 연마", category: "연마", durationHours: 3.0 },
      { name: "CMM 3차원 정밀 측정 및 검사", category: "품질", durationHours: 1.0 }
    ]
  },
  "TYPE_SLIT_NOZZLE": {
    id: "TYPE_SLIT_NOZZLE",
    isReference: true,
    name: "슬릿 노즐 공정",
    processes: [
      { name: "소재 절단", category: "외주", durationHours: 48.0 },
      { name: "열처리", category: "외주", durationHours: 96.0 },
      { name: "소재 각가공", category: "외주", durationHours: 3.0 },
      { name: "1차가공(외면) - 면삭_L", category: "가공", durationHours: 0.33 },
      { name: "1차가공(외면) - 드릴가공_L", category: "가공", durationHours: 0.5 },
      { name: "1차가공(외면) - 주입구 홀 / 단차_L", category: "가공", durationHours: 2.0 },
      { name: "1차가공(외면) - 모따기 작업_L", category: "가공", durationHours: 0.25 },
      { name: "1차가공(외면) - 탭가공_L", category: "가공", durationHours: 0.25 },
      { name: "1차가공(외면) - 사이드 가공_L", category: "가공", durationHours: 1.5 },
      { name: "2차가공(경면부) - 면삭_L", category: "가공", durationHours: 0.33 },
      { name: "2차가공(경면부) - 유로가공_L", category: "가공", durationHours: 20.0 },
      { name: "2차가공(경면부) - 드릴가공_L", category: "가공", durationHours: 2.0 },
      { name: "2차가공(경면부) - 단차가공(밀어내기)_L", category: "가공", durationHours: 0.17 },
      { name: "2차가공(경면부) - 모따기 작업_L", category: "가공", durationHours: 0.33 },
      { name: "2차가공(경면부) - 탭가공_L", category: "가공", durationHours: 1.0 },
      { name: "3차가공(바닥) - 드릴가공_L", category: "가공", durationHours: 1.5 },
      { name: "3차가공(바닥) - 탭가공_L", category: "가공", durationHours: 0.25 },
      { name: "립 가공_L", category: "가공", durationHours: 7.0 },
      { name: "공정검사(가공)", category: "가공", durationHours: 1.5 },
      { name: "1차가공(경면부) - 면삭_U", category: "가공", durationHours: 0.33 },
      { name: "1차가공(경면부) - 유로가공_U", category: "가공", durationHours: 20.0 },
      { name: "1차가공(경면부) - 드릴가공_U", category: "가공", durationHours: 3.0 },
      { name: "1차가공(경면부) - 단차가공_U", category: "가공", durationHours: 0.5 },
      { name: "1차가공(경면부) - 모따기 작업_U", category: "가공", durationHours: 0.5 },
      { name: "1차가공(경면부) - 탭가공_U", category: "가공", durationHours: 0.08 },
      { name: "1차가공(경면부) - 사이드 가공_U", category: "가공", durationHours: 1.5 },
      { name: "2차가공(외면) - 면삭_U", category: "가공", durationHours: 0.33 },
      { name: "2차가공(외면) - 드릴가공_U", category: "가공", durationHours: 1.0 },
      { name: "2차가공(외면) - C'BORE_U", category: "가공", durationHours: 1.5 },
      { name: "2차가공(외면) - 모따기 작업_U", category: "가공", durationHours: 0.5 },
      { name: "2차가공(외면) - 탭가공_U", category: "가공", durationHours: 0.5 },
      { name: "3차가공(바닥) - 드릴가공_U", category: "가공", durationHours: 1.5 },
      { name: "3차가공(바닥) - 탭가공_U", category: "가공", durationHours: 0.5 },
      { name: "립 가공_U", category: "가공", durationHours: 7.0 },
      { name: "립 - 카바 고정용 탭 가공_U", category: "가공", durationHours: 1.0 },
      { name: "조절볼트 가공", category: "가공", durationHours: 15.0 },
      { name: "공정검사(가공)", category: "가공", durationHours: 1.0 },
      { name: "황삭연마", category: "연마", durationHours: 16.5 },
      { name: "정삭 가공(상-각인, 하-유로부)", category: "연마", durationHours: 36.0 },
      { name: "래핑(상, 하판)", category: "외주", durationHours: 120.0 },
      { name: "1차 조립", category: "연마", durationHours: 1.0 },
      { name: "1차 조립연마(립)", category: "연마", durationHours: 0.5 },
      { name: "1차 조립연마 (직각)", category: "연마", durationHours: 2.5 },
      { name: "1차 조립연마 (각도)", category: "연마", durationHours: 2.5 },
      { name: "1차 조립연마 (상단)", category: "연마", durationHours: 2.5 },
      { name: "분해", category: "연마", durationHours: 0.5 },
      { name: "정삭가공(PIN가공)_L", category: "연마", durationHours: 3.0 },
      { name: "접시머리 볼트 조립", category: "연마", durationHours: 1.0 },
      { name: "정삭연마", category: "연마", durationHours: 17.0 },
      { name: "공정검사", category: "연마", durationHours: 0.5 },
      { name: "탈자", category: "연마", durationHours: 0.5 },
      { name: "평면 경면 연마", category: "연마", durationHours: 30.0 },
      { name: "3차원 측정", category: "품질", durationHours: 1.0 },
      { name: "평면 기계 래핑", category: "연마", durationHours: 12.0 },
      { name: "공정검사(연마)", category: "연마", durationHours: 0.5 },
      { name: "접시머리 볼트 분해", category: "연마", durationHours: 3.0 },
      { name: "초음파 세척", category: "품질", durationHours: 2.0 },
      { name: "조립", category: "품질", durationHours: 6.0 },
      { name: "측면연마(립 측면 각도연마 포함)", category: "연마", durationHours: 6.0 },
      { name: "2차 조립연마(직각)", category: "연마", durationHours: 2.5 },
      { name: "2차 조립연마(상단)", category: "연마", durationHours: 2.5 },
      { name: "조립(DAMPER)", category: "연마", durationHours: 0.5 },
      { name: "DAMPER 각도연마", category: "연마", durationHours: 1.0 },
      { name: "립 중삭연마(DAMPER 포함)", category: "연마", durationHours: 5.0 },
      { name: "립 각도 경면연마", category: "연마", durationHours: 10.0 },
      { name: "립 경면연마", category: "연마", durationHours: 3.0 },
      { name: "3차원 측정 및 공정검사", category: "품질", durationHours: 4.0 },
      { name: "분해", category: "품질", durationHours: 1.0 },
      { name: "초음파 세척", category: "품질", durationHours: 6.0 },
      { name: "탈자", category: "품질", durationHours: 1.0 },
      { name: "3차원 측정, 광학 검사", category: "품질", durationHours: 3.0 },
      { name: "부품 준비", category: "품질", durationHours: 1.0 },
      { name: "고객사 검수(평면)", category: "품질", durationHours: 3.0 },
      { name: "립래핑", category: "품질", durationHours: 5.0 },
      { name: "광학검사", category: "품질", durationHours: 3.0 },
      { name: "조절볼트조립", category: "품질", durationHours: 10.0 },
      { name: "3차원 측정 및 공정검사", category: "품질", durationHours: 2.0 },
      { name: "조립(DAMPER)", category: "품질", durationHours: 13.0 },
      { name: "고객사 검수(조립)", category: "품질", durationHours: 4.0 },
      { name: "포장 및 납품준비", category: "품질", durationHours: 2.0 }
    ]
  },
  "TYPE_WIDE_3P": {
    id: "TYPE_WIDE_3P",
    isReference: true,
    name: "광폭 3P 공정",
    processes: [
      { name: "소재 절단", category: "외주", durationHours: 72.0 },
      { name: "열처리", category: "외주", durationHours: 96.0 },
      { name: "소재 각가공", category: "외주", durationHours: 3.0 },
      { name: "1차가공(외면) - 면삭_L", category: "가공", durationHours: 0.33 },
      { name: "1차가공(외면) - 드릴가공_L", category: "가공", durationHours: 0.5 },
      { name: "1차가공(외면) - 모따기 작업_L", category: "가공", durationHours: 0.25 },
      { name: "1차가공(외면) - 탭가공_L", category: "가공", durationHours: 0.25 },
      { name: "1차가공(외면) - 사이드 가공_L", category: "가공", durationHours: 1.5 },
      { name: "2차가공(경면부) - 면삭_L", category: "가공", durationHours: 0.33 },
      { name: "2차가공(경면부) - 유로가공_L", category: "가공", durationHours: 20.0 },
      { name: "2차가공(경면부) - 드릴가공_L", category: "가공", durationHours: 2.0 },
      { name: "2차가공(경면부) - 단차가공(밀어내기)_L", category: "가공", durationHours: 0.17 },
      { name: "2차가공(경면부) - 모따기 작업_L", category: "가공", durationHours: 0.33 },
      { name: "2차가공(경면부) - 탭가공_L", category: "가공", durationHours: 1.0 },
      { name: "3차가공(바닥) - 드릴가공_L", category: "가공", durationHours: 1.5 },
      { name: "3차가공(바닥) - KEY가공_L", category: "가공", durationHours: 0.5 },
      { name: "3차가공(바닥) - 모따기 작업_L", category: "가공", durationHours: 0.33 },
      { name: "3차가공(바닥) - 탭가공_L", category: "가공", durationHours: 0.25 },
      { name: "4차가공 - 40도 주입구 홀_L", category: "가공", durationHours: 1.5 },
      { name: "5차가공 - 바닥면 주입구 홀 정삭_L", category: "가공", durationHours: 2.0 },
      { name: "립 가공_L", category: "가공", durationHours: 7.0 },
      { name: "공정검사(가공)", category: "가공", durationHours: 1.5 },
      { name: "1차가공(경면부) - 면삭_U", category: "가공", durationHours: 0.33 },
      { name: "1차가공(경면부) - 드릴가공_U", category: "가공", durationHours: 2.0 },
      { name: "1차가공(경면부) - 단차가공_U", category: "가공", durationHours: 0.5 },
      { name: "1차가공(경면부) - 모따기 작업_U", category: "가공", durationHours: 0.5 },
      { name: "1차가공(경면부) - 탭가공_U", category: "가공", durationHours: 0.08 },
      { name: "1차가공(경면부) - 사이드 가공_U", category: "가공", durationHours: 1.5 },
      { name: "2차가공(외면) - 면삭_U", category: "가공", durationHours: 0.33 },
      { name: "2차가공(외면) - 드릴가공_U", category: "가공", durationHours: 1.5 },
      { name: "2차가공(외면) - C'BORE_U", category: "가공", durationHours: 1.5 },
      { name: "2차가공(외면) - 모따기 작업_U", category: "가공", durationHours: 0.5 },
      { name: "2차가공(외면) - 탭가공_U", category: "가공", durationHours: 0.5 },
      { name: "3차가공(35도 경사면)_U", category: "가공", durationHours: 8.0 },
      { name: "3차가공(바닥) - 드릴가공_U", category: "가공", durationHours: 1.5 },
      { name: "3차가공(바닥) - KEY가공_U", category: "가공", durationHours: 0.5 },
      { name: "3차가공(바닥) - 모따기 작업_U", category: "가공", durationHours: 0.5 },
      { name: "3차가공(바닥) - 탭가공_U", category: "가공", durationHours: 0.5 },
      { name: "립 가공_U", category: "가공", durationHours: 7.0 },
      { name: "립 - 카바 고정용 탭 가공_U", category: "가공", durationHours: 1.0 },
      { name: "조절볼트 가공", category: "가공", durationHours: 15.0 },
      { name: "공정검사(가공)", category: "가공", durationHours: 1.0 },
      { name: "1차 가공(외면) - 황삭_M", category: "가공", durationHours: 10.0 },
      { name: "1차 가공(상면 경면부) - 유로정삭_M", category: "가공", durationHours: 20.0 },
      { name: "1차 가공(상면 경면부) - 드릴작업_M", category: "가공", durationHours: 1.5 },
      { name: "1차 가공(상면 경면부) - 밀어내기볼트 자리파기_M", category: "가공", durationHours: 0.25 },
      { name: "1차 가공(상면 경면부) - 모따기_M", category: "가공", durationHours: 0.17 },
      { name: "1차 가공(상면 경면부) - 탭가공_M", category: "가공", durationHours: 0.25 },
      { name: "1차 가공(상면 경면부) - 사이드 가공_M", category: "가공", durationHours: 1.5 },
      { name: "1차 가공(상면 경면부) - 바닥면 가공_M", category: "가공", durationHours: 0.33 },
      { name: "2차 가공(경사면) - 정삭_M", category: "가공", durationHours: 12.0 },
      { name: "3차가공(립) - 정삭_M", category: "가공", durationHours: 3.0 },
      { name: "4차가공(하면 경면부 - 바닥면)_M", category: "가공", durationHours: 2.0 },
      { name: "4차가공(하면 경면부 - 상면)_M", category: "가공", durationHours: 3.0 },
      { name: "5차 가공(주입구 홀)_M", category: "가공", durationHours: 2.0 },
      { name: "6차 가공(바닥면 주입구 홀)_M", category: "가공", durationHours: 2.0 },
      { name: "7차 가공(C.B )_M", category: "가공", durationHours: 6.0 },
      { name: "8차 가공 - 최종면삭_M", category: "가공", durationHours: 1.5 },
      { name: "공정검사(가공)", category: "가공", durationHours: 1.0 },
      { name: "래핑", category: "외주", durationHours: 120.0 },
      { name: "탈자", category: "연마", durationHours: 1.0 },
      { name: "황삭연마", category: "연마", durationHours: 16.0 },
      { name: "1차 조립", category: "연마", durationHours: 1.5 },
      { name: "1차 조립연마(립)", category: "연마", durationHours: 1.5 },
      { name: "1차 조립연마(직각)", category: "연마", durationHours: 7.0 },
      { name: "분해", category: "연마", durationHours: 2.0 },
      { name: "후가공-각인_U", category: "가공", durationHours: 6.0 },
      { name: "후가공-핀가공_L", category: "가공", durationHours: 1.5 },
      { name: "중삭연마", category: "연마", durationHours: 5.0 },
      { name: "2차조립", category: "연마", durationHours: 2.0 },
      { name: "후가공-측면가공", category: "가공", durationHours: 1.5 },
      { name: "후가공 측면각인", category: "가공", durationHours: 1.5 },
      { name: "3차원 측정(에이징4h)", category: "품질", durationHours: 4.5 },
      { name: "2차 조립연마(직각)", category: "연마", durationHours: 8.0 },
      { name: "2차 조립연마(립각도)", category: "연마", durationHours: 3.0 },
      { name: "분해", category: "연마", durationHours: 2.0 },
      { name: "재조립, 분해(높이치수확인)", category: "연마", durationHours: 4.0 },
      { name: "각도연마_U", category: "연마", durationHours: 3.0 },
      { name: "각도연마_L", category: "연마", durationHours: 3.0 },
      { name: "정삭연마", category: "연마", durationHours: 12.0 },
      { name: "3차원 측정", category: "품질", durationHours: 1.5 },
      { name: "탈자", category: "연마", durationHours: 1.0 },
      { name: "경면연마", category: "연마", durationHours: 32.0 },
      { name: "탈자", category: "연마", durationHours: 1.0 },
      { name: "조도측정", category: "품질", durationHours: 0.75 },
      { name: "3차원측정(에이징4h)", category: "품질", durationHours: 7.5 },
      { name: "세척", category: "품질", durationHours: 3.0 },
      { name: "외관검사", category: "품질", durationHours: 1.0 },
      { name: "3차 조립", category: "품질", durationHours: 2.5 },
      { name: "3차원 측정", category: "품질", durationHours: 1.0 },
      { name: "3차 조립연마(직각)", category: "연마", durationHours: 8.0 },
      { name: "3차원측정(에이징4h)", category: "품질", durationHours: 4.5 },
      { name: "립 중삭연마", category: "연마", durationHours: 5.0 },
      { name: "립 경면연마", category: "연마", durationHours: 2.0 },
      { name: "3차원측정(에이징4h)", category: "품질", durationHours: 4.5 },
      { name: "분해", category: "품질", durationHours: 1.0 },
      { name: "세척", category: "품질", durationHours: 3.0 },
      { name: "탈자", category: "품질", durationHours: 1.5 },
      { name: "3차원 측정", category: "품질", durationHours: 3.5 },
      { name: "립 래핑", category: "품질", durationHours: 3.0 },
      { name: "광학검사", category: "품질", durationHours: 1.0 },
      { name: "최종 외관검사", category: "품질", durationHours: 1.0 },
      { name: "최종조립", category: "품질", durationHours: 2.5 },
      { name: "3차원 측정(진직도/밴딩량)", category: "품질", durationHours: 1.0 },
      { name: "3차원 측정(형상치수)", category: "품질", durationHours: 0.5 },
      { name: "광학검사", category: "품질", durationHours: 1.0 },
      { name: "조절볼트 조립", category: "품질", durationHours: 4.0 },
      { name: "부품류 조립", category: "품질", durationHours: 2.0 },
      { name: "포장 및 납품준비", category: "품질", durationHours: 1.0 }
    ]
  },
  "TYPE_WIDE_2P": {
    id: "TYPE_WIDE_2P",
    isReference: true,
    name: "광폭 2P 공정",
    processes: [
      { name: "소재 절단", category: "외주", durationHours: 72.0 },
      { name: "열처리", category: "외주", durationHours: 96.0 },
      { name: "소재 각가공", category: "외주", durationHours: 3.0 },
      { name: "1차가공(외면) - 면삭_L", category: "가공", durationHours: 0.33 },
      { name: "1차가공(외면) - 드릴가공_L", category: "가공", durationHours: 0.5 },
      { name: "1차가공(외면) - 주입구 홀 / 단차_L", category: "가공", durationHours: 2.0 },
      { name: "1차가공(외면) - 모따기 작업_L", category: "가공", durationHours: 0.25 },
      { name: "1차가공(외면) - 탭가공_L", category: "가공", durationHours: 0.25 },
      { name: "1차가공(외면) - 사이드 가공_L", category: "가공", durationHours: 1.5 },
      { name: "2차가공(경면부) - 면삭_L", category: "가공", durationHours: 0.33 },
      { name: "2차가공(경면부) - 유로가공_L", category: "가공", durationHours: 20.0 },
      { name: "2차가공(경면부) - 드릴가공_L", category: "가공", durationHours: 2.0 },
      { name: "2차가공(경면부) - 단차가공(밀어내기)_L", category: "가공", durationHours: 0.17 },
      { name: "2차가공(경면부) - 모따기 작업_L", category: "가공", durationHours: 0.33 },
      { name: "2차가공(경면부) - 탭가공_L", category: "가공", durationHours: 1.0 },
      { name: "3차가공(바닥) - 드릴가공_L", category: "가공", durationHours: 1.5 },
      { name: "3차가공(바닥) - KEY가공_L", category: "가공", durationHours: 0.5 },
      { name: "3차가공(바닥) - 모따기 작업_L", category: "가공", durationHours: 0.67 },
      { name: "3차가공(바닥) - 탭가공_L", category: "가공", durationHours: 0.25 },
      { name: "립 가공_L", category: "가공", durationHours: 7.0 },
      { name: "공정검사(가공)", category: "가공", durationHours: 1.5 },
      { name: "1차가공(경면부) - 면삭_U", category: "가공", durationHours: 0.33 },
      { name: "1차가공(경면부) - 유로가공_U", category: "가공", durationHours: 20.0 },
      { name: "1차가공(경면부) - 드릴가공_U", category: "가공", durationHours: 3.0 },
      { name: "1차가공(경면부) - 단차가공_U", category: "가공", durationHours: 0.5 },
      { name: "1차가공(경면부) - 모따기 작업_U", category: "가공", durationHours: 0.5 },
      { name: "1차가공(경면부) - 탭가공_U", category: "가공", durationHours: 0.08 },
      { name: "1차가공(경면부) - 사이드 가공_U", category: "가공", durationHours: 1.5 },
      { name: "2차가공(외면) - 면삭_U", category: "가공", durationHours: 0.33 },
      { name: "2차가공(외면) - 드릴가공_U", category: "가공", durationHours: 1.0 },
      { name: "2차가공(외면) - C'BORE_U", category: "가공", durationHours: 1.5 },
      { name: "2차가공(외면) - 모따기 작업_U", category: "가공", durationHours: 0.5 },
      { name: "2차가공(외면) - 탭가공_U", category: "가공", durationHours: 0.5 },
      { name: "3차가공(바닥) - 드릴가공_U", category: "가공", durationHours: 1.5 },
      { name: "3차가공(바닥) - KEY가공_U", category: "가공", durationHours: 0.5 },
      { name: "3차가공(바닥) - 모따기 작업_U", category: "가공", durationHours: 0.5 },
      { name: "3차가공(바닥) - 탭가공_U", category: "가공", durationHours: 0.5 },
      { name: "립 가공_U", category: "가공", durationHours: 7.0 },
      { name: "립 - 카바 고정용 탭 가공_U", category: "가공", durationHours: 1.0 },
      { name: "조절볼트 가공", category: "가공", durationHours: 15.0 },
      { name: "공정검사(가공)", category: "가공", durationHours: 1.0 },
      { name: "래핑", category: "외주", durationHours: 72.0 },
      { name: "탈자", category: "연마", durationHours: 1.0 },
      { name: "황삭연마", category: "연마", durationHours: 6.0 },
      { name: "1차 조립", category: "연마", durationHours: 1.0 },
      { name: "1차 조립연마(립)", category: "연마", durationHours: 1.0 },
      { name: "1차 조립연마(직각)", category: "연마", durationHours: 4.0 },
      { name: "1차 조립연마(립)", category: "연마", durationHours: 1.0 },
      { name: "1차 조립연마(각도)", category: "연마", durationHours: 3.0 },
      { name: "분해", category: "연마", durationHours: 0.5 },
      { name: "공정검사(연마)", category: "연마", durationHours: 1.5 },
      { name: "후가공-각인_U", category: "가공", durationHours: 6.0 },
      { name: "후가공-핀가공_L", category: "가공", durationHours: 1.5 },
      { name: "중삭연마", category: "연마", durationHours: 3.0 },
      { name: "정삭연마", category: "연마", durationHours: 5.0 },
      { name: "탈자", category: "연마", durationHours: 1.0 },
      { name: "경면연마", category: "연마", durationHours: 16.0 },
      { name: "탈자", category: "연마", durationHours: 1.0 },
      { name: "3차원측정, 조도측정", category: "품질", durationHours: 2.5 },
      { name: "세척", category: "품질", durationHours: 2.0 },
      { name: "3차원측정(에이징4h)", category: "품질", durationHours: 6.0 },
      { name: "2차조립", category: "품질", durationHours: 2.0 },
      { name: "3차원측정", category: "품질", durationHours: 1.5 },
      { name: "측면연마", category: "연마", durationHours: 6.0 },
      { name: "3차원 측정", category: "품질", durationHours: 1.0 },
      { name: "2차 조립연마(직각)", category: "연마", durationHours: 3.0 },
      { name: "3차원측정(에이징4h)", category: "연마", durationHours: 4.5 },
      { name: "립 중삭연마", category: "연마", durationHours: 3.0 },
      { name: "각도연마(립)", category: "연마", durationHours: 4.0 },
      { name: "경면연마(립)", category: "연마", durationHours: 3.0 },
      { name: "3차원측정(에이징4h)", category: "품질", durationHours: 4.5 },
      { name: "분해", category: "품질", durationHours: 1.0 },
      { name: "세척", category: "품질", durationHours: 2.0 },
      { name: "탈자", category: "품질", durationHours: 1.0 },
      { name: "3차원측정(에이징4h)", category: "품질", durationHours: 6.0 },
      { name: "립 래핑", category: "품질", durationHours: 1.0 },
      { name: "광학검사", category: "품질", durationHours: 1.0 },
      { name: "최종조립", category: "품질", durationHours: 3.0 },
      { name: "3차원 측정", category: "품질", durationHours: 1.0 },
      { name: "3차원 측정(형상치수)", category: "품질", durationHours: 1.0 },
      { name: "광학검사", category: "품질", durationHours: 1.0 },
      { name: "조절볼트 조립", category: "품질", durationHours: 4.0 },
      { name: "부품류 조립", category: "품질", durationHours: 2.0 },
      { name: "포장 및 납품준비", category: "품질", durationHours: 1.0 }
    ]
  },
  "TYPE_STD_CARBIDE_2P": {
    id: "TYPE_STD_CARBIDE_2P",
    isReference: true,
    name: "표준폭 초경 2P 공정",
    processes: [
      { name: "소재 절단", category: "외주", durationHours: 48.0 },
      { name: "열처리", category: "외주", durationHours: 96.0 },
      { name: "소재 각가공", category: "외주", durationHours: 3.0 },
      { name: "1차가공(외면) - 면삭_L", category: "가공", durationHours: 0.33 },
      { name: "1차가공(외면) - 드릴가공_L", category: "가공", durationHours: 0.5 },
      { name: "1차가공(외면) - 주입구 홀 / 단차_L", category: "가공", durationHours: 2.0 },
      { name: "1차가공(외면) - 모따기 작업_L", category: "가공", durationHours: 0.25 },
      { name: "1차가공(외면) - 탭가공_L", category: "가공", durationHours: 0.25 },
      { name: "1차가공(외면) - 사이드 가공_L", category: "가공", durationHours: 1.5 },
      { name: "2차가공(경면부) - 면삭_L", category: "가공", durationHours: 0.33 },
      { name: "2차가공(경면부) - 유로가공_L", category: "가공", durationHours: 20.0 },
      { name: "2차가공(경면부) - 드릴가공_L", category: "가공", durationHours: 2.0 },
      { name: "2차가공(경면부) - 단차가공(밀어내기)_L", category: "가공", durationHours: 0.17 },
      { name: "2차가공(경면부) - 모따기 작업_L", category: "가공", durationHours: 0.33 },
      { name: "2차가공(경면부) - 탭가공_L", category: "가공", durationHours: 1.0 },
      { name: "3차가공(바닥) - 드릴가공_L", category: "가공", durationHours: 1.5 },
      { name: "3차가공(바닥) - KEY가공_L", category: "가공", durationHours: 0.5 },
      { name: "3차가공(바닥) - 모따기 작업_L", category: "가공", durationHours: 0.67 },
      { name: "3차가공(바닥) - 탭가공_L", category: "가공", durationHours: 0.25 },
      { name: "립 가공_L", category: "가공", durationHours: 7.0 },
      { name: "공정검사(가공)", category: "가공", durationHours: 1.5 },
      { name: "1차가공(경면부) - 면삭_U", category: "가공", durationHours: 0.33 },
      { name: "1차가공(경면부) - 유로가공_U", category: "가공", durationHours: 20.0 },
      { name: "1차가공(경면부) - 드릴가공_U", category: "가공", durationHours: 3.0 },
      { name: "1차가공(경면부) - 단차가공_U", category: "가공", durationHours: 0.5 },
      { name: "1차가공(경면부) - 모따기 작업_U", category: "가공", durationHours: 0.5 },
      { name: "1차가공(경면부) - 탭가공_U", category: "가공", durationHours: 0.08 },
      { name: "1차가공(경면부) - 사이드 가공_U", category: "가공", durationHours: 1.5 },
      { name: "2차가공(외면) - 면삭_U", category: "가공", durationHours: 0.33 },
      { name: "2차가공(외면) - 드릴가공_U", category: "가공", durationHours: 1.0 },
      { name: "2차가공(외면) - C'BORE_U", category: "가공", durationHours: 1.5 },
      { name: "2차가공(외면) - 모따기 작업_U", category: "가공", durationHours: 0.5 },
      { name: "2차가공(외면) - 탭가공_U", category: "가공", durationHours: 0.5 },
      { name: "3차가공(바닥) - 드릴가공_U", category: "가공", durationHours: 1.5 },
      { name: "3차가공(바닥) - KEY가공_U", category: "가공", durationHours: 0.5 },
      { name: "3차가공(바닥) - 모따기 작업_U", category: "가공", durationHours: 0.5 },
      { name: "3차가공(바닥) - 탭가공_U", category: "가공", durationHours: 0.5 },
      { name: "립 가공_U", category: "가공", durationHours: 7.0 },
      { name: "립 - 카바 고정용 탭 가공_U", category: "가공", durationHours: 1.0 },
      { name: "조절볼트 가공", category: "가공", durationHours: 15.0 },
      { name: "공정검사(가공)", category: "가공", durationHours: 1.0 },
      { name: "래핑 (하판)", category: "외주", durationHours: 24.0 },
      { name: "자력제거 (탈자)", category: "연마", durationHours: 0.5 },
      { name: "황삭연마", category: "연마", durationHours: 3.0 },
      { name: "1차 조립", category: "연마", durationHours: 0.5 },
      { name: "1차 조립연마(립)", category: "연마", durationHours: 0.5 },
      { name: "1차 조립연마 (직각)", category: "연마", durationHours: 1.0 },
      { name: "분해", category: "연마", durationHours: 0.5 },
      { name: "정삭연마(초경 조립부 단차 포함)", category: "연마", durationHours: 8.0 },
      { name: "3차원 측정", category: "품질", durationHours: 1.0 },
      { name: "조립(초경 립 조립)", category: "연마", durationHours: 12.0 },
      { name: "평면 경면연마(단차 포함)", category: "연마", durationHours: 10.0 },
      { name: "3차원 측정", category: "품질", durationHours: 1.0 },
      { name: "광학검사", category: "품질", durationHours: 1.0 },
      { name: "세척", category: "품질", durationHours: 1.0 },
      { name: "조립 및 측정", category: "품질", durationHours: 1.0 },
      { name: "메꾸미 작업(초경 조립 BOLT부)_U,L", category: "연마", durationHours: 1.0 },
      { name: "측면연마", category: "연마", durationHours: 5.0 },
      { name: "측정 및 조립", category: "품질", durationHours: 1.0 },
      { name: "2차 조립연마(립 중삭)", category: "연마", durationHours: 0.5 },
      { name: "2차 조립연마(직각)", category: "연마", durationHours: 1.0 },
      { name: "립 각도 경면연마(각도)", category: "연마", durationHours: 4.0 },
      { name: "립 경면연마(R 연마)", category: "연마", durationHours: 5.0 },
      { name: "립 래핑", category: "연마", durationHours: 0.5 },
      { name: "광학현미경 검사 및 R측정", category: "품질", durationHours: 1.0 },
      { name: "분해 및 조립", category: "품질", durationHours: 1.0 },
      { name: "립 단차연마", category: "연마", durationHours: 4.0 },
      { name: "분해 및 세척", category: "품질", durationHours: 1.0 },
      { name: "조립", category: "품질", durationHours: 2.0 },
      { name: "광학검사 및 측정", category: "품질", durationHours: 1.0 },
      { name: "분해 및 조립", category: "품질", durationHours: 1.0 },
      { name: "립 각도 경면연마", category: "연마", durationHours: 4.0 },
      { name: "광학검사", category: "품질", durationHours: 0.5 },
      { name: "분해 및 세척", category: "품질", durationHours: 1.0 },
      { name: "립 래핑", category: "품질", durationHours: 0.5 },
      { name: "자력제거 (탈자)", category: "품질", durationHours: 0.5 },
      { name: "조립", category: "품질", durationHours: 1.0 },
      { name: "광학검사", category: "품질", durationHours: 1.0 },
      { name: "포장 및 납품준비", category: "품질", durationHours: 1.0 }
    ]
  }
};

export function isHolidayOrWeekend(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return true;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return HOLIDAYS_2026.includes(`${yyyy}-${mm}-${dd}`);
}

export function addWorkingHours(startDate: Date, hoursToAdd: number): Date {
  let curr = new Date(startDate);
  let remainingMinutes = Math.round(hoursToAdd * 60);

  while (remainingMinutes > 0) {
    if (isHolidayOrWeekend(curr)) {
      curr.setDate(curr.getDate() + 1);
      curr.setHours(8, 30, 0, 0);
      continue;
    }

    const h = curr.getHours();
    const m = curr.getMinutes();
    const timeInMins = h * 60 + m;

    const workStart = 8 * 60 + 30; // 08:30
    const lunchStart = 12 * 60; // 12:00
    const lunchEnd = 13 * 60; // 13:00
    const dinnerStart = 17 * 60; // 17:00
    const dinnerEnd = 17 * 60 + 30; // 17:30
    const workEnd = 20 * 60 + 30; // 20:30

    if (timeInMins < workStart) {
      curr.setHours(8, 30, 0, 0);
      continue;
    }
    if (timeInMins >= lunchStart && timeInMins < lunchEnd) {
      curr.setHours(13, 0, 0, 0);
      continue;
    }
    if (timeInMins >= dinnerStart && timeInMins < dinnerEnd) {
      curr.setHours(17, 30, 0, 0);
      continue;
    }
    if (timeInMins >= workEnd) {
      curr.setDate(curr.getDate() + 1);
      curr.setHours(8, 30, 0, 0);
      continue;
    }

    let nextBreak = workEnd;
    if (timeInMins < lunchStart) nextBreak = lunchStart;
    else if (timeInMins < dinnerStart) nextBreak = dinnerStart;

    let availableMins = nextBreak - timeInMins;

    if (remainingMinutes <= availableMins) {
      curr.setMinutes(curr.getMinutes() + remainingMinutes);
      remainingMinutes = 0;
    } else {
      curr.setMinutes(curr.getMinutes() + availableMins);
      remainingMinutes -= availableMins;
    }
  }

  return curr;
}

export const INITIAL_ORDERS: Record<string, import('../types').Order> = {
  "ORD-2026-001": {
    id: "ORD-2026-001",
    name: "삼성디스플레이 OLED 8.6세대 슬릿 노즐 라인",
    typeId: "TYPE_SLIT_NOZZLE",
    qty: 2,
    startDate: "2026-03-02T08:30",
    workWindow: "ALL_DAY",
    mctMachine: "MCT 12호기 #1",
    memo: "초경 립 정밀 래핑 및 3차원 측정 결과 첨부 필요",
    customer: "삼성디스플레이",
    poNumber: "SDC-2026-SN-08",
    partName: "8.6G Ultra Slit Nozzle Die",
    partType: "UPPER (상판)",
    spec: "1850L",
    serialNo: "SDC-2026-SN-08-001~002",
    dueDate: "2026-06-30",
    specialNotes: "※ 공정 간 인수인계 철저히 할 것! (립 경면도 2um 이하 준수)",
    writerName: "생산관리팀",
    reviewerName: "제조팀장",
    approverName: "공장장"
  },
  "ORD-2026-002": {
    id: "ORD-2026-002",
    name: "LG디스플레이 2000mm 광폭 3P 다이",
    typeId: "TYPE_WIDE_3P",
    qty: 1,
    startDate: "2026-03-05T08:30",
    workWindow: "ALL_DAY",
    mctMachine: "MCT 7.5호기 #1",
    memo: "35도 경사면 가공 시 진직도 0.002mm 이하 유지",
    customer: "LG디스플레이",
    poNumber: "LGD-WP-2000-02",
    partName: "2000mm Precision 3P Slot Die",
    partType: "BODY (몸체)",
    spec: "2000mm",
    serialNo: "LGD-WP-2000-02-001",
    dueDate: "2026-07-15",
    specialNotes: "※ 35도 경사면 가공 시 진직도 0.002mm 이하 유지 및 CMM 측정 필수",
    writerName: "생산기술팀",
    reviewerName: "품질보증팀",
    approverName: "총괄임원"
  },
  "ORD-2026-003": {
    id: "ORD-2026-003",
    name: "SK온 2차전지 전극 코팅용 광폭 2P",
    typeId: "TYPE_WIDE_2P",
    qty: 3,
    startDate: "2026-03-10T08:30",
    workWindow: "ALL_DAY",
    mctMachine: "MCT 6.5호기 #1",
    memo: "외주 열처리 및 래핑 일정 사전 확인 완료",
    customer: "SK온",
    poNumber: "SKON-BATT-26-03",
    partName: "2P Electrode Coating Die",
    partType: "LOWER (하판)",
    spec: "1500L",
    serialNo: "SKON-BATT-26-03-001~003",
    dueDate: "2026-08-10",
    specialNotes: "※ 외주 열처리 후 응력 제거 확인 및 공정 이동표 상시 부착",
    writerName: "생산관리팀",
    reviewerName: "제조기술팀",
    approverName: "품질책임자"
  },
  "ORD-2026-PNT": {
    id: "ORD-2026-PNT",
    name: "PNT Flex Bolt 2P SLOT DIE 상판",
    typeId: "TYPE_SLIT_NOZZLE",
    qty: 1,
    startDate: "2026-03-01T08:30",
    workWindow: "ALL_DAY",
    mctMachine: "MCT 6.5호기 #1",
    memo: "※ 공정 간 인수인계 철저히 할 것!",
    customer: "PNT",
    poNumber: "PNT-BNSH650L-26-02",
    partName: "Flex Bolt 2P SLOT DIE",
    partType: "UPPER (상판)",
    spec: "650L",
    serialNo: "PNT-BNSH650L-26-02-001",
    dueDate: "2026-06-30",
    specialNotes: "※ 공정 간 인수인계 철저히 할 것!",
    writerName: "작성자",
    reviewerName: "검토자",
    approverName: "승인자"
  }
};

export const INITIAL_PROCESS_PROGRESS: import('../types').ProcessProgressMap = {
  "ORD-2026-001_Q1_P0": {
    isCompleted: true,
    completedAt: "8월 5일 17:30",
    worker: "미지정",
    machine: "(외주/협력사)"
  },
  "ORD-2026-001_Q1_P1": {
    isCompleted: true,
    completedAt: "8월 9일 12:00",
    worker: "미지정",
    machine: "(외주/협력사)"
  },
  "ORD-2026-001_Q1_P2": {
    isCompleted: true,
    completedAt: "8월 11일 18:00",
    worker: "미지정",
    machine: "(외주/협력사)"
  },
  "ORD-2026-001_Q2_P0": {
    isCompleted: true,
    completedAt: "8월 5일 17:30",
    worker: "미지정",
    machine: "(외주/협력사)"
  },
  "ORD-2026-001_Q2_P1": {
    isCompleted: true,
    completedAt: "8월 9일 12:00",
    worker: "미지정",
    machine: "(외주/협력사)"
  },
  "ORD-2026-001_Q2_P2": {
    isCompleted: true,
    completedAt: "8월 11일 18:00",
    worker: "미지정",
    machine: "(외주/협력사)"
  }
};

