package com.IndustrialMart.Backend.sponsored;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.net.URI;
import java.time.LocalDateTime;
import java.util.List;
import com.IndustrialMart.Backend.listing.ListingImageStorage;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.Authentication;

@RestController
public class SponsoredAdController {
    private final SponsoredAdRepository repository;
    private final ListingImageStorage imageStorage;
    public SponsoredAdController(SponsoredAdRepository repository, ListingImageStorage imageStorage){this.repository=repository;this.imageStorage=imageStorage;}
    @PostMapping(value="/api/admin/sponsored-ads/images", consumes="multipart/form-data")
    public ImageResult uploadImage(Authentication authentication,@RequestParam("file") MultipartFile file){
        List<String> saved=imageStorage.store(List.of(file));
        return new ImageResult(saved.get(0));
    }
    @GetMapping("/api/sponsored-ads/active")
    public List<SponsoredAd> active(){return repository.findAllByOrderByIdDesc().stream().filter(ad->ad.isCurrentlyActive(LocalDateTime.now())).toList();}
    @GetMapping("/api/admin/sponsored-ads")
    public List<SponsoredAd> all(){return repository.findAllByOrderByIdDesc();}
    @PostMapping("/api/admin/sponsored-ads") @ResponseStatus(HttpStatus.CREATED)
    public SponsoredAd create(@Valid @RequestBody SponsoredAd ad){validate(ad);return repository.save(ad);}
    @PutMapping("/api/admin/sponsored-ads/{id}")
    public SponsoredAd update(@PathVariable Long id,@Valid @RequestBody SponsoredAd request){SponsoredAd ad=repository.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));copy(request,ad);validate(ad);return repository.save(ad);}
    @DeleteMapping("/api/admin/sponsored-ads/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id){repository.deleteById(id);}
    private void validate(SponsoredAd ad){
        try { URI image=URI.create(ad.getImageUrl()); URI destination=URI.create(ad.getDestinationUrl());
            if(!List.of("http","https").contains(destination.getScheme())||destination.getHost()==null)throw new IllegalArgumentException();
            if(!ad.getImageUrl().startsWith("/")&&(!List.of("http","https").contains(image.getScheme())||image.getHost()==null))throw new IllegalArgumentException();
            if(ad.getStartsAt()!=null&&ad.getEndsAt()!=null&&ad.getEndsAt().isBefore(ad.getStartsAt()))throw new IllegalArgumentException();
        }catch(RuntimeException ex){throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Ad image, destination or dates are invalid",ex);}
    }
    private void copy(SponsoredAd src,SponsoredAd dst){dst.setTitle(src.getTitle());dst.setDescription(src.getDescription());dst.setImageUrl(src.getImageUrl());dst.setDestinationUrl(src.getDestinationUrl());dst.setActive(src.isActive());dst.setStartsAt(src.getStartsAt());dst.setEndsAt(src.getEndsAt());}
    public record ImageResult(String imageUrl){}
}
