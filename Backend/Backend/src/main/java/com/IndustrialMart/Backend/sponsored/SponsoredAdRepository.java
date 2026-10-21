package com.IndustrialMart.Backend.sponsored;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface SponsoredAdRepository extends JpaRepository<SponsoredAd,Long> {
    List<SponsoredAd> findAllByOrderByIdDesc();
}
