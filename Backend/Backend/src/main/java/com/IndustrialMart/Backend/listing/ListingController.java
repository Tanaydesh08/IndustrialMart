
package com.IndustrialMart.Backend.listing;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/listings")
public class ListingController {

    private final ListingService listingService;

    public ListingController(ListingService listingService) {
        this.listingService = listingService;
    }

    @GetMapping
    public List<Listing> getAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category
    ) {
        return listingService.getAll(search, category);
    }

    // Admin: get listings waiting for moderation
    @GetMapping("/moderation")
    public List<Listing> getModerationQueue() {
        return listingService.getModerationQueue();
    }

    // Admin: approve, reject, or request further review
    @PutMapping("/{id}/moderation")
    public Listing moderate(
            @PathVariable Long id,
            @Valid @RequestBody ModerationRequest request
    ) {
        return listingService.moderate(
                id,
                request.status(),
                request.reason()
        );
    }

    @GetMapping("/{id}")
    public Listing getById(@PathVariable Long id) {
        return listingService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Listing create(@Valid @RequestBody Listing request) {
        return listingService.create(request);
    }

    @PutMapping("/{id}")
    public Listing update(
            @PathVariable Long id,
            @Valid @RequestBody Listing request
    ) {
        return listingService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        listingService.delete(id);
    }

    public record ModerationRequest(
            @NotNull ListingStatus status,
            @NotBlank String reason
    ) {
    }
}
