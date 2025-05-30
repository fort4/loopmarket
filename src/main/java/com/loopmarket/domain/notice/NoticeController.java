package com.loopmarket.domain.notice;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.server.ResponseStatusException;

import com.loopmarket.common.controller.BaseController;
import com.loopmarket.domain.admin.notice.NoticeEntity;
import com.loopmarket.domain.admin.notice.NoticeRepository;

@Controller
@RequestMapping("/notice")
public class NoticeController extends BaseController{

    private final NoticeRepository noticeRepository;

    public NoticeController(NoticeRepository noticeRepository) {
        this.noticeRepository = noticeRepository;
    }

    // 공지사항 목록 (유저용)
    @GetMapping
    public String getNoticeList(Model model, @RequestParam(defaultValue = "0") int page) {
        int pageSize = 10;

        Pageable pageable = PageRequest.of(page, pageSize, Sort.by("createdAt").descending());
        Page<NoticeEntity> noticePage = noticeRepository.findByPublishedTrue(pageable);

        model.addAttribute("notices", noticePage.getContent());      // 현재 페이지 공지 목록
        model.addAttribute("currentPage", page);                     // 현재 페이지 번호
        model.addAttribute("totalPages", noticePage.getTotalPages()); // 전체 페이지 수

        return render("notice/notice", model); // Thymeleaf에서 페이징 처리
    }

    // 공지 상세 보기
    @GetMapping("/view/{id}")
    public String getNoticeDetail(@PathVariable("id") int id, Model model) {
        NoticeEntity notice = noticeRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        model.addAttribute("notice", notice);
        return render("notice/notice_view",model); // 상세 페이지 (새로 만드셔야 함)
    }
}