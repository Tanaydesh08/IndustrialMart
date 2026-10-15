
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
    public Listing getById(Long id) {
        return listingRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Listing not found"
                ));
    }

    public Listing create(Listing request) {
        Listing listing = new Listing(
                request.getTitle(),
                request.getDescription(),
                request.getCategorySlug(),
                request.getSellerName(),
                request.getLocation(),
                request.getPrice(),
                request.getCondition(),
                ListingStatus.PENDING_REVIEW,
                null,
                LocalDateTime.now()
        );

        return listingRepository.save(listing);
    }

    public Listing update(Long id, Listing request) {
        Listing existing = getById(id);

        existing.setTitle(request.getTitle());
        existing.setDescription(request.getDescription());
        existing.setCategorySlug(request.getCategorySlug());
        existing.setPrice(request.getPrice());
        existing.setCondition(request.getCondition());

        return listingRepository.save(existing);
    }

    public void delete(Long id) {
        Listing existing = getById(id);
        listingRepository.delete(existing);
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