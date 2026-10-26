
package com.IndustrialMart.Backend.listing;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.IndustrialMart.Backend.payment.PaymentPurpose;
import com.IndustrialMart.Backend.payment.PaymentRepository;
import com.IndustrialMart.Backend.payment.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@Service
@Transactional
public class ListingService {

    private final ListingRepository listingRepository;
    private final PaymentRepository paymentRepository;

    public ListingService(ListingRepository listingRepository,
                          PaymentRepository paymentRepository) {
        this.listingRepository = listingRepository;
        this.paymentRepository = paymentRepository;
        seedSamples();
    }

    private void seedSamples() {
        if (listingRepository.count() > 0) {
            return;
        }

        listingRepository.saveAll(List.of(
                new Listing(
                        "Industrial Rice Whitener",
                        "Commercial rice whitening machine for rice mills.",
                        "rice-milling-machinery",
                        "Shree Industrial Suppliers",
                        "Raipur, Chhattisgarh",
                        new BigDecimal("250000"),
                        "NEW",
                        ListingStatus.APPROVED,
                        null,
                        LocalDateTime.now()
                ),
                new Listing(
                        "Bucket Elevator",
                        "Grain handling equipment for rice processing plants.",
                        "material-handling-equipment",
                        "AgroTech Machinery",
                        "Durg, Chhattisgarh",
                        new BigDecimal("85000"),
                        "NEW",
                        ListingStatus.APPROVED,
                        null,
                        LocalDateTime.now()
                ),
                new Listing(
                        "Rubber Rolls",
                        "Replacement rubber rolls for paddy husking machines.",
                        "spare-parts-components",
                        "Mill Parts India",
                        "Nagpur, Maharashtra",
                        new BigDecimal("12000"),
                        "NEW",
                        ListingStatus.APPROVED,
                        null,
                        LocalDateTime.now()
                )
        ));
    }

    @Transactional(readOnly = true)
    public List<Listing> getAll(String search, String categorySlug) {
        String term = search == null
                ? ""
                : search.trim().toLowerCase(Locale.ROOT);

        return listingRepository.findByStatus(ListingStatus.APPROVED)
                .stream()
                .filter(listing ->
                        term.isEmpty()
                                || listing.getTitle()
                                .toLowerCase(Locale.ROOT).contains(term)
                                || listing.getDescription()
                                .toLowerCase(Locale.ROOT).contains(term))
                .filter(listing ->
                        categorySlug == null
                                || categorySlug.isBlank()
                                || listing.getCategorySlug()
                                .equalsIgnoreCase(categorySlug.trim()))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<Listing> getRecent() {
        return listingRepository.findTop12ByStatusOrderByCreatedAtDesc(ListingStatus.APPROVED);
    }

    @Transactional(readOnly = true)
    public Listing getById(Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Listing not found"
                ));
    }

    @Transactional(readOnly = true)
    public List<Listing> getListingsContainingImage(String imageUrl) {
        return listingRepository.findByImageUrlsContaining(imageUrl);
    }

    public Listing create(Listing request, Long sellerUserId, String sellerName) {
        Listing listing = new Listing(
                request.getTitle(),
                request.getDescription(),
                request.getCategorySlug(),
                sellerName,
                request.getLocation(),
                request.getPrice(),
                request.getCondition(),
                ListingStatus.PENDING_REVIEW,
                null,
                LocalDateTime.now()
        );

        // Set from the authenticated account, never from the request body.
        listing.setSellerUserId(sellerUserId);

        return listingRepository.save(listing);
    }

    public Listing update(
            Long id,
            Listing request,
            Long currentUserId,
            boolean isAdmin
    ) {
        Listing existing = getById(id);
        verifyListingOwnership(existing, currentUserId, isAdmin);

        existing.setTitle(request.getTitle());
        existing.setDescription(request.getDescription());
        existing.setCategorySlug(request.getCategorySlug());
        existing.setLocation(request.getLocation());
        existing.setPrice(request.getPrice());
        existing.setCondition(request.getCondition());

        return listingRepository.save(existing);
    }

    public Listing addImages(Long id, Long currentUserId, boolean isAdmin, List<String> imageUrls) {
        Listing listing = getById(id);
        verifyListingOwnership(listing, currentUserId, isAdmin);
        if (listing.getImageUrls().size() + imageUrls.size() > 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A listing can have up to 8 photos");
        }
        var combined = new java.util.ArrayList<>(listing.getImageUrls());
        combined.addAll(imageUrls);
        listing.setImageUrls(combined);
        return listingRepository.save(listing);
    }

    @Transactional(readOnly = true)
    public void assertCanModify(Long id, Long currentUserId, boolean isAdmin) {
        verifyListingOwnership(getById(id), currentUserId, isAdmin);
    }

    public void delete(Long id, Long currentUserId, boolean isAdmin) {
        Listing existing = getById(id);
        verifyListingOwnership(existing, currentUserId, isAdmin);

        listingRepository.delete(existing);
    }

    private void verifyListingOwnership(
            Listing listing,
            Long currentUserId,
            boolean isAdmin
    ) {
        if (isAdmin) {
            return;
        }

        if (listing.getSellerUserId() == null
                || !listing.getSellerUserId().equals(currentUserId)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to modify this listing"
            );
        }
    }

    @Transactional(readOnly = true)
    public List<Listing> getModerationQueue() {
        return listingRepository.findByStatusIn(
                List.of(
                        ListingStatus.PENDING_REVIEW,
                        ListingStatus.NEEDS_REVIEW
                )
        );
    }

    @Transactional(readOnly = true)
    public List<Listing> getSellerListings(Long sellerUserId) {
        return listingRepository.findBySellerUserIdOrderByCreatedAtDesc(sellerUserId);
    }

    public Listing moderate(
            Long id,
            ListingStatus newStatus,
            String reason
    ) {
        if (newStatus != ListingStatus.APPROVED
                && newStatus != ListingStatus.REJECTED
                && newStatus != ListingStatus.NEEDS_REVIEW) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Allowed statuses: APPROVED, REJECTED, NEEDS_REVIEW"
            );
        }

        Listing existing = getById(id);

        if (newStatus == ListingStatus.APPROVED) {

            boolean feePaid =
                    paymentRepository.existsByListingIdAndPurposeAndStatus(
                            id,
                            PaymentPurpose.LISTING_FEE,
                            PaymentStatus.SUCCESS);

            if (!feePaid) {
                throw new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "Listing cannot be approved until its listing fee is paid");
            }
        }

        existing.setStatus(newStatus);
        existing.setModerationReason(reason);

        return listingRepository.save(existing);
    }
}
