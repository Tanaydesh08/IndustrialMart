package com.IndustrialMart.Backend.sponsored;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

@Entity
@Table(name = "sponsored_ads")
public class SponsoredAd {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @NotBlank @Size(max = 160) @Column(nullable = false, length = 160) private String title;
    @Size(max = 500) @Column(length = 500) private String description;
    @NotBlank @Size(max = 500) @Column(nullable = false, length = 500) private String imageUrl;
    @NotBlank @Size(max = 1000) @Column(nullable = false, length = 1000) private String destinationUrl;
    @Column(nullable = false) private boolean active;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    protected SponsoredAd() {}
    public Long getId(){return id;} public String getTitle(){return title;} public String getDescription(){return description;}
    public String getImageUrl(){return imageUrl;} public String getDestinationUrl(){return destinationUrl;} public boolean isActive(){return active;}
    public LocalDateTime getStartsAt(){return startsAt;} public LocalDateTime getEndsAt(){return endsAt;}
    public void setTitle(String v){title=v;} public void setDescription(String v){description=v;} public void setImageUrl(String v){imageUrl=v;}
    public void setDestinationUrl(String v){destinationUrl=v;} public void setActive(boolean v){active=v;} public void setStartsAt(LocalDateTime v){startsAt=v;} public void setEndsAt(LocalDateTime v){endsAt=v;}
    public boolean isCurrentlyActive(LocalDateTime now){return active&&(startsAt==null||!startsAt.isAfter(now))&&(endsAt==null||!endsAt.isBefore(now));}
}
