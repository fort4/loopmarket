// 이미지 슬라이드 좌우 버튼 클릭 시 이미지 이동 함수
function slideImage(button, direction) {
  const wrapper = button.closest(".position-relative").parentElement; // wrapper 바꿈
  const track = wrapper.querySelector(".slider-track");
  if (!track) return;

  const total = parseInt(track.dataset.count);
  if (!track.dataset.index) track.dataset.index = "0";
  let currentIndex = parseInt(track.dataset.index);

  const newIndex = Math.max(0, Math.min(total - 1, currentIndex + direction));
  track.dataset.index = newIndex;
  track.style.transform = `translateX(-${(100 / total) * newIndex}%)`;

  // dot 강조 업데이트
  const dots = wrapper.querySelectorAll(".dot");
  dots.forEach((dot, idx) => {
    dot.style.opacity = idx === newIndex ? "1" : "0.4";
  });
}

// 페이지 처음 로드 시 dot 초기화
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".slider-track").forEach(track => {
    const dots = track.closest(".col-md-6").querySelectorAll(".dot");
    if (dots.length > 0) dots[0].style.opacity = "1";
    track.dataset.index = "0";
  });
});

window.slideImage = slideImage; // 전역에 등록

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".slider-track").forEach(track => {
    const dots = track.closest(".position-relative").querySelectorAll(".dot");
    if (dots.length > 0) dots[0].style.opacity = "1";
    track.dataset.index = "0";
  });
});


document.addEventListener("DOMContentLoaded", () => {
  // ---------------- 가격 입력 관련 ----------------
  const priceDisplay = document.getElementById("priceDisplay"); // 사용자 화면에 보여줄 가격 입력란
  const priceInput = document.getElementById("priceInput");     // 실제 서버로 전송할 가격 값 숨김 필드
  const saleRadio = document.getElementById("sale");            // 판매 라디오 버튼
  const donationRadio = document.getElementById("donation");    // 기부 라디오 버튼

  let lastPriceValue = ''; // 마지막 정상 가격값 저장용

  const buttons = document.querySelectorAll(".btn-group-vertical .btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      // 모든 버튼에서 active 제거
      buttons.forEach(b => b.classList.remove("active"));

      // 클릭한 버튼에 active 추가
      btn.classList.add("active");

      // 페이지 이동
      const value = btn.dataset.value;
      if (!value) {
        window.location.href = "/products";
      } else {
        window.location.href = `/products?category=${value}`;
      }
    });
  });

  //open ai 서비스 이용
  document.getElementById("aiGenerateBtn").addEventListener("click", async () => {
    if (selectedFiles.length === 0) {
      alert("이미지를 먼저 업로드해주세요.");
      return;
    }

    const aiBtn = document.getElementById("aiGenerateBtn");
    aiBtn.disabled = true;
    aiBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> AI로 작성중 입니다.`;

    try {
      const uploadedImageUrls = [];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("image", file);

        const uploadRes = await fetch("/api/upload/temp", {
          method: "POST",
          body: formData,
        });

        const { imageUrl } = await uploadRes.json();
        uploadedImageUrls.push(imageUrl);
      }

      // GPT 호출
      const aiRes = await fetch("/api/products/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: uploadedImageUrls })
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        throw new Error("GPT 응답 오류: " + errText);
      }

      const result = await aiRes.json();
      document.querySelector("input[name='title']").value = result.title;
      document.querySelector("textarea[name='description']").value = result.description.replace(/\\n/g, "\n");


      // 카테고리 자동 반영
      const ctgCode = result.ctgCode;
      const categoryToMainMap = {
        27: 5,
        12: 2,
        8: 1
      };

      const mainCode = categoryToMainMap[ctgCode];
      const mainSelect = document.getElementById("main-category");
      const subSelect = document.getElementById("sub-category");

      if (mainCode && mainSelect && subSelect) {
        mainSelect.value = mainCode;
        mainSelect.dispatchEvent(new Event("change"));

        setTimeout(() => {
          const option = subSelect.querySelector(`option[value="${ctgCode}"]`);
          if (option) {
            subSelect.value = ctgCode;
          } else {
            console.warn("소분류 옵션이 아직 준비되지 않았습니다:", ctgCode);
          }
        }, 300);
      }

    } catch (err) {
      alert("⚠ 오류 발생: " + err.message);
      console.error(err);
    } finally {
      // 분석 끝났을 때 버튼 복구
      aiBtn.disabled = false;
      aiBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2 d-none" id="aiSpinner" role="status" aria-hidden="true"></span>작성 완료`;
    }
  });

  function handleCategoryChange(e) {
    const selectedMain = e.target.value;
    // 이후 원하는 동작을 넣거나 아무것도 안해도 기본 오류는 안 나
    console.log("대분류 선택됨:", selectedMain);
  }
  window.handleCategoryChange = handleCategoryChange;


// 가격 필터 버튼 클릭 함수
  function filterByPrice(min, max) {
    const url = new URL(window.location.href);
    url.searchParams.set("minPrice", min);
    url.searchParams.set("maxPrice", max);
    window.location.href = url.toString();
  }

// 직접 입력한 가격 적용
  function applyPriceRange() {
    const min = document.getElementById("minPrice").value || 0;
    const max = document.getElementById("maxPrice").value || 0;

    const url = new URL(window.location.href);
    url.searchParams.set("minPrice", min);
    url.searchParams.set("maxPrice", max);
    window.location.href = url.toString();
  }

  // 페이지 로드 시 가격 필터 active 표시
  const urlParams = new URLSearchParams(window.location.search);
  const min = urlParams.get("minPrice");
  const max = urlParams.get("maxPrice");

  document.querySelectorAll("button[data-min][data-max]").forEach(btn => {
    const btnMin = btn.getAttribute("data-min");
    const btnMax = btn.getAttribute("data-max");

    if (btnMin === min && btnMax === max) {
      btn.classList.add("active");
    }
  });

  //가격초기화
  function resetPriceFilter() {
    const url = new URL(window.location.href);
    url.searchParams.delete("minPrice");
    url.searchParams.delete("maxPrice");
    window.location.href = url.toString();
  }

  window.resetPriceFilter = resetPriceFilter;



// ✅ 버튼에서 호출할 수 있게 등록
  window.filterByPrice = filterByPrice;
  window.applyPriceRange = applyPriceRange;



  // 초기 점(dot) 표시: 첫 점만 진하게
  document.querySelectorAll(".card").forEach(card => {
    const dots = card.querySelectorAll(".dot");
    if (dots.length > 0) dots[0].style.opacity = "1";

    const track = card.querySelector(".slider-track");
    if (track) track.dataset.index = "0"; // 슬라이드 초기 인덱스 0 설정
  });

  // 숫자를 ₩ 포맷(₩ 1,000)으로 변환하는 함수
  function formatCurrency(value) {
    return "₩ " + Number(value).toLocaleString();
  }

  // 판매/기부 라디오 선택에 따라 가격 입력 필드 활성화 토글
  function togglePriceField() {
    if (donationRadio.checked) {
      lastPriceValue = priceInput.value;  // 이전 가격 저장
      priceDisplay.disabled = true;       // 가격 입력 비활성화
      priceDisplay.value = "₩ 0";         // 가격 0원 표시
      priceInput.value = 0;
      priceDisplay.classList.add("bg-light"); // 비활성화 스타일 추가
    } else {
      priceDisplay.disabled = false;      // 가격 입력 활성화
      priceDisplay.classList.remove("bg-light"); // 스타일 제거
      priceInput.value = lastPriceValue || '';
      priceDisplay.value = lastPriceValue ? formatCurrency(lastPriceValue) : '';
    }
  }

  // 가격 입력란에 숫자 외 입력 차단 및 포맷 적용
  priceDisplay.addEventListener("input", (e) => {
    let raw = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 남기기
    if (raw.length > 9) raw = raw.slice(0, 9);       // 최대 9자리 제한
    priceDisplay.value = raw ? formatCurrency(raw) : '';
    priceInput.value = raw;
    lastPriceValue = raw;
  });

  // 초기 토글 실행 및 라디오 변경 이벤트 연결
  togglePriceField();
  saleRadio.addEventListener("change", togglePriceField);
  donationRadio.addEventListener("change", togglePriceField);

  // ---------------- 상품 상태 슬라이더 처리 ----------------
  const conditionSlider = document.getElementById("conditionScore"); // 상태 점수 슬라이더
  const conditionText = document.getElementById("conditionText");    // 상태 설명 텍스트
  const conditionHidden = document.getElementById("conditionTextValue"); // 상태 값 숨김 필드
  const conditionPercent = document.getElementById("conditionPercent");  // 상태 점수 %

  // 슬라이더 움직일 때 상태 텍스트, 값, % 업데이트
  conditionSlider.addEventListener("input", () => {
    const score = parseInt(conditionSlider.value);
    let text = "", status = "";

    if (score <= 14) {
      text = "🔧 수리가 필요해요";
      status = "NEEDS_REPAIR";
    } else if (score <= 30) {
      text = "⚠ 상태가 좋지 않아요";
      status = "BAD";
    } else if (score <= 69) {
      text = "👣 사용감 있어요";
      status = "USED";
    } else if (score <= 80) {
      text = "👍 중고지만, 상태 좋아요";
      status = "GOOD";
    } else if (score <= 94) {
      text = "✨ 거의 새 거예요";
      status = "ALMOST_NEW";
    } else {
      text = "🆕 새 상품이에요";
      status = "NEW";
    }
    conditionText.textContent = text;
    conditionHidden.value = status; // 여기만 영문으로 바꿔줘야 함


    conditionText.textContent = text;
    conditionHidden.value = status;
    conditionPercent.textContent = score + "%";
  });

  // ---------------- 희망 거래 방식 (위치/택배비) ----------------
  const isDirect = document.getElementById("isDirect");       // 직접 거래 라디오
  const isDelivery = document.getElementById("isDelivery");   // 택배 거래 라디오
  const isNonface = document.getElementById("isNonface");     // 비대면 거래 라디오
  const locationGroup = document.getElementById("locationGroup");       // 위치 입력 그룹
  const shippingFeeGroup = document.getElementById("shippingFeeGroup"); // 배송비 입력 그룹

  // 거래 방식에 따라 위치, 배송비 입력란 표시 토글
  function toggleFields() {
    locationGroup.style.display = (isDirect.checked || isDelivery.checked) ? "block" : "none";
    shippingFeeGroup.style.display = isNonface.checked ? "block" : "none";
  }

  isDirect.addEventListener("change", toggleFields);
  isDelivery.addEventListener("change", toggleFields);
  isNonface.addEventListener("change", toggleFields);
  toggleFields();

  // ---------------- 지도 모달 처리 ----------------
  let map, geocoder, centerMarker;
  const locationModal = document.getElementById("locationModal");

  // 모달이 열릴 때 지도 초기화
  locationModal.addEventListener("shown.bs.modal", () => {
    if (!map) {
      const container = document.getElementById("map");
      const options = {
        center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울 중심 좌표
        level: 3
      };

      map = new kakao.maps.Map(container, options);
      geocoder = new kakao.maps.services.Geocoder();

      centerMarker = new kakao.maps.Marker({
        map: map,
        position: map.getCenter()
      });

      // 지도가 움직일 때 중심 위치에 마커 위치 갱신, 주소 표시
      kakao.maps.event.addListener(map, 'center_changed', () => {
        const center = map.getCenter();
        centerMarker.setPosition(center);

        geocoder.coord2Address(center.getLng(), center.getLat(), (result, status) => {
          if (status === kakao.maps.services.Status.OK) {
            const address = result[0].address.address_name;
            document.getElementById("overlay-address").textContent = "📍 " + address;
          }
        });
      });
    }
  });

  // 위치 선택 버튼 클릭 시 최종 위치 및 주소 확정, 폼에 세팅
  document.getElementById("confirmLocation").addEventListener("click", () => {
    const center = map.getCenter();
    const lat = center.getLat();
    const lng = center.getLng();
    const userDetail = document.getElementById("customLocationDetail").value;

    geocoder.coord2Address(lng, lat, (result, status) => {
      if (status === kakao.maps.services.Status.OK) {
        const baseAddress = result[0].address.address_name;
        const finalAddress = userDetail ? `${baseAddress} ${userDetail}` : baseAddress;

        // 폼 입력 필드에 주소와 좌표 저장
        document.getElementById("locationText").value = finalAddress;
        document.getElementById("latitude").value = lat;
        document.getElementById("longitude").value = lng;

        // 화면에 선택된 주소 표시
        document.getElementById("selected-address").textContent = "선택된 위치: " + finalAddress;
        document.getElementById("overlay-address").textContent = "📍 " + finalAddress;

        // 미리보기 지도 렌더링
        renderPreviewMap(lat, lng);
      }
    });
  });

  // 선택된 위치 미리보기 지도 그리기
  function renderPreviewMap(lat, lng) {
    const previewContainer = document.getElementById("mapPreview");
    previewContainer.style.display = "block";
    const previewMap = new kakao.maps.Map(previewContainer, {
      center: new kakao.maps.LatLng(lat, lng),
      level: 4
    });

    new kakao.maps.Marker({
      map: previewMap,
      position: new kakao.maps.LatLng(lat, lng)
    });
  }

  // ---------------- 이미지 미리보기 + 삭제 + 대표사진 + 드래그 정렬 ----------------
  const imageInput = document.getElementById("imageInput");       // 이미지 파일 선택 input
  const imageCount = document.getElementById("imageCount");       // 선택 이미지 개수 표시 영역
  const previewContainer = document.getElementById("previewContainer"); // 이미지 미리보기 컨테이너
  const mainImageIndexInput = document.getElementById("mainImageIndex"); // 대표 이미지 인덱스 숨김 필드
  let selectedFiles = []; // 선택한 이미지 파일 리스트

  // 이미지 파일 선택 시 실행
  // 이미지 선택 시 누적 업로드 되게 수정
  imageInput.addEventListener("change", () => {
    const files = Array.from(imageInput.files);
    const maxImages = 8;

    // 🔁 이전 선택한 이미지에 새로 선택한 파일 추가
    const combinedFiles = [...selectedFiles, ...files];

    // ✅ 중복 제거 (파일명 기준)
    const fileMap = new Map();
    combinedFiles.forEach(file => fileMap.set(file.name, file));
    selectedFiles = Array.from(fileMap.values());

    // 최대 개수 제한
    if (selectedFiles.length > maxImages) {
      alert("이미지는 최대 8장까지만 업로드할 수 있어요.");
      selectedFiles = selectedFiles.slice(0, maxImages);
    }

    mainImageIndexInput.value = 0; // 대표 이미지 기본값 0
    updatePreview();               // 미리보기 갱신
  });


  // 이미지 미리보기 및 삭제 버튼 생성 함수
  function updatePreview() {
    imageCount.textContent = `${selectedFiles.length}/8`;
    previewContainer.innerHTML = "";

    selectedFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = e => {
        const wrapper = document.createElement("div");
        wrapper.className = "position-relative";
        wrapper.style.width = "80px";
        wrapper.style.height = "80px";
        wrapper.setAttribute("data-index", index); // 드래그 순서 저장용

        const img = document.createElement("img");
        img.src = e.target.result;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.border = "1px solid #ddd";
        img.style.borderRadius = "5px";

        // 첫 번째 이미지에 대표 사진 배지 표시
        if (index === 0) {
          const badge = document.createElement("div");
          badge.textContent = "대표 사진";
          badge.className = "position-absolute bottom-0 start-50 translate-middle-x bg-dark text-white px-1 small rounded";
          badge.style.fontSize = "11px";
          badge.style.opacity = "0.85";
          wrapper.appendChild(badge);
          mainImageIndexInput.value = 0;
        }

        // 삭제 버튼 생성 및 클릭 이벤트 등록
        const closeBtn = document.createElement("div");
        closeBtn.innerHTML = "&times;";
        closeBtn.className = "position-absolute top-0 end-0 bg-dark text-white rounded-circle d-flex justify-content-center align-items-center";
        closeBtn.style.width = "18px";
        closeBtn.style.height = "18px";
        closeBtn.style.cursor = "pointer";
        closeBtn.style.fontSize = "12px";
        closeBtn.style.transform = "translate(50%, -50%)";
        closeBtn.addEventListener("click", () => {
          selectedFiles.splice(index, 1); // 선택 목록에서 삭제
          updatePreview();                 // 미리보기 갱신
        });

        wrapper.appendChild(img);
        wrapper.appendChild(closeBtn);
        previewContainer.appendChild(wrapper);
      };
      reader.readAsDataURL(file);
    });
  }


  // ---------------- Sortable.js 적용: 이미지 드래그로 순서 변경 ----------------
  new Sortable(previewContainer, {
    animation: 150,
    onEnd: () => {
      const newOrder = [];
      previewContainer.querySelectorAll("div[data-index]").forEach(div => {
        const oldIndex = parseInt(div.getAttribute("data-index"));
        if (!isNaN(oldIndex)) {
          newOrder.push(selectedFiles[oldIndex]);
        }
      });
      selectedFiles = newOrder;
      updatePreview(); // 순서 변경 후 미리보기 갱신 및 대표사진 재설정
    }
  });

});

window.handleCategoryChange = handleCategoryChange;
