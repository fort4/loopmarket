$(function() {
  var $profileImageInput = $('#profileImage');
  var $phoneInput = $('#phoneNumber');
  var $form = $profileImageInput.closest('form');

  // 비밀번호 관련 변수
  var $currentPwd = $('#currentPassword');
  var $newPwd = $('#newPassword');
  var $confirmPwd = $('#confirmPassword');

  var validImage = true; // 이미지 유효성 상태

  // 오류 표시 함수
  function showError($input, message) {
    clearError($input);
    $input.addClass('is-invalid');
    if (!$input.next('.invalid-feedback').length) {
      $input.after('<div class="invalid-feedback">' + message + '</div>');
    }
  }

  // 오류 초기화 함수
  function clearError($input) {
    $input.removeClass('is-invalid');
    $input.next('.invalid-feedback').remove();
  }

  // 프로필 이미지 크기 체크
  $profileImageInput.on('change', function(event) {
    var file = event.target.files[0];
    if (!file) {
      validImage = true;
      return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
      var img = new Image();
      img.onload = function() {
		if (img.width !== 100 || img.height !== 100) {
		          alert('프로필 이미지는 반드시 100x100 크기여야 합니다.');
          $profileImageInput.val('');
          validImage = false;
        } else {
          validImage = true;
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  // 폼 제출 시 유효성 검사
  $form.on('submit', function(event) {
    // 전화번호 검사
    var phone = $phoneInput.val().trim();
    if (phone !== '') {
      var phoneRegex = /^\d{2,3}-\d{3,4}-\d{4}$/;
      if (!phoneRegex.test(phone)) {
        alert('전화번호 형식이 올바르지 않습니다. 예: 010-1234-5678');
        $phoneInput.focus();
        event.preventDefault();
        return false;
      }
    }

    // 이미지 크기 검사
    if ($profileImageInput.val() !== '' && !validImage) {
      alert('프로필 이미지가 100x100 크기가 아닙니다. 수정해 주세요.');
      event.preventDefault();
      return false;
    }

    // 비밀번호 관련 유효성 검사
    clearError($currentPwd);
    clearError($newPwd);
    clearError($confirmPwd);

    var currentPassword = $currentPwd.val().trim();
    var newPassword = $newPwd.val().trim();
    var confirmPassword = $confirmPwd.val().trim();

    var isValid = true;
    var anyFilled = currentPassword !== '' || newPassword !== '' || confirmPassword !== '';
    var allFilled = currentPassword !== '' && newPassword !== '' && confirmPassword !== '';

    if (anyFilled && !allFilled) {
      if (currentPassword === '') showError($currentPwd, '현재 비밀번호를 입력하세요.');
      if (newPassword === '') showError($newPwd, '새 비밀번호를 입력하세요.');
      if (confirmPassword === '') showError($confirmPwd, '새 비밀번호 확인을 입력하세요.');
      isValid = false;
    }

    if (allFilled && newPassword !== confirmPassword) {
      showError($newPwd, '새 비밀번호와 확인이 일치하지 않습니다.');
      showError($confirmPwd, '새 비밀번호와 확인이 일치하지 않습니다.');
      isValid = false;
    }

    if (!isValid) {
      event.preventDefault();
      return false;
    }
  });
});