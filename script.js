//-------------------------------------------------------------
// 0. 전역 변수
//-------------------------------------------------------------
let map;                    
let libraryData = [];       
let boundCircle = null;     
let markers = [];           

//-------------------------------------------------------------
// 1. 초기 실행
//-------------------------------------------------------------
window.onload = function () {
    initMap();
    initEvents();
    loadLibraryData();
};

//-------------------------------------------------------------
// 2. Kakao 지도 생성
//-------------------------------------------------------------
function initMap() {
    const mapContainer = document.getElementById("map");

    map = new kakao.maps.Map(mapContainer, {
        center: new kakao.maps.LatLng(37.5665, 126.9780),
        level: 8
    });

    const zoomControl = new kakao.maps.ZoomControl();
    map.addControl(zoomControl, kakao.maps.ControlPosition.RIGHT);
}

//-------------------------------------------------------------
// 3. 이벤트 연결
//-------------------------------------------------------------
function initEvents() {
    document.getElementById("searchBtn").addEventListener("click", searchGu);
}

//-------------------------------------------------------------
// 4. 전체 도서관 데이터 로딩
//-------------------------------------------------------------

async function loadLibraryData() {
    for (let i = 1; i <= 16000; i += 1000) {

        // Node Proxy 서버로 요청
        const apiKey = "4749635377646f6f34316344624e4b";  
        const url = `/api/library?start=${i}&end=${i + 999}`;

        try {
            const res = await fetch(url);
            const json = await res.json();

            if (json.SeoulPublicLibraryInfo && json.SeoulPublicLibraryInfo.row) {
                libraryData = libraryData.concat(json.SeoulPublicLibraryInfo.row);
            }

        } catch (e) {
            console.log("API 오류:", e);
        }
    }

    console.log("총 로딩된 도서관 수:", libraryData.length);
}

//-------------------------------------------------------------
// 5. 구 검색 → 지도 이동, 원 표시, 반경 내 도서관 표시
//-------------------------------------------------------------
function searchGu() {

    const guSelect = document.getElementById("gu");
    const guName = guSelect.value;
    const index = guSelect.selectedIndex;

    const locations = [
        [37.4968488, 127.0679394],[37.5492994, 127.1464275],
        [37.6482131, 127.0164069],[37.552593, 126.85051],
        [37.4654529, 126.9442478],[37.5388, 127.083445],
        [37.495765, 126.8578697],[37.4599896, 126.9012665],
        [37.6541956, 127.0769692],[37.6662325, 127.0298724],
        [37.5835755, 127.0505528],[37.4971121, 126.944378],
        [37.5615964, 126.9086431],[37.583312, 126.9356601],
        [37.483574, 127.032661],[37.5508768, 127.0408952],
        [37.6023295, 127.025236],[37.504741, 127.1144649],
        [37.527432, 126.8558783],[37.525423, 126.896395],
        [37.5305208, 126.9809672],[37.6175107, 126.9249166],
        [37.6009106, 126.9835817],[37.5576747, 126.9941653],
        [37.5950497, 127.0957062]
    ];

    const pos = new kakao.maps.LatLng(locations[index][0], locations[index][1]);

    map.setCenter(pos);
    map.setLevel(6);

    drawBoundCircle(pos, 3000);
    showNearbyLibraries(pos, 3000);
    updateLibraryList(libraryData, guName);
}

//-------------------------------------------------------------
// 6. 중심 기준 3km 원
//-------------------------------------------------------------
function drawBoundCircle(center, radius) {

    if (boundCircle) boundCircle.setMap(null);

    boundCircle = new kakao.maps.Circle({
        center: center,
        radius: radius,
        strokeWeight: 4,
        strokeColor: "#F7D358",
        strokeOpacity: 0.8,
        strokeStyle: "solid",
        fillColor: "#F7FE2E",
        fillOpacity: 0.3,
        zIndex: 1
    });

    boundCircle.setMap(map);
}

//-------------------------------------------------------------
// 7. 반경 내 도서관 마커 표시
//-------------------------------------------------------------
function showNearbyLibraries(center, radius) {

    clearMarkers();

    libraryData.forEach(lib => {

        const lat = parseFloat(lib.XCNTS);
        const lng = parseFloat(lib.YDNTS);

        if (isNaN(lat) || isNaN(lng)) return;

        const pos = new kakao.maps.LatLng(lat, lng);
        const dist = computeDistance(center, pos);

        if (dist <= radius) {

            const markerImage = new kakao.maps.MarkerImage(
                "/images/marker1.png",
                new kakao.maps.Size(32, 32),
                { offset: new kakao.maps.Point(16, 32) }
            );

            const marker = new kakao.maps.Marker({
                position: pos,
                image: markerImage,
                map: map
            });

            markers.push(marker);

            const info = new kakao.maps.InfoWindow({
                content: `
                    <div class="card shadow-lg border-0" style="width: 260px;">
                        <div class="card-body p-2" style="background:#0d6efd; color:white; border-radius:5px;">
                            <h6 class="card-title fw-bold mb-1">${lib.LBRRY_NAME}</h6>
                            <p class="mb-1" style="font-size:12px;"><b>주소:</b> ${lib.ADRES}</p>
                            <p class="mb-1" style="font-size:12px;"><b>전화번호:</b> ${lib.TEL_NO}</p>
                            <p class="mb-0" style="font-size:12px;"><b>휴관일:</b>
                                <span style="color:#ff0000;">${lib.FDRM_CLOSE_DATE}</span>
                            </p>
                        </div>
                    </div>
                `
            });

            kakao.maps.event.addListener(marker, "click", () => {
                info.open(map, marker);
            });
        }
    });
}

//-------------------------------------------------------------
// 8. 기존 마커 삭제
//-------------------------------------------------------------
function clearMarkers() {
    markers.forEach(m => m.setMap(null));
    markers = [];
}

//-------------------------------------------------------------
// 9. Haversine 거리 계산
//-------------------------------------------------------------
function computeDistance(center, pos) {

    const R = 6371e3;

    const lat1 = center.getLat() * Math.PI / 180;
    const lat2 = pos.getLat() * Math.PI / 180;

    const dLat = (pos.getLat() - center.getLat()) * Math.PI / 180;
    const dLng = (pos.getLng() - center.getLng()) * Math.PI / 180;

    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLng / 2) ** 2;

    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

//-------------------------------------------------------------
// 10. 도서관 목록 업데이트
//-------------------------------------------------------------
function updateLibraryList(libraryData, selectedGu) {

    let librariesDiv = document.getElementById("libraries");
    librariesDiv.innerHTML = "";

    for (let i = 0; i < libraryData.length; i++) {

        let lib = libraryData[i];
        if (lib.CODE_VALUE !== selectedGu) continue;

        let div = document.createElement("div");
        div.className = "row mb-2 " + (i % 2 === 0 ? "custom-bg-even" : "custom-bg-odd");

        let html = `[${lib.CODE_VALUE}] ${lib.LBRRY_NAME}`;

        html += ` <input type="button" class="lib-btn" value="위치" onclick="window.open('https://www.google.com/maps/search/${lib.LBRRY_NAME}')">`;

        if (lib.TEL_NO) html += `<br>📞 ${lib.TEL_NO}`;
        if (lib.ADRES) html += `<br>주소: ${lib.ADRES} (x:${lib.XCNTS} , y:${lib.YDNTS})`;
        if (lib.FDRM_CLOSE_DATE) html += `<br>휴관일: ${lib.FDRM_CLOSE_DATE}`;
        if (lib.HMPG_URL) html += `<br>홈페이지: <a href="${lib.HMPG_URL}" target="_blank">${lib.HMPG_URL}</a>`;

        div.innerHTML = html;
        librariesDiv.appendChild(div);
    }
}