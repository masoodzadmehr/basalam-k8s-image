package com.library.location;

import com.library.location.dto.AssignLibrarianRequest;
import com.library.location.dto.LocationRequest;
import com.library.location.dto.LocationResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping("/halls")
    @PreAuthorize("hasAnyRole('LIBRARIAN','ADMIN')")
    public ResponseEntity<List<LocationResponse>> getAllHalls() {
        return ResponseEntity.ok(locationService.getAllHalls());
    }

    @PostMapping("/halls")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LocationResponse> createHall(@Valid @RequestBody LocationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(locationService.createHall(request));
    }

    @PutMapping("/halls/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LocationResponse> updateHall(@PathVariable Long id,
                                                       @Valid @RequestBody LocationRequest request) {
        return ResponseEntity.ok(locationService.updateHall(id, request));
    }

    @DeleteMapping("/halls/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteHall(@PathVariable Long id) {
        locationService.deleteHall(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/halls/{id}/librarian")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LocationResponse> assignLibrarianToHall(@PathVariable Long id,
                                                                  @Valid @RequestBody AssignLibrarianRequest request) {
        return ResponseEntity.ok(locationService.assignLibrarianToHall(id, request));
    }

    @GetMapping("/halls/{hallId}/bookshelves")
    @PreAuthorize("hasAnyRole('LIBRARIAN','ADMIN')")
    public ResponseEntity<List<LocationResponse>> getBookshelvesByHall(@PathVariable Long hallId) {
        return ResponseEntity.ok(locationService.getBookshelvesByHall(hallId));
    }

    @PostMapping("/halls/{hallId}/bookshelves")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LocationResponse> createBookshelf(@PathVariable Long hallId,
                                                            @Valid @RequestBody LocationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(locationService.createBookshelf(hallId, request));
    }

    @PutMapping("/bookshelves/{id}")
    @PreAuthorize("hasAnyRole('LIBRARIAN','ADMIN')")
    public ResponseEntity<LocationResponse> updateBookshelf(@PathVariable Long id,
                                                            @Valid @RequestBody LocationRequest request) {
        return ResponseEntity.ok(locationService.updateBookshelf(id, request));
    }

    @DeleteMapping("/bookshelves/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteBookshelf(@PathVariable Long id) {
        locationService.deleteBookshelf(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/bookshelves/{id}/librarian")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LocationResponse> assignLibrarianToBookshelf(@PathVariable Long id,
                                                                       @Valid @RequestBody AssignLibrarianRequest request) {
        return ResponseEntity.ok(locationService.assignLibrarianToBookshelf(id, request));
    }

    @GetMapping("/bookshelves/{bookshelfId}/shelves")
    @PreAuthorize("hasAnyRole('LIBRARIAN','ADMIN')")
    public ResponseEntity<List<LocationResponse>> getShelvesByBookshelf(@PathVariable Long bookshelfId) {
        return ResponseEntity.ok(locationService.getShelvesByBookshelf(bookshelfId));
    }

    @PostMapping("/bookshelves/{bookshelfId}/shelves")
    @PreAuthorize("hasAnyRole('LIBRARIAN','ADMIN')")
    public ResponseEntity<LocationResponse> createShelf(@PathVariable Long bookshelfId,
                                                        @Valid @RequestBody LocationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(locationService.createShelf(bookshelfId, request));
    }

    @PutMapping("/shelves/{id}")
    @PreAuthorize("hasAnyRole('LIBRARIAN','ADMIN')")
    public ResponseEntity<LocationResponse> updateShelf(@PathVariable Long id,
                                                        @Valid @RequestBody LocationRequest request) {
        return ResponseEntity.ok(locationService.updateShelf(id, request));
    }

    @DeleteMapping("/shelves/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteShelf(@PathVariable Long id) {
        locationService.deleteShelf(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/shelves/{id}/librarian")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LocationResponse> assignLibrarianToShelf(@PathVariable Long id,
                                                                   @Valid @RequestBody AssignLibrarianRequest request) {
        return ResponseEntity.ok(locationService.assignLibrarianToShelf(id, request));
    }
}
