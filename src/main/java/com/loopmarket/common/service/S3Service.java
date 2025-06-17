package com.loopmarket.common.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetUrlRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class S3Service {

  private final S3Client s3Client;

  @Value("${cloud.aws.s3.bucket}")
  private String bucket;

  public String upload(MultipartFile file) throws IOException {
	    String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();

	    PutObjectRequest request = PutObjectRequest.builder()
	      .bucket(bucket)
	      .key(fileName)
	      .contentType(file.getContentType())
	      .build();

	    s3Client.putObject(request, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

	    return s3Client.utilities().getUrl(GetUrlRequest.builder()
	      .bucket(bucket)
	      .key(fileName)
	      .build()).toExternalForm();
	  }

  public String uploadFile(MultipartFile file, String folderName) throws IOException {
    String fileName = folderName + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
    
    // multipart 처리기가 로컬 임시폴더(/Temp/)에 저장한 파일을
    // 요청처리 후 자동으로 삭제하는 기능을 원활히 해주기 위해
    // 명시적으로 InputStream을 직접 열고 닫았습니다
    try (InputStream inputStream = file.getInputStream()) {
        PutObjectRequest request = PutObjectRequest.builder()
                .bucket(bucket)
                .key(fileName)
                .contentType(file.getContentType())
                .build();

        s3Client.putObject(request, RequestBody.fromInputStream(inputStream, file.getSize()));
    }

    return s3Client.utilities().getUrl(GetUrlRequest.builder()
      .bucket(bucket)
      .key(fileName)
      .build()).toExternalForm();
  }

}
