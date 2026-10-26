package com.IndustrialMart.Backend;

import com.IndustrialMart.Backend.auth.JwtService;
import com.IndustrialMart.Backend.listing.Listing;
import com.IndustrialMart.Backend.listing.ListingRepository;
import com.IndustrialMart.Backend.listing.ListingStatus;
import com.IndustrialMart.Backend.user.User;
import com.IndustrialMart.Backend.user.UserRepository;
import com.IndustrialMart.Backend.user.UserRole;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class RoleAuthorizationTests {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired ListingRepository listings;
    @Autowired JwtService jwtService;

    @Test
    void registrationRejectsAdminAndJwtMustBeValid() throws Exception {
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Bad Admin\",\"email\":\"no-admin@test.invalid\",\"password\":\"password123\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/api/categories").header("Authorization", "Bearer not-a-jwt"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void buyersAndSellersCannotUseAdminRoutesOrSellerWrites() throws Exception {
        User buyer = user(UserRole.BUYER);
        User seller = user(UserRole.SELLER);
        User otherSeller = user(UserRole.SELLER);
        Listing listing = listing(otherSeller.getId());

        mvc.perform(post("/api/listings").header("Authorization", bearer(buyer))
                        .contentType(MediaType.APPLICATION_JSON).content(listingJson()))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/listings/seller/mine").header("Authorization", bearer(buyer)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/dashboard").header("Authorization", bearer(buyer)))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/dashboard").header("Authorization", bearer(seller)))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/listings/{id}", listing.getId()).header("Authorization", bearer(seller))
                        .contentType(MediaType.APPLICATION_JSON).content(listingJson()))
                .andExpect(status().isForbidden());
        mvc.perform(put("/api/listings/{id}/moderation", listing.getId()).header("Authorization", bearer(seller))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"REJECTED\",\"reason\":\"test\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void sellerCannotForgeListingOwnerAndAdminCanModerate() throws Exception {
        User seller = user(UserRole.SELLER);
        User admin = user(UserRole.ADMIN);
        mvc.perform(post("/api/listings").header("Authorization", bearer(seller))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(listingJson()))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.sellerUserId").value(seller.getId()));

        Listing listing = listing(seller.getId());
        mvc.perform(put("/api/listings/{id}/moderation", listing.getId()).header("Authorization", bearer(admin))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"REJECTED\",\"reason\":\"Not suitable\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("REJECTED"));
    }

    @Test
    void expiredJwtDoesNotAuthenticate() throws Exception {
        String email = "expired-" + UUID.randomUUID() + "@test.invalid";
        String token = Jwts.builder().subject(email).issuedAt(new Date(System.currentTimeMillis() - 5000))
                .expiration(new Date(System.currentTimeMillis() - 1000))
                .signWith(Keys.hmacShaKeyFor("industrial-mart-test-secret-key-32-bytes-minimum".getBytes(StandardCharsets.UTF_8)))
                .compact();
        mvc.perform(get("/api/categories").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void pendingListingImagesAreVisibleOnlyToOwnerOrAdmin() throws Exception {
        User owner = user(UserRole.SELLER);
        User otherSeller = user(UserRole.SELLER);
        User buyer = user(UserRole.BUYER);
        Listing pending = listing(owner.getId());
        String key = UUID.randomUUID() + ".jpg";
        pending.setImageUrls(java.util.List.of("/api/listings/images/" + key));
        listings.saveAndFlush(pending);

        mvc.perform(get("/api/listings/images/{key}", key).header("Authorization", bearer(buyer)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/listings/images/{key}", key).header("Authorization", bearer(otherSeller)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/listings/{id}", pending.getId()).header("Authorization", bearer(buyer)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/listings/{id}", pending.getId()).header("Authorization", bearer(owner)))
                .andExpect(status().isOk());
        mvc.perform(get("/api/listings/images/{key}", key).header("Authorization", bearer(owner)))
                .andExpect(status().isServiceUnavailable());
    }

    @Test
    void authenticatedCategoryListPreservesExistingIdsAndTruckSlug() throws Exception {
        User buyer = user(UserRole.BUYER);
        mvc.perform(get("/api/categories").header("Authorization", bearer(buyer)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[7].id").value(8))
                .andExpect(jsonPath("$[7].name").value("Trucks & Vehicles"))
                .andExpect(jsonPath("$[7].slug").value("truck"));
    }

    private User user(UserRole role) {
        return users.saveAndFlush(new User(role.name(), role.name().toLowerCase() + UUID.randomUUID() + "@test.invalid", "hash", role));
    }

    private Listing listing(Long ownerId) {
        Listing listing = new Listing("Existing", "Private text", "truck", "Owner", "Pune", new BigDecimal("50"),
                "NEW", ListingStatus.PENDING_REVIEW, null, LocalDateTime.now());
        listing.setSellerUserId(ownerId);
        return listings.saveAndFlush(listing);
    }

    private String bearer(User user) { return "Bearer " + jwtService.generateToken(user); }

    private String listingJson() {
        return "{\"title\":\"Test ad\",\"description\":\"Details\",\"categorySlug\":\"truck\",\"sellerName\":\"forged\",\"sellerUserId\":999999,\"location\":\"Pune\",\"price\":100,\"condition\":\"NEW\"}";
    }
}
