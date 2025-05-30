package com.loopmarket.domain.admin.notice;

import com.loopmarket.common.controller.BaseController;
import com.loopmarket.domain.admin.notice.dto.NoticeDTO;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import javax.servlet.http.HttpServletRequest;

@Controller
@RequestMapping("/admin/notice")
public class NoticeAdminController extends BaseController {

    private final NoticeRepository noticeRepository;

    public NoticeAdminController(NoticeRepository noticeRepository) {
        this.noticeRepository = noticeRepository;
    }
    
    private String renderAdminPage(HttpServletRequest request, Model model, String viewName) {
	    if ("XMLHttpRequest".equals(request.getHeader("X-Requested-With"))) {
	        return viewName + " :: content";
	    } else {
	        return render(viewName, model);
	    }
	}

    // 공지사항 관리 페이지 진입
    @GetMapping
    public String noticeAdminPage(HttpServletRequest request, Model model,
                                 @RequestParam(defaultValue = "0") int page) {
        int pageSize = 10;
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("createdAt").descending());
        Page<NoticeEntity> noticePage = noticeRepository.findAll(pageable);

        model.addAttribute("notices", noticePage.getContent());       // 현재 페이지 데이터
        model.addAttribute("currentPage", page);                      // 현재 페이지 번호
        model.addAttribute("totalPages", noticePage.getTotalPages()); // 전체 페이지 수

        return renderAdminPage(request, model,"admin/notice_admin");
        //return render("admin/notice_admin", model);
    }

    // 공지사항 등록 폼
    @GetMapping("/form")
    public String showNoticeForm(HttpServletRequest request, Model model) {
        model.addAttribute("notice", new NoticeDTO()); // 빈 DTO 넘기기
        //return "admin/form/notice_form :: content"; // fragment만 반환 (AJAX용)
        return renderAdminPage(request, model, "admin/form/notice_form");
    }

    // 공지사항 등록/수정 처리
    @PostMapping("/save")
    @ResponseBody
    public String saveNotice(@ModelAttribute NoticeDTO noticeDTO) {
        NoticeEntity notice;

        if (noticeDTO.getNoticeId() != null && noticeDTO.getNoticeId() > 0) {
            notice = noticeRepository.findById(noticeDTO.getNoticeId()).orElse(new NoticeEntity());
        } else {
            notice = new NoticeEntity();
        }

        notice.setTitle(noticeDTO.getTitle());
        notice.setContent(noticeDTO.getContent());
        notice.setPublished(noticeDTO.isPublished());

        noticeRepository.save(notice);
        return "success";
    }

    // 공지사항 수정 폼
    @GetMapping("/edit/{id}")
    public String editNotice(HttpServletRequest request, @PathVariable("id") int id, Model model) {
        NoticeEntity notice = noticeRepository.findById(id).orElse(null);
        if (notice == null) {
            return "redirect:/admin/notice";
        }
        model.addAttribute("notice", notice);
        //return "admin/form/notice_form :: content";
        return renderAdminPage(request, model, "admin/form/notice_form");
    }

    // 공지사항 삭제
    @PostMapping("/delete/{id}")
    @ResponseBody
    public String deleteNotice(@PathVariable("id") int id) {
        try {
            noticeRepository.deleteById(id);
            return "success";  // 삭제 성공 메시지 반환
        } catch (Exception e) {
            return "error";    // 삭제 실패 시
        }
    }
}