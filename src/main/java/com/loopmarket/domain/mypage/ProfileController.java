package com.loopmarket.domain.mypage;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.InitBinder;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import com.loopmarket.common.controller.BaseController;
import com.loopmarket.domain.image.service.ImageService;
import com.loopmarket.domain.member.MemberEntity;
import com.loopmarket.domain.member.MemberRepository;
import com.loopmarket.domain.product.service.ProductService;

import javax.servlet.http.HttpSession;

import java.beans.PropertyEditorSupport;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Controller
public class ProfileController extends BaseController {

	private final MemberRepository memberRepository;
	private final PasswordEncoder passwordEncoder;
	private final ProductService productService;
	private final ImageService imageService;

	public ProfileController(MemberRepository memberRepository, PasswordEncoder passwordEncoder,
			ProductService productService, ImageService imageService) {
		this.memberRepository = memberRepository;
		this.productService = productService;
		this.passwordEncoder = passwordEncoder;
		this.imageService = imageService;
	}

	// 이 부분이 핵심: String → LocalDate 변환기 등록
	@InitBinder
	public void initBinder(WebDataBinder binder) {
		DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
		binder.registerCustomEditor(LocalDate.class, new PropertyEditorSupport() {
			@Override
			public void setAsText(String text) {
				if (text == null || text.trim().isEmpty()) {
					setValue(null);
				} else {
					setValue(LocalDate.parse(text, dateFormatter));
				}
			}

			@Override
			public String getAsText() {
				LocalDate value = (LocalDate) getValue();
				return (value != null ? value.format(dateFormatter) : "");
			}
		});
	}

	@GetMapping("/mypage/edit")
	public String editProfileForm(Model model, HttpSession session) {
		MemberEntity member = (MemberEntity) session.getAttribute("loginUser");
		if (member == null) {
			return "redirect:/member/login";
		}

		// productService.getProfileImagePath는 이미 /images/profiles/ 경로 붙여서 반환하도록 되어있다면,
		// 그대로 쓰면 됩니다.
		String profileImagePath = imageService.getProfilePath(member.getUserId());

		model.addAttribute("users", member);
		model.addAttribute("profileImagePath", profileImagePath);

		return render("mypage/edit_profile", model);
	}

	@PostMapping("/mypage/edit")
	public String updateProfile(@ModelAttribute MemberEntity formMember,
			@RequestParam(value = "profileImage", required = false) MultipartFile profileImage,
			@RequestParam(value = "currentPassword", required = false) String currentPassword,
			@RequestParam(value = "newPassword", required = false) String newPassword,
			@RequestParam(value = "confirmPassword", required = false) String confirmPassword, HttpSession session,
			Model model, RedirectAttributes redirectAttributes) throws IOException {

		MemberEntity sessionUser = (MemberEntity) session.getAttribute("loginUser");
		if (sessionUser == null) {
			redirectAttributes.addFlashAttribute("errorMessage", "로그인이 필요합니다.");
			return "redirect:/member/login";
		}

		MemberEntity member = memberRepository.findById(sessionUser.getUserId()).orElse(null);
		if (member == null) {
			redirectAttributes.addFlashAttribute("errorMessage", "사용자 정보를 찾을 수 없습니다.");
			return "redirect:/member/login";
		}

		// 1. 프로필 이미지 업데이트
		if (profileImage != null && !profileImage.isEmpty()) {
			String savedPath = imageService.uploadProfileImage(member.getUserId().longValue(), profileImage);
			member.setProfileImgId(savedPath); // S3나 서버 경로
			memberRepository.save(member);
			session.setAttribute("loginUser", member);
		}

		// 2. 일반 정보 업데이트
		member.setNickname(formMember.getNickname());
		member.setPhoneNumber(formMember.getPhoneNumber());
		member.setBirthdate(formMember.getBirthdate());

		// 3. 비밀번호 변경 처리
		// 새 비밀번호나 확인 비밀번호가 입력됐으면 비밀번호 변경 검증 시작
		if ((newPassword != null && !newPassword.isEmpty())
				|| (confirmPassword != null && !confirmPassword.isEmpty())) {

			// 현재 비밀번호가 없으면 에러
			if (currentPassword == null || currentPassword.isEmpty()) {
				model.addAttribute("users", member);
				model.addAttribute("profileImagePath", productService.getProfileImagePath(member.getProfileImgId()));
				model.addAttribute("errorMessage", "비밀번호를 변경하려면 현재 비밀번호를 입력해야 합니다.");
				return render("mypage/edit_profile", model);
			}

			// 현재 비밀번호가 맞는지 확인
			if (!passwordEncoder.matches(currentPassword, member.getPassword())) {
				model.addAttribute("users", member);
				model.addAttribute("profileImagePath", productService.getProfileImagePath(member.getProfileImgId()));
				model.addAttribute("errorMessage", "현재 비밀번호가 일치하지 않습니다.");
				return render("mypage/edit_profile", model);
			}

			// 새 비밀번호와 확인 비밀번호가 모두 입력됐는지 확인
			if (newPassword == null || newPassword.isEmpty() || confirmPassword == null || confirmPassword.isEmpty()) {
				model.addAttribute("users", member);
				model.addAttribute("profileImagePath", productService.getProfileImagePath(member.getProfileImgId()));
				model.addAttribute("errorMessage", "새 비밀번호와 새 비밀번호 확인을 모두 입력하세요.");
				return render("mypage/edit_profile", model);
			}

			// 새 비밀번호와 확인 비밀번호가 같은지 확인
			if (!newPassword.equals(confirmPassword)) {
				model.addAttribute("users", member);
				model.addAttribute("profileImagePath", productService.getProfileImagePath(member.getProfileImgId()));
				model.addAttribute("errorMessage", "새 비밀번호와 새 비밀번호 확인이 일치하지 않습니다.");
				return render("mypage/edit_profile", model);
			}

			// 비밀번호 변경
			member.setPassword(passwordEncoder.encode(newPassword));

		} else if (currentPassword != null && !currentPassword.isEmpty()) {
			// 새 비밀번호와 확인 비밀번호가 비었는데 현재 비밀번호만 입력된 경우 (변경할 비밀번호가 없으니 에러)
			model.addAttribute("users", member);
			model.addAttribute("profileImagePath", productService.getProfileImagePath(member.getProfileImgId()));
			model.addAttribute("errorMessage", "비밀번호를 변경하려면 새 비밀번호와 새 비밀번호 확인을 모두 입력하세요.");
			return render("mypage/edit_profile", model);
		}

		member.setUpdatedAt(LocalDateTime.now());
		memberRepository.save(member);
		session.setAttribute("loginUser", member);

		redirectAttributes.addFlashAttribute("successMessage", "프로필이 성공적으로 수정되었습니다.");
		return "redirect:/mypage";
	}
}