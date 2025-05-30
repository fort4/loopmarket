package com.loopmarket.domain.image.service;

import com.loopmarket.common.service.S3Service;
import com.loopmarket.domain.image.entity.ImageEntity;
import com.loopmarket.domain.image.repository.ImageRepository;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ImageService {

  private final ImageRepository imageRepository;
  private final S3Service s3Service;

  public void saveImagesForProduct(Long productId, List<MultipartFile> images, int mainImageIndex) {
    for (int i = 0; i < images.size(); i++) {
      MultipartFile file = images.get(i);
      try {
        String savedPath = s3Service.upload(file);
        ImageEntity image = ImageEntity.builder()
          .targetTable("products")
          .targetId(productId)
          .imagePath(savedPath)
          .isThumbnail(i == mainImageIndex)
          .imgSeq(i)
          .build();
        imageRepository.save(image);
      } catch (IOException e) {
        throw new RuntimeException("이미지 업로드 실패", e);
      }
    }
  }

  public List<String> getAllImagePaths(Long productId) {
    List<ImageEntity> images = imageRepository.findByTargetTableAndTargetId("products", productId);
    return images.stream()
      .map(ImageEntity::getImagePath)
      .collect(Collectors.toList());
  }

  public String getThumbnailPath(Long productId) {
    ImageEntity thumbnail = imageRepository.findFirstByTargetIdAndIsThumbnail(productId, true);
    if (thumbnail == null) {
      return "/img.pay/kakao.png";
    }
    return thumbnail.getImagePath();
  }
}
