package com.loopmarket;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder; // 추가
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer; // 추가
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class LoopMarketApplication extends SpringBootServletInitializer { // 상속 추가

    // WAR 배포 시 서블릿 컨테이너가 이 메서드로 초기화함
    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder builder) {
        return builder.sources(LoopMarketApplication.class);
    }

    public static void main(String[] args) {
        SpringApplication.run(LoopMarketApplication.class, args);
    }
}