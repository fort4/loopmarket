/* 요청할 뷰 이름(ViewName), 선택적 콜백 함수. HTML 삽입이 끝난 뒤 실행할 함수(callback) */
function render(viewName, callback) {
	/* HTML 조각 요청 */
	fetch(`/${viewName}`)
	    .then(res => { /* 서버가 200OK를 응답하지 않을 시 에러 발생시킴 */
	        if (!res.ok) throw new Error("404 Not Found");
	        return res.text(); /* 정상 응답이면 .text()로 HTML 문자열 가져옴 */
	    })
	    .then(html => { /* 받아온 HTML을 #main-content 영역에 삽입 */
	        document.getElementById("main-content").innerHTML = html;
	        if (callback) callback(); /* 콜백이 있다면 호출 */
	    })
	    .catch(err => {
	        document.getElementById("main-content").innerHTML = "<p>페이지를 불러오지 못했습니다.</p>";
	        console.error(err);
			/* 요청 실패(404, 네트워크 오류 등) 시 에러 메시지를 본문에 출력하고 콘솔에 로깅 */
	    });
}


// 페이지 로딩 시 위치 초기화
document.addEventListener("DOMContentLoaded", function () {
  const savedDong = localStorage.getItem('selectedDong');
  if (savedDong) {
    const dongName = extractDongFromFull(savedDong);
    document.getElementById('current-location').innerText = dongName;
    document.getElementById('location-title').innerText = dongName;
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    setLocationFallback();
  }
});


// 현재 위치 요청
function getLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(success, error);
  } else {
    setLocationFallback();
  }
}

// 위치 요청 성공 시 처리
function success(position) {
  const lat = position.coords.latitude;
  const lng = position.coords.longitude;

  fetch(`https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`, {
    headers: {
      Authorization: 'KakaoAK edfdfb6dda5e9a8154d27b3e4e14350d'
    }
  })
    .then(res => res.json())
    .then(data => {
      if (!data.documents || data.documents.length === 0) {
        throw new Error("카카오 응답에 주소 데이터 없음");
      }

      const doc = data.documents[0];
      const fullDong = `${doc.region_1depth_name} ${doc.region_2depth_name} ${doc.region_3depth_name}`;
      const dongOnly = extractDongFromFull(fullDong);

      // 버튼, 문장에는 동만
      document.getElementById('current-location').innerText = dongOnly;
      document.getElementById('location-title').innerText = dongOnly;

      // 저장은 전체 주소
      localStorage.setItem('selectedDong', fullDong);

      // 모달 닫기
      const modal = bootstrap.Modal.getInstance(document.getElementById('locationModal'));
      if (modal) modal.hide();
    })
    .catch((err) => {
      console.error("카카오 API 실패", err);
      setLocationFallback();
    });
}


// 위치 요청 실패 시 fallback
function error(err) {
  console.error("위치 접근 실패", err);
  setLocationFallback();
}

// fallback 위치 기본값 사용
function setLocationFallback() {
  const fallbackDong = '서울특별시 강남구 역삼동';
  document.getElementById('current-location').innerText = fallbackDong;
  document.getElementById('location-title').innerText = extractDongFromFull(fallbackDong); // 동만 추출
  localStorage.setItem('selectedDong', fallbackDong);
}

// 모달에서 위치 선택 시 처리
function setLocation(fullLocation) {
  // 전체 주소: "부산광역시 수영구 광안동"
  const dongName = extractDongFromFull(fullLocation); // 마지막 단어 추출 (광안동)

  // 왼쪽 버튼은 전체 주소
  document.getElementById('current-location').innerText = dongName;

  // 문장 안 제목에는 동만
  document.getElementById('location-title').innerText = dongName;

  // 저장은 전체 주소로
  localStorage.setItem('selectedDong', fullLocation);

  // 모달 닫기
  const modal = bootstrap.Modal.getInstance(document.getElementById('locationModal'));
  modal.hide();
}


// 전체 주소에서 동만 추출하는 함수
function extractDongFromFull(fullLocation) {
  if (!fullLocation) return "동네";
  const parts = fullLocation.trim().split(" ");
  return parts[parts.length - 1]; // ex: 역삼동
}

// 검색어 입력 시 주소 검색
function searchOrFilterLocation() {
  const input = document.getElementById("locationSearchInput").value.trim();
  const recommendSection = document.getElementById("recommendSection");
  const resultList = document.getElementById("searchResultList");

  if (!recommendSection || !resultList) return;

  if (input.length < 2) {
    resultList.innerHTML = "<li class='list-group-item text-muted'>2글자 이상 입력해주세요.</li>";
    return;
  }

  recommendSection.classList.add("d-none");
  resultList.classList.remove("d-none");

  fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(input)}`, {
    headers: {
      Authorization: 'KakaoAK edfdfb6dda5e9a8154d27b3e4e14350d'
    }
  })
    .then(res => res.json())
    .then(data => {
      resultList.innerHTML = "";

      if (!data.documents || data.documents.length === 0) {
        const li = document.createElement("li");
        li.className = "list-group-item text-muted";
        li.textContent = "검색 결과가 없습니다.";
        resultList.appendChild(li);
        return;
      }

      const dongSet = new Set();

      data.documents.forEach(doc => {
        const full = doc.address_name;
        if (!full) return;

        const dong = extractAdminUnit(full);
        if (!dong || /\d/.test(dong) || dong.length < 2) return;

        const parts = full.split(" ");
        const displayText = `${parts[0]} ${parts[1]} ${dong}`;

        const li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = displayText;
        li.onclick = () => setLocation(displayText);
        resultList.appendChild(li);
      });

      if (dongSet.size === 0) {
        const li = document.createElement("li");
        li.className = "list-group-item text-muted";
        li.textContent = "검색 결과가 없습니다.";
        resultList.appendChild(li);
      }
    })
    .catch(err => {
      console.error("주소 검색 실패:", err);
    });
}



// 주소 문자열에서 동/읍/면 단위 추출 (보조용)
function extractDongFromFull(fullAddress) {
  if (!fullAddress) return "동네";

  const words = fullAddress.trim().split(/\s+/).reverse();

  // 우선 동/읍/면 우선 추출
  for (const word of words) {
    if (word.endsWith("동") || word.endsWith("읍") || word.endsWith("면")) {
      return word;
    }
  }

  // 동/읍/면이 없는 경우: 숫자(-) 안 들어간 가장 마지막 행정단위 추출
  for (const word of words) {
    if (!/\d/.test(word) && !word.includes("-")) {
      return word;
    }
  }

  // 그래도 없으면 fallback
  return words[0];
}

// 주소에서 '동', '읍', '면' 추출용 보조 함수
function extractAdminUnit(fullAddress) {
  if (!fullAddress) return "동네";

  const excludeWords = [
    "서울", "부산", "광주", "대전", "인천", "세종", "대구", "울산",
    "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"
  ];

  const words = fullAddress.trim().split(/\s+/).reverse();

  // 동/읍/면
  for (const word of words) {
    if ((word.endsWith("동") || word.endsWith("읍") || word.endsWith("면")) && word.length > 1) {
      return word;
    }
  }

  // 그 외 숫자/번지 제외, 광역시/도 제외
  for (const word of words) {
    if (
      !/\d/.test(word) &&
      !word.includes("-") &&
      word.length > 1 &&
      !word.endsWith("구") &&
      !excludeWords.includes(word)
    ) {
      return word;
    }
  }

  // 마지막 fallback: 어쨌든 무조건 하나는 돌려줌
  return words[0];
}





function cleanAddress(fullAddress) {
  if (!fullAddress) return "";

  const words = fullAddress.trim().split(/\s+/);

  // 최소 3단계까지 자르기 (예: 서울 용산구 이태원동)
  const filtered = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    filtered.push(word);

    if (word.endsWith("동") || word.endsWith("읍") || word.endsWith("면") || word.endsWith("로") || word.endsWith("구")) {
      // 여기서 '구' 포함하면 "서울 용산구"까지만도 허용 가능
      break;
    }
  }

  return filtered.join(" ");
}



// 엔터 키 입력 시 검색 실행
function handleLocationKey(event) {
  if (event.key === "Enter") {
    searchOrFilterLocation();
  }
}






