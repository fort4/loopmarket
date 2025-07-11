package com.loopmarket.domain.chat.dto;

import java.time.format.DateTimeFormatter;
import com.loopmarket.domain.chat.entity.ChatMessageEntity;

import lombok.*;

/**
 * WebSocket을 통한 채팅 메시지 전송/수신 DTO
 * - 프론트에서 메시지 보낼 때 사용
 * - 서버에서 브로커를 통해 클라이언트에 전달할 때도 사용
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDTO {
    private Long roomId;      // 채팅방 ID
    private Integer senderId; // 보낸 사람의 사용자 ID
    private String content;   // 메시지 내용
    
    //1회성 메시지(갱신 트리거)
    private MessageType type; // 메시지 유형: CHAT, ENTER, LEAVE, READ

    private String timestamp; // ISO 포맷 시간 문자열 (서버에서 응답 시 사용)
    private boolean read;     // 읽음 여부 (서버에서 클라이언트에게 알림 시)
    private Long msgId; // 메시지 아이디
    private boolean isMine; // 내가 전송한 메시지인지
    private String imageUrl; // 이미지 경로, null 허용
    /**
     * 메시지 유형 열거형
     */
    public enum MessageType {
        CHAT,   // 일반 메시지
        ENTER,  // 입장
        LEAVE,   // 나감
        READ    // 읽음
    }
    
    public static ChatMessageDTO fromEntity(ChatMessageEntity msg, MessageType type) {
        return ChatMessageDTO.builder()
                .msgId(msg.getMsgId())
                .roomId(msg.getRoomId())
                .senderId(msg.getSenderId())
                .content(msg.getContent())
                .imageUrl(msg.getImageUrl())
                .timestamp(msg.getSentAt().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME))
                .read(msg.isRead())
                .type(type) //타입 주입
                .build();
    }

}

