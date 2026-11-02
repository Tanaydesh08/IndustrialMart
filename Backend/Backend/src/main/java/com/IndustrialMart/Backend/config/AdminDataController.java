package com.IndustrialMart.Backend.config;

import com.IndustrialMart.Backend.listing.*;
import com.IndustrialMart.Backend.sponsored.SponsoredAdRepository;
import com.IndustrialMart.Backend.user.UserRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminDataController {
    private final ListingRepository listings; private final UserRepository users; private final SponsoredAdRepository ads; private final ListingService listingService;
    public AdminDataController(ListingRepository listings,UserRepository users,SponsoredAdRepository ads,ListingService listingService){this.listings=listings;this.users=users;this.ads=ads;this.listingService=listingService;}
    @GetMapping("/dashboard")
    public Dashboard dashboard(){return new Dashboard(users.count(),listings.count(),listingService.getModerationQueue().size(),listings.countByStatus(ListingStatus.APPROVED),ads.count());}
    @GetMapping("/listings")
    public List<Listing> listings(){return listings.findAll();}
    @GetMapping("/users")
    public List<UserView> users(){return users.findAll().stream().map(user->new UserView(user.getId(),user.getFullName(),user.getEmail(),user.getRole().name(),user.getCreatedAt())).toList();}
    public record Dashboard(long totalUsers,long totalListings,long pendingModeration,long approvedListings,long sponsoredAdvertisements){}
    public record UserView(Long id,String fullName,String email,String role,java.time.LocalDateTime createdAt){}
}
